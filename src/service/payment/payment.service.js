import { StatusCodes } from "http-status-codes";
import { paystack_urls } from "../../constants.js";
import { CustomErrors } from "../../middleware/custom/custom.errors.js";
import { convertToKobo } from "../../utils/index.js";
import axios from "axios";

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

      const payload = JSON.stringify(paymentConfig);

      console.log(payload);

      const response = await axios.post(paystack_urls.initiate, payload, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      if (data && data.status) {
        return data;
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async verifyHelper(reference) {
    try {
      let response = await axios.get(`${paystack_urls.verify}/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      console.log(data);

      return data;
    } catch (error) {
      console.log("Error:", error);
      throw new CustomErrors("something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
