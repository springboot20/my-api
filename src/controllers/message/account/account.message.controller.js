import { StatusCodes } from "http-status-codes";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { RequestMessageModel, UserModel } from "../../../models/index.js";
import { emitSocketEventToAdmin, emitSocketEventToUser } from "../../../socket/socket.js";
import socketEvents from "../../../enums/socket-events.js";

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
    message,
    action,
    status: "PENDING",
  });

  await request.populate("user", "lastname firstname email avatar _id");
  await request.save();

  console.log(request);

  emitSocketEventToAdmin(req, socketEvents.NEW_ADMIN_REQUEST, "admin-room", {
    data: {
      _id: request._id,
      action: request.action,
      message: request.message,
      user: request.user,
      createdAt: request.createdAt,
      status: request.status,
    },
  });

  console.log(`users-${request.user._id.toString()}`);

  emitSocketEventToUser(
    req,
    socketEvents.NEW_ADMIN_REQUEST,
    `users-${request.user._id.toString()}`,
    {
      data: {
        _id: request._id,
        action: request.action,
        message: request.message,
        createdAt: request.createdAt,
        status: request.status,
      },
    }
  );

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
