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
    const response = await axios.post(
      `${config.url_server}/insertTicket`,
      updatedData
    );
    console.log(response);
    return response;
  } catch (error) {
    console.error("Erro ao carregar as configurações do monitor:", error);
    throw error;
  }
}

export async function updateTicketCalled(updatedData) {
  try {
    axios.put(`${config.url_server}/updateTicket`, updatedData);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteTicket(ticketID) {
  try {
    const response = axios.delete(
      `${config.url_server}/deleteTicket/${ticketID}`
    );
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
