const mongoose = require("mongoose");

const ticketsSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
    },
    preferential: {
      type: Number,
      required: true,
    },
    serviced: {
      type: String,
      required: true,
    },
    dateQueue: {
      type: Date,
      default: Date.now,
    },
    dateServiced: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("tickets", ticketsSchema);
