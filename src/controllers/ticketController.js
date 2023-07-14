import axios from "axios";
import config from "../../config";

export async function loadTicketsInQueue() {
  try {
    const response = await axios.get(`${config.url_server}/loadTicketsInQueue`);
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function loadAllTickets() {
  try {
    const response = await axios.get(`${config.url_server}/loadAllTickets`);
    console.log(response.data.config);
    return response.data.config;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function insertTicket(updatedData) {
  try {
    const response = await axios.post(`${config.url_server}/insertTicket`, updatedData);
    console.log(response);
    return response;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function updateTicket(updatedData) {
  console.log(updatedData);
  axios.put(`${config.url_server}/updateTicket`, updatedData);
}

export async function deleteTicket(updatedData) {
  console.log(updatedData);
  axios.delete(`${config.url_server}/deleteTicket`, updatedData);
}
