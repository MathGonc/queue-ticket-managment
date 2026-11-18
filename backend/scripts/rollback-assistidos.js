// Volta os tickets ao formato antigo (name/docNumber/assistedAge no ticket),
// para rodar o codigo de antes da separacao dos assistidos. So use se for
// voltar a versao: o codigo novo nao precisa disso.
//
// Uso: npm run rollback-assistidos -- --confirm
//
// Tickets migrados: os campos voltam de legacy_*. Tickets criados depois da
// migracao (sem legacy_*): recebem nome/CPF/nascimento do cadastro da pessoa.
// Nada e apagado: assistidos, assistidoId e anotacoes continuam no banco.

const mongoose = require('mongoose')
const { buildMongoUri } = require('../src/config/db.js')
const Assistido = require('../src/models/assistido')
const TicketModel = require('../src/models/ticket')

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.log('Isto devolve name/docNumber/assistedAge aos tickets (formato antigo). Rode com --confirm.')
    return
  }
  await mongoose.connect(buildMongoUri(), { serverSelectionTimeoutMS: 8000 })
  const people = new Map((await Assistido.find({}).select('nome cpf nascimento').lean()).map((p) => [String(p._id), p]))
  const tickets = await TicketModel.collection.find({}, { projection: { assistidoId: 1, legacy_name: 1, legacy_docNumber: 1, legacy_assistedAge: 1 } }).toArray()
  const ops = tickets.map((t) => {
    const p = people.get(String(t.assistidoId)) || {}
    const migrated = 'legacy_name' in t
    return {
      updateOne: {
        filter: { _id: t._id },
        update: { $set: {
          name: migrated ? t.legacy_name : p.nome || '',
          docNumber: migrated ? t.legacy_docNumber : p.cpf || '',
          assistedAge: migrated ? t.legacy_assistedAge : p.nascimento || null,
        } },
      },
    }
  })
  let modified = 0
  for (let i = 0; i < ops.length; i += 2000) modified += (await TicketModel.collection.bulkWrite(ops.slice(i, i + 2000), { ordered: false })).modifiedCount
  console.log(`Tickets com name/docNumber/assistedAge de volta: ${modified}`)
}

main()
  .catch((error) => {
    console.error('ERRO:', error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
