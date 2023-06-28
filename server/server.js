const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let data = {
  currentTicket: "11111111111",
  currentTable: "1111",
  lastTicket: "1111",
  lastTable: "1111",
};

// Defina uma rota para fornecer os dados das variáveis

// Rota raiz
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/api", (req, res) => {
  // Obtenha os valores das variáveis do servidor

  let currentTicket = data.currentTicket;
  let currentTable = data.currentTable;
  let lastTicket = data.lastTicket;
  let lastTable = data.lastTable;
  // Envie os valores das variáveis como resposta
  res.json({ currentTicket, currentTable, lastTicket, lastTable });
});

app.put("/api/data", (req, res) => {
  // Obtenha os valores atualizados das variáveis do corpo da solicitação
  let { currentTicket, currentTable, lastTicket, lastTable } = req.body;

  data.currentTicket = currentTicket;
  data.currentTable = currentTable;

  // Envie uma resposta de sucesso
  res.status(200).send("Variáveis atualizadas no servidor");
});

// Inicie o servidor na porta desejada
const port = 3030;
app.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
