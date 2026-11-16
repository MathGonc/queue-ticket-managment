// Restaura um backup feito pelo backup-db.js. SUBSTITUI as colecoes do banco
// pelas do backup. Antes de restaurar, faz um backup do estado atual.
//
// Uso:
//   npm run restore-db -- --from <pasta-do-backup> --confirm
//   npm run restore-db -- --from <pasta> --db outro-banco --confirm   (restaura em outro banco, p/ conferir)
//
// Pare o backend antes (stop-all) para ninguem gravar durante a restauracao.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const mongoose = require('mongoose')
const { EJSON } = mongoose.mongo.BSON
const config = require('../src/config/index.js')
const { buildMongoUri } = require('../src/config/db.js')

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

async function main() {
  const from = arg('from')
  const dbName = arg('db', config.dbName)
  if (!from) throw new Error('Informe --from <pasta-do-backup>')
  const dir = path.resolve(from)
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) throw new Error(`Nao e uma pasta de backup valida (sem manifest.json): ${dir}`)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))

  console.log(`Backup de ${manifest.date} (banco ${manifest.database})`)
  console.log(`Destino: banco "${dbName}" -> ${Object.entries(manifest.collections).map(([n, c]) => `${n}=${c}`).join(' ')}`)
  if (!process.argv.includes('--confirm')) {
    console.log('Nada foi alterado. Para restaurar de verdade, repita com --confirm')
    return
  }

  if (dbName === config.dbName) {
    console.log('Salvando o estado atual antes de restaurar...')
    execFileSync(process.execPath, [path.join(__dirname, 'backup-db.js'), '--dir', path.join(path.dirname(dir), 'antes-de-restaurar'), '--keep', '5'], { stdio: 'inherit' })
  }

  await mongoose.connect(buildMongoUri(dbName), { serverSelectionTimeoutMS: 15000 })
  const db = mongoose.connection.db
  for (const name of Object.keys(manifest.collections)) {
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'), { relaxed: false })
    await db.collection(name).deleteMany({})
    if (docs.length) await db.collection(name).insertMany(docs, { ordered: false })
    const count = await db.collection(name).countDocuments()
    if (count !== docs.length) throw new Error(`${name}: esperado ${docs.length}, ficou ${count}`)
    console.log(`  ${name}: ${count} restaurados`)
  }
  await mongoose.disconnect()
  console.log('Restauracao concluida.')
}

main().catch(async (err) => {
  console.error(`ERRO na restauracao: ${err.message}`)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
