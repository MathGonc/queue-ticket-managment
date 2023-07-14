import axios from "axios";
import config from "../../config";

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
    const response = await axios.get(
      `${config.url_server}/getGlobalTicketData`
    );
    console.log(response);
    return response;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function updateGlobalTicketData(data) {
  try {
    const response = await axios.put(
      `${config.url_server}/updateGlobalTicketData`,
      data
    );
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
