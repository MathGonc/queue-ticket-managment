const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const config = require('./src/config/index.js')
const { connect } = require('./src/config/db.js')
const logger = require('./src/config/logger.js')
const { logActivity, logActivityThrottled, clientIp } = require('./src/activity.js')
const panelPresence = require('./src/panelPresence.js')
const { version } = require('./package.json')

const app = express()
const server = http.createServer(app)

const io = socketIO(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json())
// Express 5 deixa req.body undefined quando a requisicao vem sem corpo;
// as rotas esperam um objeto (comportamento do Express 4)
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {}
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    // /health e consultado o tempo todo pelo status/healthcheck: so em debug
    const log = req.originalUrl === '/health' ? logger.debug.bind(logger) : logger.info.bind(logger)
    log({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${duration}ms`
    }, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`)
    // Erro do servidor tambem vai para o registro de atividades (sem a query,
    // que pode ter texto de busca)
    if (res.statusCode >= 500) {
      logActivity(req, 'erro_servidor', { metodo: req.method, rota: req.originalUrl.split('?')[0], status: res.statusCode })
    }
  })
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState
  const mongoStatus = mongoState === 1 ? 'connected' : 'disconnected'
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus
  })
})

// Routes
const userRoutes = require('./src/routes/userRoutes.js')
const ticketRoutes = require('./src/routes/ticketRoutes.js')
const globalRoutes = require('./src/routes/globalRoutes.js')
const activityRoutes = require('./src/routes/activityRoutes.js')
const brandingRoutes = require('./src/routes/brandingRoutes.js')
app.use('/', userRoutes, globalRoutes, ticketRoutes, activityRoutes, brandingRoutes)
// As rotas avisam as telas abertas (ex.: logo trocado) por aqui
app.set('io', io)

// Database
connect()

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) {
    // Permite conexão sem auth para monitor (somente leitura)
    socket.authenticated = false
    return next()
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    socket.user = decoded.userData
    socket.authenticated = true
    next()
  } catch (err) {
    socket.authenticated = false
    next()
  }
})

// WebSocket events
io.on('connection', (socket) => {
  logger.info('Novo cliente conectado')

  // Eventos de controle requerem autenticação. Tentativas sem token valido
  // entram no registro (no maximo 1 por IP e evento a cada 10 min).
  function refused(event) {
    const ip = clientIp(socket)
    logActivityThrottled(`${ip}|${event}`, 10 * 60 * 1000, socket, 'sinal_recusado', { evento: event, ip })
  }

  socket.on('signalUpdateValues', () => {
    if (!socket.authenticated) return refused('signalUpdateValues')
    io.emit('receiveUpdateGlobal')
  })

  socket.on('signalUpdateMonitor', (callByName) => {
    if (!socket.authenticated) return refused('signalUpdateMonitor')
    io.emit('receiveUpdateMonitor', callByName)
  })

  socket.on('signalUpdateMonitorConfigs', () => {
    if (!socket.authenticated) return refused('signalUpdateMonitorConfigs')
    io.emit('receiveUpdateMonitorConfigs')
  })

  // Presenca do painel (TV) para o registro de atividades
  socket.on('painelOnline', (info) => panelPresence.online(socket, info))
  socket.on('painelOffline', () => panelPresence.offline(socket))

  socket.on('disconnect', () => {
    panelPresence.offline(socket)
    logger.info('Cliente desconectado')
  })
})

server.listen(config.port, () => {
  logger.info(`Servidor Express rodando na porta ${config.port}`)
  if (logger.logDir) logger.info(`Logs em arquivo: ${logger.logDir}`)
  logActivity(null, 'servidor_iniciado', { versao: version, node: process.version }, { username: 'sistema' })
})
