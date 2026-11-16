const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    login: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: Number, default: 0 },
    table: { type: Number, default: 0 },
    language: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
