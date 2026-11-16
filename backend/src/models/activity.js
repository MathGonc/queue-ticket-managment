const mongoose = require('mongoose')

// Registro de atividades do sistema (quem fez o que e quando).
// Nao guarda nome nem CPF de assistidos: senhas sao identificadas pelo numero.
const ActivitySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, required: true },
    user: { type: String, default: '' },     // nome de quem fez a acao
    login: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { versionKey: false }
)

ActivitySchema.index({ date: -1 })
ActivitySchema.index({ type: 1, date: -1 })

module.exports = mongoose.model('Activity', ActivitySchema)
