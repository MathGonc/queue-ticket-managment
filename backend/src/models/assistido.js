const mongoose = require("mongoose");

// Pessoa atendida. A chave e o _id. CPF, nome + nascimento e nome sao formas
// de encontrar a pessoa na triagem (nessa ordem), nao chaves:
// - CPF e opcional: ou e valido, ou a pessoa foi marcada "Sem CPF" (cpf null)
// - o mesmo CPF pode ter mais de um cadastro enquanto ha duvida (pendencia):
//   a triagem escolhe o certo e os outros sao juntados a ele (mescladoEm)
const AssistidoSchema = new mongoose.Schema(
  {
    cpf: { type: String, default: null }, // so digitos
    // false = CPF antigo com digito verificador ou tamanho errado (pendencia)
    cpfValido: { type: Boolean, default: null },
    nome: { type: String, required: true }, // maiusculas, sem recados
    nomeBusca: { type: String, default: "" }, // nome sem acento: sugestoes da triagem
    // So a data: gravada as 12:00 UTC, o mesmo dia em qualquer fuso do Brasil
    nascimento: { type: Date, default: null },
    // Juntado por nome curto (2 ou 3 palavras) sem CPF: confirmar na triagem
    confirmarNome: { type: Boolean, default: false },
    // Cadastro juntado a outro: some das buscas, os tickets foram para o outro
    mescladoEm: { type: mongoose.Schema.Types.ObjectId, default: null },
    criadoEm: { type: Date, required: true },
    atualizadoEm: { type: Date, required: true },
  },
  { versionKey: false, collection: "assistidos" }
);

AssistidoSchema.index({ cpf: 1 });
AssistidoSchema.index({ nome: 1 });

module.exports = mongoose.model("Assistido", AssistidoSchema);
