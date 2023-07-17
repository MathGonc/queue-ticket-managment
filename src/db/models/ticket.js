const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    status: { type: Number, required: true },
    preferential: { type: Boolean, required: true },
    name: { type: String, require: true },
    type: { type: String, require: true },
    queuedBy: { type: String, require: true },
    dateQueue: { type: Date, required: true },
    servicedBy: { type: String },
    dateServiced: { type: Date },
  },
  { versionKey: false }
);

TicketSchema.index({
  status: 1,
  preferential: -1,
  dateServiced: -1,
  dateQueue: 1,
});

const TicketModel = mongoose.model("Ticket", TicketSchema);

module.exports = TicketModel;
