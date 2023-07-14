const express = require("express");
const router = express.Router();
const Config = require("./models/global");

router.post("/saveConfigsDB", async (req, res) => {
  try {
    const updatedData = req.body;

    const config = await Config.findOne();

    if (config) {
      config.set(updatedData);
      await config.save();
    } else {
      await Config.create(updatedData);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao salvar as configurações no banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getConfigsDB", async (req, res) => {
  try {
    const config = await Config.findOne();

    if (config) {
      req.config = config;
      res.status(200).json({ config });
    }
  } catch (error) {
    console.error("Erro ao obter as configurações do banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getCurrentTicketRegistred", async (req, res) => {
  try {
    const config = await Config.findOne().select("currentTicketRegistred");
    res.status(200).json({ config });
  } catch (error) {
    console.error("Erro ao obter as configurações do banco de dados MongoDB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updateCurrentTicketRegistred", async (req, res) => {
  try {
    const data = req.body;

    const config = await Config.findOne();

    if (config) {
      config.set(data);
      await config.save();
      console.log(data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({});
  }
});

module.exports = router;
