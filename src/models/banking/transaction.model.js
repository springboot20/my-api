import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const TransactionSchema = new Schema(
  {
  
  },
  { timestamps: true }
);

const TransactionModel = model('transaction', TransactionSchema);

export { TransactionModel};
