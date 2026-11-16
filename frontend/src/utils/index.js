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
