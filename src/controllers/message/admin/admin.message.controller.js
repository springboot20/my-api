import { StatusCodes } from "http-status-codes";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { RequestMessageModel } from "../../../models/index.js";
import socketEvents from "../../../enums/socket-events.js";
import { emitSocketEventToAdmin, emitSocketEventToUser } from "../../../socket/socket.js";
import mongoose from "mongoose";

const emitToReceivers = (req, receivers, event, data, excludeId = null) => {
  receivers?.forEach((receiver) => {
    const receiverId = receiver?._id?.toString();
    if (receiverId && receiverId !== excludeId?.toString()) {
      emitSocketEventToUser(req, event, `users-${receiverId}`, { data });
    }
  });
};

export const adminSendRequest = apiResponseHandler(async (req, res) => {
  const { receivers, message, type, adminMessageTitle } = req.body;

  console.log(receivers);

  const userId = req?.user?._id;

  if (receivers?.includes(userId)) {
    throw new CustomErrors("Sender should not be among receivers", StatusCodes.BAD_REQUEST);
  }

  const uniqueReceivers = [...new Set(receivers)];
  const participants = [...uniqueReceivers, userId];

  const newAdminMessage = await RequestMessageModel.create({
    user: userId,
    receivers: participants,
    message,
    type,
    adminMessageTitle,
    isRead: false,
  });

  const populated = await RequestMessageModel.findById(newAdminMessage._id)
    .populate("user", "_id firstname lastname email avatar")
    .populate("receivers", "_id firstname lastname email avatar")
    .populate("reviewedBy", "_id firstname lastname email avatar");

  const dataPayload = {
    _id: populated._id,
    type: populated.type,
    message: populated.message,
    adminMessageTitle: populated.adminMessageTitle,
    user: populated.user,
    isRead: false,
    createdAt: populated.createdAt,
    priority: populated.priority,
  };

  // Emit to all receivers except the admin/sender
  emitToReceivers(
    req,
    populated.receivers,
    socketEvents.ADMIN_MESSAGE_BROADCAST,
    dataPayload,
    userId
  );

  console.log(populated?.receivers);

  // Admin room broadcast
  emitSocketEventToAdmin(req, socketEvents.ADMIN_MESSAGE_BROADCAST, "admin-room", {
    data: {
      ...dataPayload,
      receivers: populated.receivers,
      sentBy: populated.user,
    },
  });

  return new ApiResponse(
    StatusCodes.CREATED,
    populated,
    "admin message broadcast sent successfully"
  );
});

export const adminUpdateRequestMessageStatus = apiResponseHandler(async (req) => {
  const { status, adminNotes, requestId } = req.body;

  if (!AvailableRequestStatusEnums.includes(status)) {
    throw new CustomErrors("invalid status", StatusCodes.BAD_REQUEST);
  }

  const requestObjectId = new mongoose.Types.ObjectId(requestId);

  const message = await RequestMessageModel.findOne({ _id: requestObjectId });

  console.log(message.status);

  if (!message) {
    throw new CustomErrors("request message not found or already processed", StatusCodes.NOT_FOUND);
  }

  if (message.status === status) {
    message.adminNotes = !message.adminNotes ? adminNotes : message.adminNotes;
    await message.save();

    emitSocketEventToUser(req, socketEvents.REQUEST_STATUS_UPADATE, `users-${message?.user}`, {
      data: {
        requestId: message?._id,
        status: message?.status,
        adminNotes: message?.adminNotes,
        reviewedAt: message?.reviewedAt,
      },
    });

    emitSocketEventToAdmin(req, socketEvents.REQUEST_UPADATED, "admin-room", {
      requestId: message?._id,
      status: message?.status,
      adminNotes: message?.adminNotes,
    });

    return new ApiResponse(
      StatusCodes.OK,
      await message.populate("user", "_id email lastname firstname avatar"),
      "request message retrieved successfully"
    );
  }

  const updatedrequestMessage = await RequestMessageModel.findByIdAndUpdate(
    message?._id,
    {
      $set: {
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).populate("user", "lastname firstname email avatar");

  emitSocketEventToUser(
    req,
    socketEvents.REQUEST_STATUS_UPADATE,
    `user-${updatedrequestMessage?.user}`,
    {
      data: {
        requestId: updatedrequestMessage?._id,
        status: updatedrequestMessage?.status,
        adminNotes: updatedrequestMessage?.adminNotes,
        reviewedAt: updatedrequestMessage?.reviewedAt,
      },
    }
  );

  emitSocketEventToAdmin(req, socketEvents.REQUEST_UPADATED, "admin-room", {
    requestId: updatedrequestMessage?._id,
    status: updatedrequestMessage?.status,
    adminNotes: updatedrequestMessage?.adminNotes,
  });

  const pendingCount = await RequestMessageModel.countDocuments({ status: "PENDING" });
  emitSocketEventToAdmin(req, socketEvents.ADMIN_NOTIFICATION_COUNT, "admin-room", pendingCount);

  if (!updatedrequestMessage) {
    throw new CustomErrors(
      "error while updating request message",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return new ApiResponse(
    StatusCodes.OK,
    updatedrequestMessage,
    "message status updated successfully"
  );
});
