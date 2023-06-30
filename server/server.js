const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:8081", // Especifique a origem permitida para o CORS
        methods: ["GET", "POST"], // Especifique os métodos permitidos
        allowedHeaders: ["my-custom-header"], // Especifique os cabeçalhos personalizados permitidos
        credentials: true, // Habilitar o envio de cookies de autenticação (se aplicável)
    },
});

app.use(cors());
app.use(express.json());

let data = {
    currentTicket: "000",
    currentTable: "00",
    lastTicket: "000",
    lastTable: "00",
    ticketInQueue: Array(100).fill(0),
    ticketPreferential: Array(100).fill(0),
    ticketName: Array(100).fill(""),
};

// Conecte-se ao cliente
io.on("connection", (socket) => {
    console.log("Novo cliente conectado");

    // Envie a atualização atual para o cliente recém-conectado
    socket.emit("updatedGlobalCurrentTicket", data.currentTicket);

    // Receba uma nova atualização do cliente
    socket.on("clientMonitorUpdate", (newTicket) => {
        // Atualize a variável currentTicket com a nova atualização
        data.currentTicket = newTicket;

        // Envie a nova atualização para todos os clientes conectados, incluindo o cliente que enviou a atualização
        io.emit("updatedGlobalCurrentTicket", data.currentTicket);
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
        currentTicket,
        currentTable,
        lastTicket,
        lastTable,
        ticketInQueue,
        ticketPreferential,
        ticketName,
    } = data;

    // Envie os valores das variáveis como resposta
    res.json({
        currentTicket,
        currentTable,
        lastTicket,
        lastTable,
        ticketInQueue,
        ticketPreferential,
        ticketName,
    });
});

app.put("/api/updateVariablesInAPI", (req, res) => {
    // Obtenha os valores atualizados das variáveis do corpo da solicitação
    let {
        currentTicket,
        currentTable,
        lastTicket,
        lastTable,
        ticketInQueue,
        ticketPreferential,
        ticketName,
    } = req.body;

    data.currentTicket = currentTicket;
    data.currentTable = currentTable;
    data.lastTicket = lastTicket;
    data.lastTable = lastTable;
    data.ticketInQueue = ticketInQueue;
    data.ticketPreferential = ticketPreferential;
    data.ticketName = ticketName;

    // Envie uma resposta de sucesso
    res.status(200).send("Variáveis atualizadas no servidor");
});

// Inicie o servidor na porta desejada
const port = 3030;
server.listen(port, () => {
    console.log(`Servidor Express rodando na porta ${port}`);
});
