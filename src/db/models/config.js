const mongoose = require("mongoose");

const configs = mongoose.model(
  "Config",
  {
    number: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    serviced: {
      preferential: {
        type: Number,
        required: true,
      },
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

module.exports = config;
