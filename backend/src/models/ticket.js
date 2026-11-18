const mongoose = require("mongoose");

// Ticket = uma visita. A pessoa (nome, CPF, nascimento) fica so no assistido;
// as rotas devolvem name/docNumber/assistedAge calculados a partir dele.
// Os campos antigos ficaram como legacy_name/legacy_docNumber/
// legacy_assistedAge (migracao), sem uso no sistema.
const TicketSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    status: { type: Number, required: true },
    preferential: { type: Number, required: true },
    assistidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Assistido", required: true },
    type: { type: String, default: "" }, // um dos tipos oficiais (src/tipos.js)
    queuedBy: { type: String },
    dateQueue: { type: Date, required: true },
    servicedBy: { type: String },
    dateServiced: { type: Date },
    servicedTable: { type: Number }, // guiche que chamou
    // Recados: o da triagem e escrito ao emitir; o do atendimento, no painel
    // de atendimento. Os dois aparecem no (i) da barra lateral e do historico.
    notaTriagem: { type: String, default: "" },
    notaAtendimento: { type: String, default: "" },
    // Excluir so oculta: o ticket some de fila, historico e contagens, mas
    // continua no banco (pode ser restaurado)
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String },
  },
  { versionKey: false }
);

// Visitas de uma pessoa (linha do tempo e contagem)
TicketSchema.index({ assistidoId: 1, dateQueue: 1 });

// Indice que ja existia em producao (mantido para nao recriar)
TicketSchema.index({
  status: 1,
  preferential: -1,
  assistedAge: -1,
  dateServiced: -1,
  dateQueue: 1,
});

const TicketModel = mongoose.model("Ticket", TicketSchema);

module.exports = TicketModel;
