const { Schema, model } = require('mongoose');

const TransactionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, require: true, enum: ['NGN', 'USD', 'EUR', ' GBP'] },
    status: { type: String, enum: ['completed', 'failed', ' pending'], default: 'pending' },
    paymentGateWay: { type: String, enum: ['flutterwave', 'stripe'] },
  },
  { timestamps: true }
);

const Transaction = model('transaction', TransactionSchema);

module.exports = Transaction;
