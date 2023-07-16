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
const { connect } = require("./src/db/db");
connect();

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  //socket.emit("updatedGlobalCurrentTicket", globalData.currentTicket);

  socket.on("signalUpdateValues", () => {
    io.emit("receiveUpdateGlobal");
  });

  socket.on("signalUpdateMonitor", (callTicketByName) => {
    io.emit("receiveUpdateMonitor", callTicketByName);
  });

  socket.on("signalUpdateMonitorConfigs", () => {
    io.emit("receiveUpdateMonitorConfigs");
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

const port = process.env.VUE_APP_PORT_SERVER || 3000;
server.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
