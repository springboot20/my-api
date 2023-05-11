const mongoose = require("mongoose");

const refreshSchema = new mongoose.Schema({
  users: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  token: {
    type: String,
    require: true,
  },
  expires: {
    type: Date,
    require: true,
  },
});

const RefreshToken = mongoose.model("RefreshToken", refreshSchema);
module.exports = RefreshToken;
