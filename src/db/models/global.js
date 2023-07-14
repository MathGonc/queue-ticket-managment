const mongoose = require("mongoose");

const globalSchema = new mongoose.Schema(
  {
    currentTicketRegistred: { type: Number, default: 0 },
    currentTicketCalled: { type: Number, default: 0 },
    lastTicketCalled: { type: Number, default: 0 },
    monitorMode: { type: Number, default: 0 },
    soundNotification: { type: Boolean, default: 0 },
    soundCallTicket: { type: Boolean, default: 0 },
    soundCallTicketVoice: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Global = mongoose.model("Global", globalSchema);

module.exports = Global;
