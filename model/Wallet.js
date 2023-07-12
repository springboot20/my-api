const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const WalletSchema = new Schema(
  {
    balance: { type: Number, default: 0 },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);
const WalletModel = model('Wallet', WalletSchema);

module.exports = WalletModel;
