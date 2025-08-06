import { paystack_urls } from "../../constants.js";
import { convertToKobo } from "../../utils/index.js";
import axios from "axios";

export default class PaymentService {
  static generatePaystackRefernce = () => {
    return new Date().getTime().toString(36) + new Date().getUTCMilliseconds();
  };

  static async initializePaystackPayment({ email, amount, channel, currency, meta_data = {} }) {
    try {
      const amountInKobo = convertToKobo(amount);

      const paymentConfig = {
        email,
        amount: amountInKobo,
        channels: [channel],
        currency,
        reference: PaymentService.generatePaystackRefernce(),
        callback_url: `${process.env.PAYSTACK_CALLBACK_URL}`,
        meta_data,
      };

      const response = await axios.post(paystack_urls.initiate, paymentConfig, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      return data?.status ? data : null;
    } catch (error) {
      console.error("Paystack initialization error:", error.message);
      return null;
    }
  }

  static async verifyHelper(reference) {
    try {
      const response = await axios.get(`${paystack_urls.verify}/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;

      // Always return the response data (even if verification failed)
      return data || null;
    } catch (error) {
      console.error("Paystack verification error:", error.message);
      return null;
    }
  }
}
