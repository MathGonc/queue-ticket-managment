const mongoose = require("mongoose");

const tickets = mongoose.model(
  "Ticket",
  {
    number: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    preferential: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      require: true,
    },
    type: {
      type: String,
      require: true,
    },
    servicedBy: {
      type: String,
    },
    dateQueue: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dateServiced: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = tickets;
