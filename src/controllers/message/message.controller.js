import { apiResponseHandler, ApiResponse } from "../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { UserModel, RequestMessageModel } from "../../models/index.js";
import { AvailableRequestStatusEnums } from "../../constants.js";
import { emitSocketEventToUser, emitSocketEventToAdmin } from "../../socket/socket.js";
import socketEvents from "../../enums/socket-events.js";
import mongoose from "mongoose";
import { getMognogoosePagination } from "../../utils/index.js";

export const getRequestMessageById = apiResponseHandler(async (req) => {
  const { requestId } = req.params;

  const message = await RequestMessageModel.findOne({ _id: new mongoose.Types.ObjectId(requestId) })
    .populate("user", "_id email username avatar")
    .populate("reviewedBy", "_id email username avatar role");

  if (!message) {
    throw new CustomErrors("request message not found", StatusCodes.NOT_FOUND);
  }

  return new ApiResponse(StatusCodes.OK, message, "request message retrieved successfully");
});

export const getUserRequestMessages = apiResponseHandler(async (req) => {
  const userId = req.user?._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const { page = 1, limit = 10, status } = req.query;

  const userMessagesAggregation = RequestMessageModel.aggregate([
    {
      $match: {
        user: userObjectId,
      },
    },
    {
      $match: status
        ? {
            status: {
              $regex: new RegExp(status, "i"), // Case-insensitive match for status
              $options: "i",
            },
          }
        : {},
    },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },

    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true, // Keep messages without user details
      },
    },

    {
      $sort: { createdAt: -1 }, // Sort by creation date, most recent first
    },
  ]);

  const messages = await RequestMessageModel.aggregatePaginate(
    userMessagesAggregation,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: "totalMessages",
      },
    })
  );

  return new ApiResponse(StatusCodes.OK, messages, "messages fetched successfully");
});

export const getAllRequestMessages = apiResponseHandler(async (req) => {
  const { page = 1, limit = 10, status } = req.query;

  const messageAggretation = RequestMessageModel.aggregate([
    {
      $match: status
        ? {
            status: {
              $regex: new RegExp(status, "i"), // Case-insensitive match for status
              $options: "i",
            },
          }
        : {},
    },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },

    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true, // Keep messages without user details
      },
    },

    {
      $sort: { createdAt: -1 }, // Sort by creation date, most recent first
    },
  ]);

  const messages = await RequestMessageModel.aggregatePaginate(
    messageAggretation,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: "totalMessages",
      },
    })
  );

  return new ApiResponse(StatusCodes.OK, messages, "messages fetched successfully");
});

export const accountMessageRequest = apiResponseHandler(async (req) => {
  const { action, message } = req.body;

  // Validate input
  if (!action || !message) {
    throw new CustomErrors("Action and message are required", StatusCodes.BAD_REQUEST);
  }

  if (message.length < 10 || message.length > 500) {
    throw new CustomErrors("Message must be between 10-500 characters", StatusCodes.BAD_REQUEST);
  }

  const userId = req.user?._id;

  const user = await UserModel.findOne({
    _id: userId,
    role: "USER",
  });

  if (!user) throw new CustomErrors("user not found", StatusCodes.NOT_FOUND);

  const userPendingRequests = await RequestMessageModel.countDocuments({
    user: userId,
    status: "PENDING",
  });

  if (userPendingRequests >= 3) {
    throw new CustomErrors(
      "You have too many pending requests. Please wait for them to be reviewed.",
      StatusCodes.TOO_MANY_REQUESTS
    );
  }

  const request = new RequestMessageModel({
    user: userId,
    userEmail: user?.email,
    username: user?.username,
    message,
    action,
    status: "PENDING",
  });

  await request.populate("user", "name email avatar");
  await request.save();

  emitSocketEventToAdmin(req, socketEvents.NEW_ADMIN_REQUEST, "admin-room", {
    data: {
      _id: request._id,
      action: request.action,
      message: request.message,
      user: {
        id: request.user,
        name: request.username,
        email: request.email,
      },
      createdAt: request.createdAt,
      status: request.status,
    },
  });

  emitSocketEventToUser(req, socketEvents.NEW_ADMIN_REQUEST, `user-${request?.user}`, {
    data: {
      _id: request._id,
      action: request.action,
      message: request.message,
      createdAt: request.createdAt,
      status: request.status,
    },
  });

  const pendingCount = await RequestMessageModel.countDocuments({ status: "PENDING" });
  emitSocketEventToAdmin(req, socketEvents.ADMIN_NOTIFICATION_COUNT, "admin-room", pendingCount);

  if (!request) {
    throw new CustomErrors("error creating admin request.", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      requestId: request?._id,
      status: request?.status,
    },
    "message sent successful"
  );
});

export const getUserPendingRequestMessages = apiResponseHandler(async (req) => {
  const userId = req.user?._id;

  const userPendingRequests = await RequestMessageModel.countDocuments({
    user: userId,
    status: "PENDING",
  });

  const userRecentRequests = await RequestMessageModel.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("action status createdAt reviewedAt adminNotes");

  if (!userPendingRequests || !userRecentRequests) {
    throw new CustomErrors("internal server error.", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return new ApiResponse(
    StatusCodes.OK,
    {
      pendingRequests: userPendingRequests,
      recentRequests: userRecentRequests,
    },
    "pending requests fetched successfully."
  );
});

export const markAsRead = apiResponseHandler(async (req, res) => {
  const { requestId } = req.params;
  const { isRead } = req.body;

  const requestObjectId = new mongoose.Types.ObjectId(requestId);

  const requestMessage = await RequestMessageModel.findByIdAndUpdate(
    requestObjectId,
    {
      $set: {
        isRead,
      },
    },
    { new: true }
  );

  if (!requestMessage) {
    throw new CustomErrors(
      "error while marking request message.",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return new ApiResponse(StatusCodes.OK, {}, "message marked as read successfully.");
});

export const adminSendRequest = apiResponseHandler(async (req, res) => {
  const { receivers, message, type, adminMessageTitle } = req.body;

  console.log(receivers);

  const userId = req?.user?._id;

  const user = await UserModel.findOne({
    _id: userId,
    $or: [{ role: "ADMIN" }, { role: "MODERATOR" }],
  });

  if (!user) throw new CustomErrors("user not found", StatusCodes.NOT_FOUND);

  if (receivers?.includes(userId)) {
    throw new CustomErrors(
      "Reciever payload should not contain the message sender",
      StatusCodes.BAD_REQUEST
    );
  }

  const messageMember = [...new Set([...receivers, userId])];

  const newAdminMessage = await RequestMessageModel.create({
    user: req.user._id,
    receivers: messageMember,
    isRead: false,
    userEmail: user?.email,
    username: user?.username,
    message,
    adminMessageTitle,
    type,
  });

  const populatedMessage = await RequestMessageModel.findById(newAdminMessage._id) 
    .populate("user", "_id username email avatar")
    .populate("receivers", "_id username email avatar");

  populatedMessage?.receivers?.forEach((receiver) => {
    if (userId === receiver?.toString()) return;

    emitSocketEventToUser(req, socketEvents.ADMIN_MESSAGE_BROADCAST, `user-${receiver}`, {
      data: {
        _id: populatedMessage._id,
        type: populatedMessage.type,
        message: populatedMessage.message,
        adminMessageTitle: populatedMessage.adminMessageTitle,
        user: populatedMessage.user,
        isRead: false,
        createdAt: populatedMessage.createdAt,
        priority: populatedMessage.priority,
      },
    });
  });

  populatedMessage?.receivers?.forEach((receiver) => {
    if (userId !== receiver?.toString()) return;

    emitSocketEventToAdmin(req, socketEvents.ADMIN_MESSAGE_BROADCAST, `admin-room`, {
      data: {
        _id: populatedMessage._id,
        type: populatedMessage.type,
        message: populatedMessage.message,
        adminMessageTitle: populatedMessage.adminMessageTitle,
        receivers: populatedMessage.receivers,
        sentBy: populatedMessage.user,
        createdAt: populatedMessage.createdAt,
      },
    });
  });

  return new ApiResponse(
    StatusCodes.CREATED,
    populatedMessage,
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

    emitSocketEventToUser(req, socketEvents.REQUEST_STATUS_UPADATE, `user-${message?.user}`, {
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
      await message.populate("user", "_id email username avatar"),
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
  ).populate("user", "username email avatar");

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

export const deleteRequestMessage = apiResponseHandler(async (req, res) => {
  const { requestId } = req.params;

  const requestObjectId = new mongoose.Types.ObjectId(requestId);
  const deletedMessage = await RequestMessageModel.findOneAndDelete({ _id: requestObjectId });

  if (!deletedMessage) {
    throw new CustomErrors(
      "error while deleteting request message",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
  return new ApiResponse(StatusCodes.OK, {}, "message deleted successfully");
});
