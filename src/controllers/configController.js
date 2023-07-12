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
  console.log(config.url_server);
  console.log(updatedData);
  axios.post(`${config.url_server}/saveConfigsDB`, updatedData);
}
