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

// Texto seguro para escrever em HTML (ex.: janela do PDF)
export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}

// Remove tudo que nao for digito (ex.: CPF "123.456.789-01" -> "12345678901")
export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
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
