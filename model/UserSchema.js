import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserScheme = new Schema({
  firstname: {
    type: String,
    require: true,
  },
  lastname: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  confirmPassword: {
    type: String,
    require: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactionsIn: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  transactionsOut: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
});

const User = mongoose.model("user", UserScheme);

export default User;
