const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const WalletTransactionSchema = new Schema(
  {
    amount: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, enum: ['NGN', 'USD', 'EUR', 'GBP'], required: true },
    paymentMethod: { type: String, default: 'stripe' },
    status: { type: String, enum: ['completed', 'failed', ' pending'], default: 'pending' },
  },
  { timestamps: true }
);

const WalletTransactionModel = model('WalletTransaction', WalletTransactionSchema);

module.exports = WalletTransactionModel;
