// Backup do banco em EJSON canonico (restauravel com restore-db.js).
// Cada execucao cria <dir>/backup-qtm-AAAAMMDD-HHMMSS/ com um .json por colecao
// e um manifest.json. Relê cada arquivo para conferir e apaga os backups mais
// antigos, mantendo os ultimos --keep.
//
// Uso: npm run backup-db -- --dir <pasta> [--keep 30]
// Usa a conexao do backend (backend/.env ou variaveis de ambiente).

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { EJSON } = mongoose.mongo.BSON
const config = require('../src/config/index.js')
const { buildMongoUri } = require('../src/config/db.js')
const { version } = require('../package.json')
const Activity = require('../src/models/activity')

// Resultado do backup no registro de atividades (aba Logs/Registro)
async function record(type, details) {
  if (mongoose.connection.readyState !== 1) return
  await Activity.create({ date: new Date(), type, user: 'sistema', details }).catch(() => {})
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function stamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}

async function main() {
  const startedAt = Date.now()
  const baseDir = path.resolve(arg('dir', path.resolve(__dirname, '../../infra/standalone/backups')))
  const keep = Math.max(parseInt(arg('keep', '30')) || 30, 1)
  const dest = path.join(baseDir, `backup-qtm-${stamp()}`)
  fs.mkdirSync(dest, { recursive: true })

  await mongoose.connect(buildMongoUri(), { serverSelectionTimeoutMS: 15000 })
  const db = mongoose.connection.db
  const manifest = { date: new Date().toISOString(), database: config.dbName, backendVersion: version, collections: {} }

  for (const { name } of await db.listCollections().toArray()) {
    const docs = await db.collection(name).find({}).toArray()
    const file = path.join(dest, `${name}.json`)
    fs.writeFileSync(file, EJSON.stringify(docs, { relaxed: false }))
    const reread = EJSON.parse(fs.readFileSync(file, 'utf8'), { relaxed: false })
    if (reread.length !== docs.length) throw new Error(`Conferencia falhou em ${name}`)
    manifest.collections[name] = docs.length
  }
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const summary = Object.entries(manifest.collections).map(([n, c]) => `${n}=${c}`).join(' ')
  console.log(`Backup OK: ${dest} (${summary})`)

  // Mantem so os ultimos "keep" (pastas backup-qtm-* completas, com manifest)
  const all = fs.readdirSync(baseDir)
    .filter((n) => /^backup-qtm-\d{8}-\d{6}$/.test(n) && fs.existsSync(path.join(baseDir, n, 'manifest.json')))
    .sort()
  const removed = all.slice(0, Math.max(all.length - keep, 0))
  for (const old of removed) {
    fs.rmSync(path.join(baseDir, old), { recursive: true, force: true })
    console.log(`Backup antigo removido: ${old}`)
  }

  await record('backup_concluido', {
    pasta: path.basename(dest), local: baseDir, colecoes: manifest.collections,
    duracaoMs: Date.now() - startedAt, mantidos: all.length - removed.length, removidos: removed.length,
  })
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(`ERRO no backup: ${err.message}`)
  await record('backup_falhou', { erro: String(err.message).slice(0, 300) })
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
