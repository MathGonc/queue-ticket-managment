// Cria (ou redefine a senha de) um usuario administrador.
// Necessario no primeiro uso: o cadastro pela tela exige um admin logado.
//
// Uso:
//   npm run create-admin -- --login nome.sobrenome --name "Nome" --password segredo
//   npm run create-admin            (pergunta os dados no terminal)
//
// Usa a mesma conexao do backend (backend/.env ou variaveis de ambiente).

const readline = require('readline/promises')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { connect } = require('../src/config/db.js')
const User = require('../src/models/user')

const LOGIN_PATTERN = /^[a-zA-Z0-9._-]+$/

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].match(/^--(login|name|password)$/)?.[1]
    if (key) args[key] = argv[++i]
  }
  return args
}

async function ask(rl, question, current) {
  if (current) return current
  return (await rl.question(question)).trim()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const login = await ask(rl, 'Login (ex.: nome.sobrenome): ', args.login)
  const name = await ask(rl, 'Nome exibido: ', args.name)
  const password = await ask(rl, 'Senha (min. 4 caracteres): ', args.password)
  rl.close()

  if (!LOGIN_PATTERN.test(login || '')) throw new Error('Login invalido: use letras, numeros, ponto, hifen ou sublinhado')
  if (!name || name.length > 30) throw new Error('Nome obrigatorio (max. 30 caracteres)')
  if (!password || password.length < 4) throw new Error('Senha deve ter pelo menos 4 caracteres')

  await connect()
  const hashed = await bcrypt.hash(password, 10)
  const existing = await User.findOne({ login })

  if (existing) {
    existing.username = name
    existing.password = hashed
    existing.role = 3
    await existing.save()
    console.log(`Usuario "${login}" atualizado: agora e administrador e a senha foi redefinida.`)
  } else {
    await User.create({ username: name, login, password: hashed, role: 3 })
    console.log(`Administrador "${login}" criado.`)
  }
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(`ERRO: ${err.message}`)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  })
