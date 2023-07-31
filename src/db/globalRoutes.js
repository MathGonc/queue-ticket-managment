const express = require("express");
const router = express.Router();
const GlobalModel = require("./models/global");

router.post("/saveConfigsDB", async (req, res) => {
  try {
    const updatedData = req.body;

    const config = await GlobalModel.findOne();

    config ? (config.set(updatedData), await config.save()) : await GlobalModel.create(updatedData);

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao salvar as configurações no banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getConfigsDB", async (req, res) => {
  try {
    const config = await GlobalModel.findOne();

    if (config) {
      req.config = config;
      res.status(200).json({ config });
    }
  } catch (error) {
    console.error("Erro ao obter as configurações do banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getGlobalTicketData", async (req, res) => {
  try {
    const response = await GlobalModel.findOne().select("ticket");
    if (response) {
      res.status(200).json({
        ticket: response.ticket,
      });
    }
  } catch (error) {
    console.error("Erro ao obter as configurações do banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updateGlobalTicketData", async (req, res) => {
  try {
    const data = req.body;
    const config = await GlobalModel.findOneAndUpdate({}, { $set: data }, { new: true });

    config ? res.status(200).json({}) : res.status(500).json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({});
  }
});

router.put("/resetGlobalTicketData", async (req, res) => {
  try {
    const ticketResetData = {
      nextToQueue: 1,
      currentNumber: 0,
      currentTable: 0,
      currentUser: "",
      lastNumber: 0,
      lastTable: 0,
      lastUser: "",
    };
    const config = await GlobalModel.findOneAndUpdate(
      {},
      { ticket: ticketResetData },
      { new: true }
    );
    config ? res.status(200).json({}) : res.status(500).json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({});
  }
});

module.exports = router;
