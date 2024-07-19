import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const WalletSchema = new Schema(
  {

  },
  { timestamps: true }
);

const WalletModel = model('Wallet', WalletSchema);

export{ WalletModel};
