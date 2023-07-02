const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  firstname: {
    type: String,
    require: true,
    default:null
  },
  lastname: {
    type: String,
    require: true,
    default:null
  },
  email: {
    type: String,
    require: true,
    default:null,
    unique: true,
  },
  password: {
    type: String,
    default:null,
    require: true,
  },
  confirmPassword: {
    type: String,
    default:null,
    require: true,
  },
});

const User = model('user', UserSchema);

module.exports = User;
