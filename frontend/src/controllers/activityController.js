import { api } from "@/services/api.js";

// Registro de atividades (admin)
export async function getActivity(params = {}) {
  try {
    return await api.get(`/api/activity`, { params });
  } catch (error) {
    return error.response;
  }
}

// Eventos que so o navegador conhece (PDF gerado, guiche alterado).
// Nunca atrapalha a acao do usuario: falha silenciosa.
export async function logClientEvent(type, details = {}) {
  try {
    await api.post(`/api/activity/client`, { type, details }, { timeout: 5000 });
  } catch {
    // sem registro, mas a acao continua
  }
}

// Indicadores por dia (admin)
export async function getDailyStats(params = {}) {
  try {
    return await api.get(`/api/stats/daily`, { params });
  } catch (error) {
    return error.response;
  }
}

// Logs tecnicos do backend (admin)
export async function getLogFiles() {
  try {
    return await api.get(`/api/logs/files`);
  } catch (error) {
    return error.response;
  }
}

export async function getLogs(params = {}) {
  try {
    return await api.get(`/api/logs`, { params });
  } catch (error) {
    return error.response;
  }
}
