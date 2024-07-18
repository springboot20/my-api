const mongoose = require('mongoose');

const refreshSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  refreshToken: String,
});

const RefreshToken = mongoose.model('RefreshToken', refreshSchema);
module.exports = RefreshToken;
