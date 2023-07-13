import axios from "axios";
import config from "../../config";

export async function loadTicketsInQueue() {
  try {
    const response = await axios.get(`${config.url_server}/dbLoadTicketsInQueue`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function loadAllTickets() {
  try {
    const response = await axios.get(`${config.url_server}/dbLoadTickets`);
    console.log(response.data.config);
    return response.data.config;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function insertTicket(updatedData) {
  console.log(updatedData);
  axios.post(`${config.url_server}/dbInsertTicket`, updatedData);
}

export async function updateTicket(updatedData) {
  console.log(updatedData);
  axios.put(`${config.url_server}/dbUpdateTicket`, updatedData);
}
