const { Schema, model } = require("mongoose");

const TransactionSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    require: [true, "Please provide a user"],
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    require: [true, "Please provide a user"],
  },
  transactionType: {
    type: String,
    enum: ["in", "out"],
    require: true,
  },
  amount: {
    type: Number,
    require: true,
  },
  bank_name: {
    type: String,
    require: true,
  },
  account_number: {
    type: Number,
    require: [
      true,
      "Please account number should not greater or less than 10 digit",
    ],
    maxlength: 10,
  },
  description: {
    type: String,
    require: [
      true,
      "message description should only less than or eqaul to 150 characters",
    ],
    maxlength: 150,
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

const Transaction = model("transaction", TransactionSchema);

module.exports = Transaction;
