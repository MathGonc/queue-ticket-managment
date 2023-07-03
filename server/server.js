const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:8080", // Especifique a origem permitida para o CORS
        methods: ["GET", "POST"], // Especifique os métodos permitidos
        allowedHeaders: ["my-custom-header"], // Especifique os cabeçalhos personalizados permitidos
        credentials: true, // Habilitar o envio de cookies de autenticação (se aplicável)
    },
});

app.use(cors());
app.use(express.json());

let globalData = {
    monitorMode: 0,
    soundNotification: true,
    soundCallTicket: true,
    soundCallTicketVoice: 0,
    currentTicket: 0,
    currentTable: 0,
    currentUser: "-",
    lastTicket: -1,
    lastTable: -1,
    lastUser: "-",
    ticketInQueue: Array(100).fill(0),
    ticketType: Array(100).fill(""),
    ticketPreferential: Array(100).fill(0),
    ticketName: Array(100).fill(""),
};

// Conecte-se ao cliente
io.on("connection", (socket) => {
    console.log("Novo cliente conectado");

    // Envie a atualização atual para o cliente recém-conectado
    socket.emit("updatedGlobalCurrentTicket", globalData.currentTicket);

    // Receba uma nova atualização do cliente
    socket.on("signalUpdateValues", () => {
        io.emit("receiveUpdateGlobal"); // Envie a nova atualização para todos os clientes conectados, incluindo o cliente que enviou a atualização
    });

    socket.on("signalUpdateMonitor", (newTicket) => {
        io.emit("receiveUpdateMonitor", newTicket);

        console.log(newTicket);
    });

    // Quando o cliente se desconectar
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
        monitorMode,
        soundNotification,
        soundCallTicket,
        soundCallTicketVoice,
        currentTicket,
        currentTable,
        currentUser,
        lastTicket,
        lastTable,
        lastUser,
        ticketInQueue,
        ticketType,
        ticketPreferential,
        ticketName,
    } = globalData;

    // Envie os valores das variáveis como resposta
    res.json({
        monitorMode,
        soundNotification,
        soundCallTicket,
        soundCallTicketVoice,
        currentTicket,
        currentTable,
        currentUser,
        lastTicket,
        lastTable,
        lastUser,
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
        lastUser,
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
    globalData.lastUser = lastUser;
    globalData.ticketInQueue = ticketInQueue;
    globalData.ticketType = ticketType;
    globalData.ticketPreferential = ticketPreferential;
    globalData.ticketName = ticketName;

    // Envie uma resposta de sucesso
    res.status(200).send("Variáveis atualizadas no servidor");
});

app.put("/api/updateGlobalConfigs", (req, res) => {
    let {
        monitorMode,
        soundNotification,
        soundCallTicket,
        soundCallTicketVoice,
    } = req.body;

    globalData.monitorMode = monitorMode;
    globalData.soundNotification = soundNotification;
    globalData.soundCallTicket = soundCallTicket;
    globalData.soundCallTicketVoice = soundCallTicketVoice;

    res.status(200).send("Configurações atualizadas no servidor");
});

const port = 3030;
server.listen(port, () => {
    console.log(`Servidor Express rodando na porta ${port}`);
});
