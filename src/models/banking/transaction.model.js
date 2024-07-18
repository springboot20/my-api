const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TransactionSchema = new Schema(
  {
  
  },
  { timestamps: true }
);

const TransactionModel = model('transaction', TransactionSchema);

export { Transaction};
