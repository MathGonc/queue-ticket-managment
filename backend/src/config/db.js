const mongoose = require('mongoose')
const config = require('./index.js')
const logger = require('./logger.js')
const GlobalModel = require('../models/global')

// Usuario/senha sao opcionais: um mongod local sem --auth (modo standalone)
// recusa credenciais de um usuario que nao existe.
function buildMongoUri(dbName = config.dbName) {
  if (config.dbUser && config.dbPass) {
    const user = encodeURIComponent(config.dbUser)
    const pass = encodeURIComponent(config.dbPass)
    return `mongodb://${user}:${pass}@${config.dbIp}/${dbName}?authSource=admin`
  }
  return `mongodb://${config.dbIp}/${dbName}`
}

// Garante que exista o documento unico de configuracao global (numeracao das
// senhas e configs do monitor). Sem ele, um banco novo nao consegue emitir senhas.
async function ensureGlobalConfig() {
  const exists = await GlobalModel.exists({})
  if (!exists) {
    await GlobalModel.create({})
    logger.info('Documento de configuração global criado')
  }
}

async function connect() {
  try {
    await mongoose.connect(buildMongoUri())
    mongoose.connection.on('error', (err) => logger.error(err, 'Erro na conexão com o banco de dados'))
    logger.info(`Conectado ao MongoDB em ${config.dbIp}/${config.dbName}`)
    await ensureGlobalConfig()
  } catch (err) {
    logger.error({ msg: 'Erro ao conectar ao banco de dados', error: err.message })
    process.exit(1)
  }
}

module.exports = { connect, buildMongoUri }
