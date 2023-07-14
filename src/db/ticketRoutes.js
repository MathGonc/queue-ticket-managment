const express = require("express");
const router = express.Router();
const TicketModel = require("./models/ticket");

router.get("/loadTicketsInQueue", async (req, res) => {
  try {
    const tickets = await TicketModel.find({
      $or: [
        { preferential: true, status: 1 },
        { preferential: false, status: 1 },
      ],
    })
      .sort({ preferential: -1, dateQueue: 1 })
      .limit(50);

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    throw error;
  }
});

router.post("/insertTicket", async (req, res) => {
  try {
    const updatedData = req.body;
    TicketModel.create(updatedData);
    return res.status(200).json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updateTicket", async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
