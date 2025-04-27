import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { CardModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import AccountService from "../../../../service/account/account.service.js";

export const createNewCard = apiResponseHandler(async (req, res) => {
  const userId = req?.user?._id;

  const { card_name, valid_thru, type, status, card_number, primary_account } = req.body;

  const existing_card = await CardModel.findOne({
    card_name,
    user: userId,
  });

  if (existing_card) {
    throw new CustomErrors(`Card with name "${card_name}" already exists`, StatusCodes.CONFLICT);
  }

  const cvv = AccountService.generateCVV();

  const newCard = await CardModel.create({
    user: userId,
    card_name,
    card_number,
    valid_thru,
    type,
    status,
    primary_account,
    cvv,
  });

  if (!newCard) {
    throw new CustomErrors("Failed to create card", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Link card to account
  await AccountService.linkCardToAccount(primary_account, newCard._id);

  // Return card info without sensitive data
  const cardResponse = newCard.toObject();
  delete cardResponse.cvv;

  return new ApiResponse(StatusCodes.CREATED, { card: cardResponse }, "Card created successfully");
});

export const generateCardNumber = apiResponseHandler(async (req) => {
  const card_number = await AccountService.generateUniqueCardNumber();

  return new ApiResponse(
    StatusCodes.CREATED,
    { card_number },
    "Card number generated successfully"
  );
});

export const linkCardToAccount = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { cardId, accountId } = req.body;

  // Verify the card belongs to the user
  const card = await CardModel.findOne({
    _id: cardId,
    user: userId,
  });

  if (!card) {
    throw new CustomErrors("Card not found or not authorized", StatusCodes.NOT_FOUND);
  }

  // Link card to account
  await AccountService.linkCardToAccount(accountId, cardId);

  // Update card's linked accounts
  if (!card.linked_accounts.includes(accountId)) {
    card.linked_accounts.push(accountId);
    await card.save();
  }

  return new ApiResponse(StatusCodes.OK, { card }, "Card linked to account successfully");
});
