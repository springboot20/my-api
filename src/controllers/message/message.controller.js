import { apiResponseHandler, ApiResponse } from "../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { RequestMessageModel } from "../../models/index.js";
// import { AvailableRequestStatusEnums } from "../../constants.js";
// import { emitSocketEventToUser, emitSocketEventToAdmin } from "../../socket/socket.js";
// import socketEvents from "../../enums/socket-events.js";
import mongoose from "mongoose";
import { getMognogoosePagination } from "../../utils/index.js";

export const getRequestMessageById = apiResponseHandler(async (req) => {
  const { requestId } = req.params;

  const message = await RequestMessageModel.findOne({ _id: new mongoose.Types.ObjectId(requestId) })
    .populate("user", "_id email firstname lastname avatar")
    .populate("receivers", "_id email firstname lastname avatar role")
    .populate("reviewedBy", "_id email firstname lastname avatar role");

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
