const mongoose = require("mongoose");

const globalSchema = new mongoose.Schema(
  {
    ticket: {
      nextToQueue: { type: Number, default: 1 },
      currentNumber: { type: Number, default: -1 },
      currentTable: { type: Number, default: -1 },
      currentUser: { type: String, default: "" },
      currentShowAttendant: { type: Boolean, default: false },
      currentServicedBy: { type: String, default: "" },
      lastNumber: { type: Number, default: -1 },
      lastTable: { type: Number, default: -1 },
      lastUser: { type: String, default: "" },
      lastShowAttendant: { type: Boolean, default: false },
      lastServicedBy: { type: String, default: "" },
    },
    monitorMode: { type: Number, default: 0 },
    soundNotification: { type: Boolean, default: 0 },
    soundCallTicket: { type: Boolean, default: 0 },
    soundCallTicketVoice: { type: Number, default: 0 },
  },
  { versionKey: false },
  { unique: true }
);

const Global = mongoose.model("Global", globalSchema);

module.exports = Global;
