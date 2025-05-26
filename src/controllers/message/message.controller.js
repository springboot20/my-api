import { apiResponseHandler, ApiResponse } from "../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { UserModel, RequestMessageModel } from "../../models/index.js";
import { AvailableRequestStatusEnums } from "../../constants.js";

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

  console.log(req.body);
  console.log(status);

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

  const updatedAdminRequestMessage = await RequestMessageModel.findByIdAndUpdate(
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

  if (!updatedAdminRequestMessage) {
    throw new CustomErrors(
      "error while updating request message",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return new ApiResponse(
    StatusCodes.OK,
    updatedAdminRequestMessage,
    "message status updated successfully"
  );
});
