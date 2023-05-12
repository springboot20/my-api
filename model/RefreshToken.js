const mongoose = require("mongoose");

const refreshSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  }
});

const RefreshToken = mongoose.model("RefreshToken", refreshSchema);
module.exports = RefreshToken;
