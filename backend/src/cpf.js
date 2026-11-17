// Validacao de CPF (mesma regra de frontend/src/utils/index.js: isValidCpf)

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// 11 digitos e os dois digitos verificadores conferem. Sequencias repetidas
// (111.111.111-11) passam na conta, mas nao sao CPFs emitidos.
function isValidCpf(value) {
  const cpf = onlyDigits(value)
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  for (const len of [9, 10]) {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    if (((sum * 10) % 11) % 10 !== Number(cpf[len])) return false
  }
  return true
}

module.exports = { onlyDigits, isValidCpf }
