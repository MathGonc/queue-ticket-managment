const mongoose = require('mongoose')
const config = require('./index.js')
const logger = require('./logger.js')

async function connect() {
  try {
    await mongoose.connect(
      `mongodb://${config.dbUser}:${config.dbPass}@${config.dbIp}/${config.dbName}?authSource=admin`
    )
    const db = mongoose.connection
    db.on('error', (err) => logger.error(err, 'Erro na conexão com o banco de dados'))
    db.once('open', () => {
      logger.info('Conexão bem-sucedida com o banco de dados')
    })
  } catch (err) {
    logger.error({ msg: 'Erro ao conectar ao banco de dados', error: err.message })
    process.exit(1)
  }
}

module.exports = { connect }
