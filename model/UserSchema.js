import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserScheme = new Schema({
  username: {
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
  _balance: Number,
  _transactionsIn: [
    {
      amount: {
        type: Number,
        require: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("user", UserScheme);

export default User;
