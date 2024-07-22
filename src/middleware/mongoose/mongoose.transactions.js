import mongoose from "mongoose";

export function mongooseTransactions(fn) {
  return async function (req, res) {
    let result;
    await mongoose.connection.transaction(async (session) => {
      result = await fn(req, res, session);
      return result;
    });
    return result;
  };
}
