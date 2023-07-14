require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.VUE_APP_URL + ":" + process.env.VUE_APP_PORT_CLIENT,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header", "Content-Type", "Authorization"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

const userRoutes = require("./src/db/userRoutes.js");
const globalRoutes = require("./src/db/globalRoutes.js");
const ticketRoutes = require("./src/db/ticketRoutes.js");
app.use("/", userRoutes, globalRoutes, ticketRoutes);

//Database
const { connect } = require("./src/db/db");
connect();

let globalData = {
  currentTicket: -1,
  currentTable: -1,
  currentUser: "-",
  lastTicket: -1,
  lastTable: -1,
  ticketInQueue: Array(100).fill(0),
  ticketType: Array(100).fill(""),
  ticketPreferential: Array(100).fill(0),
  ticketName: Array(100).fill(""),
};

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  socket.emit("updatedGlobalCurrentTicket", globalData.currentTicket);

  socket.on("signalUpdateValues", () => {
    io.emit("receiveUpdateGlobal");
  });

  socket.on("signalUpdateMonitor", () => {
    io.emit("receiveUpdateMonitor");
  });

  socket.on("signalUpdateMonitorConfigs", () => {
    io.emit("receiveUpdateMonitorConfigs");
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Defina uma rota para fornecer os dados das variáveis

// Rota raiz
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/api", (req, res) => {
  // Obtenha os valores das variáveis do servidor
  let {
    currentTicket,
    currentTable,
    currentUser,
    lastTicket,
    lastTable,
    ticketInQueue,
    ticketType,
    ticketPreferential,
    ticketName,
  } = globalData;

  // Envie os valores das variáveis como resposta
  res.json({
    currentTicket,
    currentTable,
    currentUser,
    lastTicket,
    lastTable,
    ticketInQueue,
    ticketType,
    ticketPreferential,
    ticketName,
  });
});

app.put("/api/updateVariablesInAPI", (req, res) => {
  // Obtenha os valores atualizados das variáveis do corpo da solicitação
  let {
    currentTicket,
    currentTable,
    currentUser,
    lastTicket,
    lastTable,
    ticketInQueue,
    ticketType,
    ticketPreferential,
    ticketName,
  } = req.body;

  globalData.currentTicket = currentTicket;
  globalData.currentTable = currentTable;
  globalData.currentUser = currentUser;
  globalData.lastTicket = lastTicket;
  globalData.lastTable = lastTable;
  globalData.ticketInQueue = ticketInQueue;
  globalData.ticketType = ticketType;
  globalData.ticketPreferential = ticketPreferential;
  globalData.ticketName = ticketName;

  // Envie uma resposta de sucesso
  res.status(200).send("Variáveis atualizadas no servidor");
});

const port = process.env.VUE_APP_PORT_SERVER || 3000;
server.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
