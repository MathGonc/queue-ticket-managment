const express = require("express");
const router = express.Router();
const User = require("./models/users");

// Rota de registro
router.post("/register", (req, res) => {
  const { login, password } = req.body;
  const newUser = new User({ login, password });

  newUser
    .save()
    .then(() => {
      res.status(200).json({ message: "Usuário registrado com sucesso" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar o usuário" });
    });
});

// Rota de login
router.post("/login", (req, res) => {
  const { login, password } = req.body;

  User.findOne({ login, password }, (err, user) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao encontrar o usuário" });
    } else if (!user) {
      res.status(401).json({ error: "Credenciais inválidas" });
    } else {
      res.status(200).json({ message: "Login bem-sucedido" });
    }
  });
});

module.exports = router;
