const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

module.exports = generateToken;

