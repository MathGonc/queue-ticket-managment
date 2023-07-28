const express = require("express");
const router = express.Router();
const TicketModel = require("./models/ticket");

router.get("/loadTicketsInQueue", async (req, res) => {
  try {
    const ticket = await TicketModel.find({
      $or: [{ preferential: true }, { preferential: false }],
    })
      .sort({ status: 1, preferential: -1, dateServiced: -1, dateQueue: 1 })
      .limit(50);

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    throw error;
  }
});

router.get("/loadTicket/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const ticket = await TicketModel.find({ _id: _id });

    return res.status(200).json({ ticket });
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

router.put("/updateTicketCalled/:id", async (req, res) => {
  try {
    const _id = req.params.id,
      data = req.body;
    console.log("🚀 ~ file: ticketRoutes.js:36 ~ router.put ~ data:", data);
    response = await TicketModel.findByIdAndUpdate(_id, data);

    return res.status(200).json({});
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

router.delete("/deleteTicket/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    await TicketModel.findByIdAndDelete(_id);

    return res.status(200).json({});
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

module.exports = router;
