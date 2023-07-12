const jwt = require('jsonwebtoken');
const customErrors = require('../middleware/customErrors');

const generateToken = ({ payload }) => {
  return jwt.sign(payload, process.env.JWT_SECRET);
};

const validateToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    return decodedToken;
  } catch (error) {
    throw new customErrors.BadRequest('Token verification failed');
  }
};

const createToken = ({ res, user, refresh }) => {
  const dayDuration = 24 * 60 * 60 * 1000;
  const longerDayDuration = 30 * 24 * 60 * 60 * 1000;

  const accessToken = generateToken({ payload: { user } });
  const refreshToken = generateToken({ payload: { user, refresh } });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    expires: new Date(Date.now() + dayDuration),
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    expires: new Date(Date.now() + longerDayDuration),
  });
};

module.exports = {
  createToken,
  validateToken,
};
