const express = require("express");
const router = express.Router();
const Config = require("./models/config");

router.post("/saveConfigsDB", async (req, res) => {
  try {
    const updatedData = req.body;

    const config = await Config.findOne();

    if (config) {
      // Atualiza as configurações existentes no MongoDB
      config.set(updatedData);
      await config.save();
      console.log("Configurações globais atualizadas no banco de dados MongoDB");
    } else {
      // Cria um novo documento de configuração no MongoDB
      await Config.create(updatedData);
      console.log("Novo documento de configuração criado no banco de dados MongoDB");
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

module.exports = router;
