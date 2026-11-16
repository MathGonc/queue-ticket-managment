import { convertHours } from "@/utils/index.js";

// Rotulos dos tipos registrados pelo backend (src/activity.js)
export const ACTIVITY_LABELS = {
  senha_emitida: "Senha emitida",
  senha_chamada: "Senha chamada",
  senha_rechamada: "Senha chamada novamente",
  senha_excluida: "Senha excluída",
  numeracao_resetada: "Numeração zerada",
  login: "Entrou",
  logout: "Saiu",
  login_falhou: "Login falhou",
  login_bloqueado: "Login bloqueado",
  usuario_criado: "Usuário criado",
  usuario_alterado: "Usuário alterado",
  usuario_excluido: "Usuário excluído",
  config_monitor_alterada: "Configuração do monitor",
  servidor_iniciado: "Servidor iniciado",
};

const PREFERENTIAL = { 0: "normal", 1: "preferencial", 2: "80+" };
const ROLES = { 1: "Monitor", 2: "Atendente", 3: "Administrador" };
const FIELDS = {
  monitorMode: "modo",
  showTicketNumber: "mostrar número",
  soundNotification: "som",
  soundCallTicket: "leitura por voz",
  soundCallTicketVoice: "voz",
  username: "nome",
  login: "login",
  role: "função",
};

export function activityLabel(type) {
  return ACTIVITY_LABELS[type] || type;
}

function ticket(details) {
  const pref = PREFERENTIAL[details.preferencial];
  return `Senha ${details.numero}` + (pref && pref !== "normal" ? ` (${pref})` : "");
}

function formatValue(value) {
  if (value === true) return "sim";
  if (value === false) return "não";
  if (value === null || value === undefined) return "-";
  return String(value);
}

// Texto da coluna "Detalhes"
export function describeActivity(activity) {
  const d = activity?.details || {};
  switch (activity?.type) {
    case "senha_emitida":
      return ticket(d) + (d.tipo ? ` - ${d.tipo}` : "");
    case "senha_chamada":
      return ticket(d) +
        (d.guiche != null ? ` no guichê ${d.guiche}` : "") +
        (d.esperaMs != null ? ` - espera ${convertHours(d.esperaMs)}` : "");
    case "senha_rechamada":
      return ticket(d) + (d.guiche != null ? ` no guichê ${d.guiche}` : "");
    case "senha_excluida":
      return `Senha ${d.numero}` + (d.status === 2 ? " (já atendida)" : " (na fila)");
    case "numeracao_resetada":
      return d.proximaSenhaAntes != null ? `Próxima senha era a ${d.proximaSenhaAntes}` : "";
    case "login_falhou":
      return `Login "${d.login}" - ${d.motivo || "falhou"}`;
    case "login_bloqueado":
      return `Login "${d.login}" - muitas tentativas`;
    case "usuario_criado":
      return `${d.alvo} (${ROLES[d.funcao] || d.funcao})`;
    case "usuario_alterado": {
      const parts = (d.campos || []).map((f) => FIELDS[f] || f);
      if (d.senhaAlterada) parts.push("senha");
      return `${d.alvo}: ${parts.length ? parts.join(", ") : "sem mudanças"}`;
    }
    case "usuario_excluido":
      return `${d.alvo}` + (d.nome ? ` (${d.nome})` : "");
    case "config_monitor_alterada":
      return Object.entries(d.alteracoes || {})
        .map(([field, change]) => `${FIELDS[field] || field}: ${formatValue(change.de)} → ${formatValue(change.para)}`)
        .join("; ");
    case "servidor_iniciado":
      return `versão ${d.versao || "?"}`;
    default:
      return "";
  }
}
