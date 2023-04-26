const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const TransactionSchema = new Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  senderEmail: {
    type: String,
    require: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  receiverEmail: {
    type: String,
    require: true,
  },
  amount: {
    type: Number,
    require: true,
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

const Transaction = mongoose.model("transactionsIn", TransactionSchema);

module.exports = Transaction;
