const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    user: { type: String, required: true },
    action: { type: String, required: true },
  },
  { versionKey: false }
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
