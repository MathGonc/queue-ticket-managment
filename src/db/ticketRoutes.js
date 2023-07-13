const express = require("express");
const router = express.Router();
const Config = require("./models/ticket");

router.get("/dbLoadTicketsInQueue", async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({ dateQueue: -1 })
      .sort({
        preferential: -1,
        status: -1,
      })
      .limit(50);

    return tickets;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    throw error;
  }
});

router.post("/dbInsertTicket", async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/dbUpdateTicket", async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
