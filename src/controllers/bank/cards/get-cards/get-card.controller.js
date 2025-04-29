import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { CardModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getCards = apiResponseHandler(async (req) => {
  const cards = await CardModel.aggregate([
    {
      $match: {
        user: req?.user?._id,
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "user",
        foreignField: "user",
        as: "user",
      },
    },
    {
      $addFields: {
        user_details: {
          $first: "$user",
        },
      },
    },
    {
      $project: {
        user: 0,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { cards }, "cards fetched");
});
