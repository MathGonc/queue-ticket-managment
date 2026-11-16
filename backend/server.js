const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const config = require('./src/config/index.js')
const { connect } = require('./src/config/db.js')
const logger = require('./src/config/logger.js')
const { logActivity } = require('./src/activity.js')
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
app.use('/', userRoutes, globalRoutes, ticketRoutes, activityRoutes)

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

  // Eventos de controle requerem autenticação
  socket.on('signalUpdateValues', () => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateGlobal')
  })

  socket.on('signalUpdateMonitor', (callByName) => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateMonitor', callByName)
  })

  socket.on('signalUpdateMonitorConfigs', () => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateMonitorConfigs')
  })

  socket.on('disconnect', () => {
    logger.info('Cliente desconectado')
  })
})

server.listen(config.port, () => {
  logger.info(`Servidor Express rodando na porta ${config.port}`)
  if (logger.logDir) logger.info(`Logs em arquivo: ${logger.logDir}`)
  logActivity(null, 'servidor_iniciado', { versao: version, node: process.version }, { username: 'sistema' })
})
