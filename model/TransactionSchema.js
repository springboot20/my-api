import mongoose from "mongoose";

const Schema = mongoose.Schema;
const TransactionSchema = new Schema({
  _balance: Number,
  _transactionsIn: [
    {
      amount: {
        type: Number,
        require: true,
      },
      date: {
        type: Date,
        default: new Date(),
      },
    },
  ],
  _transactionsOut: [
    {
      amount: {
        type: Number,
        require: true,
      },
      date: {
        type: Date,
        default: new Date(),
      },
    },
  ],
});

export default TransactionSchema;
