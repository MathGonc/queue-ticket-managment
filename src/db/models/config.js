const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    monitorMode: { type: Number, default: 0 },
    soundNotification: { type: Boolean, default: 0 },
    soundCallTicket: { type: Boolean, default: 0 },
    soundCallTicketVoice: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Config = mongoose.model("Config", configSchema);

module.exports = Config;
