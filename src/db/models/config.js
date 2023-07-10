const mongoose = require("mongoose");

const config = mongoose.model(
  "Config",
  {
    monitorMode: { type: Number, default: 0 },
    soundNotification: { type: Number, default: 0 },
    soundCallTicket: { type: Number, default: 0 },
    soundCallTicketVoice: { type: Number, default: 0 },
  },
  { versionKey: false }
);

module.exports = config;
