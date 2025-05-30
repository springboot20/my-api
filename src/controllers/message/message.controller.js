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
    .populate("userId", "_id email username avatar")
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
        userId: userObjectId,
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
        localField: "userId",
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
      $project: {
        _id: 1,
        userId: 1,
        userEmail: 1,
        username: 1,
        action: 1,
        message: 1,
        status: 1,
        reviewedBy: 1,
        reviewedAt: 1,
        adminNotes: 1,
        priority: 1,
        createdAt: 1,
        updatedAt: 1,
        userDetails: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          email: "$userDetails.email",
          avatar: "$userDetails.avatar",
        },
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
    userId,
    status: "PENDING",
  });

  if (userPendingRequests >= 3) {
    throw new CustomErrors(
      "You have too many pending requests. Please wait for them to be reviewed.",
      StatusCodes.TOO_MANY_REQUESTS
    );
  }

  const request = new RequestMessageModel({
    userId,
    userEmail: user?.email,
    username: user?.username,
    message,
    action,
    status: "PENDING",
  });

  await request.populate("userId", "name email avatar");
  await request.save();

  emitSocketEventToAdmin(req, socketEvents.NEW_ADMIN_REQUEST, "admin-room", {
    data: {
      _id: request._id,
      action: request.action,
      message: request.message,
      user: {
        id: request.userId,
        name: request.username,
        email: request.email,
      },
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
    userId,
    status: "PENDING",
  });

  const userRecentRequests = await RequestMessageModel.find({
    userId,
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

export const adminUpdateRequestMessageStatus = apiResponseHandler(async (req) => {
  const { status, adminNotes, requestId } = req.body;

  if (!AvailableRequestStatusEnums.includes(status)) {
    throw new CustomErrors("invalid status", StatusCodes.BAD_REQUEST);
  }

  const message = await RequestMessageModel.findOne({ _id: requestId });

  console.log(message.status);

  if (!message) {
    throw new CustomErrors("request message not found or already processed", StatusCodes.NOT_FOUND);
  }

  if (message.status === status) {
    return new ApiResponse(
      StatusCodes.OK,
      await message.populate("userId", "_id email username avatar"),
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
  ).populate("userId", "username email avatar");

  emitSocketEventToUser(
    req,
    socketEvents.REQUEST_STATUS_UPADATE,
    `user-${updatedrequestMessage?.userId}`,
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
