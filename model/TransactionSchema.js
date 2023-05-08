const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const TransactionSchema = new Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  senderEmail: {
    type: String,
    require: true,
  },
  receiverEmail: {
    type: String,
    require: true,
  },
  type: {
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
      10,
      "Please account number should not greater or less than 10 digit",
    ],
  },
  description: {
    type: String,
    require: [
      150,
      "message description should only less than or eqaul to 150 characters",
    ],
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

const Transaction = mongoose.model("transaction", TransactionSchema);

module.exports = Transaction;
