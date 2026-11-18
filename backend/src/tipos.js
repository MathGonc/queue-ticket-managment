// Tipos de atendimento oficiais (mesma lista em frontend/src/utils/tipos.js).
// Texto livre antigo (ou de uma tela antiga) vira o tipo oficial mais proximo;
// o texto digitado vai para a anotacao da triagem.

const TIPOS = [
  'INICIAL',
  'AGENDAMENTO',
  'RETORNO',
  'INFORMAÇÕES',
  'JUNTADA DE DOCUMENTOS',
  'REQUERIMENTO ADMINISTRATIVO (INSS)',
  'MIGRANTE / ESTRANGEIRO',
  'ENCAMINHAMENTO',
  'INTIMAÇÃO / MANDADO / PRAZO',
  'ENCAIXE',
  'ASSINATURA',
  'OUTROS',
]

const plain = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()

// Comeca com um tipo oficial (qualquer separador depois: espaco, -, |, hora)
const LEADING = [
  ['INICIAL', 'INICIAL'],
  ['AGENDAMENTO', 'AGENDAMENTO'],
  ['RETORNO', 'RETORNO'],
  ['INFORMACOES', 'INFORMAÇÕES'],
  ['JUNTADA', 'JUNTADA DE DOCUMENTOS'],
]

// Na ordem: o primeiro que casar leva (levantamento de nov/2026 na base de prod)
const RULES = [
  [/^(INICIALN|INICIA|INICAL|POSSIBILIDADE INICAL)\b/, 'INICIAL'],
  [/^(IINFORMACOES|NFORMACOES|INFROMACOES|INFORMACAO|INFORMA\.|INFO\.|INF\b|INF\.)/, 'INFORMAÇÕES'],
  [/^RETRONO\b/, 'RETORNO'],
  [/^(AGENDAMENTOS|AGENDAMENTOA|REAGENDAMENTO|2 AGENDAMENTOS)\b/, 'AGENDAMENTO'],
  [/ESTRANGEIR|MIGRA|IMIGRANTE|REFUGIO|RNM\b/, 'MIGRANTE / ESTRANGEIRO'],
  [/^\(?CONSULTAR PEDIDO ADMINISTRATIVO|^REQ|REQUER|EXIG/, 'REQUERIMENTO ADMINISTRATIVO (INSS)'],
  [/^ENC\b|^ENC\.|ENCAMINHA|^MEDICAMENTO - ENC/, 'ENCAMINHAMENTO'],
  [/ENCAIXE/, 'ENCAIXE'],
  [/INTIMACAO|MANDADO|MANDATO|CITACAO|AUDIENCIA|SENTENCA/, 'INTIMAÇÃO / MANDADO / PRAZO'],
  [/ASSI?S?NATURA/, 'ASSINATURA'],
  [/^AGEND|NOVO AGENDAMENTO|PERDEU AGENDADO|ESTAVA AGENDADO|POSSIVEL AGENDAMENTO/, 'AGENDAMENTO'],
  [/^TEM (UM )?(PAJ|PROCESSO)|^PAJ\b|DESARQUIV|REABRIR PROCESSO|JA TEM PROCESSO|^\d{4}\/022|PAJ ARQUIVADO|- RETORNO$/, 'RETORNO'],
  [/^(AJUDA|AUXILIO|ORIENTAC|DUVIDA|CONSULTA|TEM ADV|ASSISTEN)/, 'INFORMAÇÕES'],
]

// Texto do tipo -> { tipo, nota }. nota = o texto original quando ele nao e
// exatamente o tipo oficial (nada se perde).
function mapTipo(text) {
  const original = String(text ?? '').trim()
  const t = plain(original)
  if (!t) return { tipo: '', nota: '' }
  const official = TIPOS.find((tipo) => plain(tipo) === t)
  if (official) return { tipo: official, nota: '' }
  let tipo = 'OUTROS'
  const lead = t.replace(/^[^A-Z]+/, '')
  const leading = LEADING.find(([key]) => lead.startsWith(key) && !/[A-Z]/.test(lead[key.length] || ''))
  if (leading) tipo = leading[1]
  else {
    const rule = RULES.find(([re]) => re.test(t))
    if (rule) tipo = rule[1]
  }
  return { tipo, nota: original }
}

// Lista em uso: a de Configuracoes (banco) ou, sem ela, a padrao
async function getTipos() {
  const GlobalModel = require('./models/global')
  const g = await GlobalModel.findOne().select('tiposAtendimento').lean()
  return g?.tiposAtendimento?.length ? g.tiposAtendimento : TIPOS
}

// Tipo enviado -> um tipo da lista em uso ({ tipo, nota }). Fora da lista:
// o mais proximo da lista padrao, ou OUTROS; o texto vai para a anotacao.
function resolveTipo(text, list) {
  const original = String(text ?? '').trim()
  if (!original) return { tipo: '', nota: '' }
  const exact = list.find((t) => plain(t) === plain(original))
  if (exact) return { tipo: exact, nota: '' }
  const { tipo } = mapTipo(original)
  const inList = list.find((t) => plain(t) === plain(tipo))
  return { tipo: inList || list.find((t) => plain(t) === 'OUTROS') || '', nota: original }
}

module.exports = { TIPOS, mapTipo, getTipos, resolveTipo, plainTipo: plain }
