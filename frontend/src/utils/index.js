export function convertDate(date) {
  if (!date) return;
  const dateString = new Date(date);
  const formatedDate = `${dateString.toLocaleDateString(
    "pt-BR"
  )} às ${dateString.toLocaleTimeString("pt-BR", {
    hour12: false,
  })}`.slice(0, 19);
  return formatedDate;
}

// Data curta para os cartoes da fila: "hoje às 21:29", "ontem às 08:05"
// ou "15/11 às 14:40". Cabe numa linha mesmo na barra lateral estreita.
export function shortDateTime(date, now = new Date()) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days === 0) return `hoje às ${time}`;
  if (days === 1) return `ontem às ${time}`;
  const day = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${day} às ${time}`;
}

// Hora com o dia entre parenteses, para os cartoes da barra lateral:
// "16:00 (hoje)", "08:05 (ontem)", "14:40 (09/11)"
export function timeWithDay(date, now = new Date()) {
  const text = shortDateTime(date, now);
  const m = /^(.*) às (\d{2}:\d{2})$/.exec(text);
  return m ? `${m[2]} (${m[1]})` : text;
}

// So o primeiro nome (atendente na barra lateral: "por Andre")
export function firstWord(name) {
  return String(name ?? "").trim().split(/\s+/)[0] || "";
}

// Texto seguro para escrever em HTML (ex.: janela do PDF)
export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}

// Remove tudo que nao for digito (ex.: CPF "123.456.789-01" -> "12345678901")
export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

// CPF valido: 11 digitos e os dois digitos verificadores conferem. Sequencias
// repetidas (111.111.111-11) passam na conta, mas nao sao CPFs emitidos.
// Mesma regra do backend (backend/src/cpf.js).
export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(cpf[len])) return false;
  }
  return true;
}

// Data de nascimento <-> "AAAA-MM-DD". A triagem envia so o dia (sem hora e
// sem fuso) e o cadastro devolve assim; aqui vira a data local do seletor.
export function toDateOnly(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fromDateOnly(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

const day = (date) => new Date(date).toLocaleDateString("pt-BR");

// Visitas de uma pessoa (dias com atendimento), no texto da triagem, da
// barra lateral e do historico
//   visitText({ numero: 4, anterior: { data, tipo } }) -> "4ª visita · última em 03/10/2026 (RETORNO)"
export function visitText({ numero, total = numero, anterior = null }) {
  const head = total > numero ? `${numero}ª de ${total} visitas` : `${numero}ª visita`;
  if (!anterior) return numero === 1 ? `${head} (primeira vez)` : head;
  return `${head} · última em ${day(anterior.data)}${anterior.tipo ? ` (${anterior.tipo})` : ""}`;
}

//   visitHistoryText(...) -> "3ª de 7 visitas · primeira em 17/07/2023 · última em 10/11/2026"
export function visitHistoryText({ numero, total, primeira, ultima }) {
  const head = total > 1 ? `${numero}ª de ${total} visitas` : "Única visita";
  return total > 1 ? `${head} · primeira em ${day(primeira)} · última em ${day(ultima)}` : head;
}

// "12345678901" -> "123.456.789-01" (outros tamanhos ficam como vieram)
export function formatCpf(value) {
  const digits = onlyDigits(value);
  return digits.length === 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : digits;
}

// Anotacoes da senha para o (i): uma linha para a triagem, outra para o atendimento
export function notesText(ticket) {
  return [
    ticket?.notaTriagem && `Triagem: ${ticket.notaTriagem}`,
    ticket?.notaAtendimento && `Atendimento: ${ticket.notaAtendimento}`,
  ].filter(Boolean).join("\n");
}

// Filtro das buscas da tela: cada palavra digitada tem que aparecer em algum
// dos campos, sem diferenciar acento nem maiuscula. So numeros tambem casam
// com o CPF digitado com ou sem pontuacao.
const searchable = (value) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function matchesSearch(fields, query) {
  const words = searchable(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.map(searchable).join(" ");
  const digits = fields.map(onlyDigits).join(" ");
  return words.every((w) => text.includes(w) || (/^[\d.-]+$/.test(w) && onlyDigits(w) && digits.includes(onlyDigits(w))));
}

export function convertHours(ms) {
  const hours = Math.floor(ms / 1000 / 60 / 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const seconds = Math.floor((ms / 1000) % 60);

  const formatedDate = `${hours}h ${minutes}m ${seconds}s`;
  return formatedDate;
}

export function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return !isNaN(date) && date instanceof Date;
}

export function calculateAge(date) {
  if (date == null)
    return false
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
