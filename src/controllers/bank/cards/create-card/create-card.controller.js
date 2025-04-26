  import {
    apiResponseHandler,
    ApiResponse,
  } from "../../../../middleware/api/api.response.middleware.js";
  import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
  import { CardModel } from "../../../../models/index.js";
  import { StatusCodes } from "http-status-codes";

  export const createNewCard = apiResponseHandler(async (req, res) => {
    const user = req?.user?._id;

    const { card_name, card_number, valid_thru, type, status } = req.body;

    const existing_card = await CardModel.findOne({
      $or: [{ card_number }, { card_name }],
    });

    if (existing_card)
      throw new CustomErrors(`card with name or number already exists`, StatusCodes.CONFLICT);

    const new_card = await CardModel({
      user,
      card_name,
      card_number,
      valid_thru,
      type,
      status,
    });

    await new_card.save({ runvalidator: true });

    return new ApiResponse(StatusCodes.OK, { card: new_card }, "card created successfully");
  });
