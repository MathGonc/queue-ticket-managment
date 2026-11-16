const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    user: { type: String, required: true },
    action: { type: String, required: true },
  },
  { versionKey: false }
);

const HistoryModel = mongoose.model("History", HistorySchema);

module.exports = HistoryModel;
