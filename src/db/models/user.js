const mongoose = require("mongoose");

const User = mongoose.model("User", {
  username: { type: String, required: true },
  login: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, default: 0 },
  language: { type: Number, default: 0 },
});

module.exports = User;
