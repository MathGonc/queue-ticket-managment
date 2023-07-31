import axios from "axios";
import config from "../config.js";

export async function loadMonitorConfigs() {
  try {
    const response = await axios.get(`${config.url_server}/getConfigsDB`);
    console.log(response.data.config);
    return response.data.config;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function saveMonitorConfigs(updatedData) {
  try {
    axios.post(`${config.url_server}/saveConfigsDB`, updatedData);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getGlobalTicketData() {
  try {
    const response = await axios.get(`${config.url_server}/getGlobalTicketData`);
    return response;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function updateGlobalTicketData(data) {
  try {
    const response = await axios.put(`${config.url_server}/updateGlobalTicketData`, data);
    console.log("🚀 ~ file: globalController.js:38 ~ updateGlobalTicketData ~ response:", response);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function resetGlobalTicketData() {
  try {
    const response = await axios.put(`${config.url_server}/resetGlobalTicketData`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
