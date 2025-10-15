const express = require("express");
const router = express.Router();
const TicketModel = require("./models/ticket");

const limitDate = new Date();
limitDate.setDate(limitDate.getDate() - 7);

router.get("/loadTicketsInQueue", async (req, res) => {
  try {
    const ticket = await TicketModel.find({
      dateQueue: { $gte: limitDate },
    }).sort({
      status: 1, // continua agrupando status 1 e 2
      // se for status 1 → ordena por preferencial e dataQueue
      // se for status 2 → ordena por dataServiced
      ...(await (async () => {
        // como o sort não aceita função diretamente, fazemos lógica antes
        const baseSort = {};
        baseSort["status"] = 1;
        baseSort["preferential"] = -1;
        baseSort["dateQueue"] = 1;
        baseSort["dateServiced"] = -1;
        return baseSort;
      })()),
    });

    // após ordenar, refinamos dentro do array retornado
    const sortedTickets = ticket.sort((a, b) => {
      if (a.status === 1 && b.status === 1) {
        // fila: preferenciais primeiro, depois por dataQueue
        if (a.preferential !== b.preferential)
          return b.preferential - a.preferential;
        return new Date(a.dateQueue) - new Date(b.dateQueue);
      } else if (a.status === 2 && b.status === 2) {
        // atendidas: apenas por dataServiced (mais recente primeiro)
        return new Date(b.dateServiced) - new Date(a.dateServiced);
      } else {
        // status diferentes: fila primeiro, depois atendidos
        return a.status - b.status;
      }
    });

    return res.status(200).json({ ticket: sortedTickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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

router.get("/loadTicketHistory", async (req, res) => {
  try {
    const ticket = await TicketModel.find({})
      .sort({ dateServiced: -1, dateQueue: -1 })
      .limit(10000);

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    throw error;
  }
});

module.exports = router;
