import { StatusCodes } from "http-status-codes";
import { paystack_urls } from "../../constants";
import { CustomErrors } from "../../middleware/custom/custom.errors";
import { TransactionModel } from "../../models";
import { convertToKobo } from "../../utils";

export default class PaymentService {
  static generatePaystackRefernce = () => {
    return new Date().getTime().toString(36) + new Date().getUTCMilliseconds();
  };

  static async initializePaystackPayment({ email, amount, channel, currency }) {
    try {
      const amountInKobo = convertToKobo(amount);

      const paymentConfig = {
        email,
        amount: amountInKobo,
        channels: [channel],
        currency,
        reference: PaymentService.generatePaystackRefernce(),
        callback_url: `${process.env.PAYSTACK_CALLBACK_URL}`,
      };

      const headers = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      };

      const payload = JSON.stringify(paymentConfig);

      const response = await fetch(paystack_urls.initiate, {
        body: payload,
        headers,
      });

      const data = await response.json();
      if (data && data.status) {
        return data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static async verifyHelper(reference) {
    try {
      const headers = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      };

      let response = (await fetch(`${paystack_urls.verify}/${reference}`, { headers })).json();

      return response;
    } catch (error) {
      throw new CustomErrors("something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
