const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
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
      type: Boolean,
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
  { versionKey: false }
);

TicketSchema.index({ status: 1, dateQueue: -1 });

TicketSchema.index({ status: 2, dateServiced: -1 });

const TicketModel = mongoose.model("Ticket", TicketSchema);

module.exports = TicketModel;
