import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserScheme = new Schema({
  id: {
    type:String,
    required:true
  },
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
});

const User = mongoose.model("user", UserScheme);

export default User;
