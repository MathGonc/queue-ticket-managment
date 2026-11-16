import { api } from "@/services/api.js";

export async function loadMonitorConfigs() {
  try {
    const response = await api.get(`/getConfigsDB`);
    return response.data.config;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function saveMonitorConfigs(updatedData) {
  try {
    const response = await api.post(`/saveConfigsDB`, updatedData);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getGlobalTicketData() {
  try {
    const response = await api.get(`/getGlobalTicketData`);
    return response;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function updateGlobalTicketData(data) {
  try {
    const response = await api.put(`/updateGlobalTicketData`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function resetGlobalTicketData() {
  try {
    const response = await api.put(`/resetGlobalTicketData`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
