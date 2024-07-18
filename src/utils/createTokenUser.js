const tokenUser = (user) => {
  return { username: user.username, role: user.role, userId: user._id };
};

module.exports = tokenUser;
