import axios from "axios";
import config from "../config.js";

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

export async function loadTicket(data) {
  try {
    const response = await axios.get(`${config.url_server}/loadTicket/${data}`);
    return response;
  } catch (error) {
    console.error(error);
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

export async function updateTicketCalled(ticketID, data) {
  try {
    const response = axios.put(`${config.url_server}/updateTicketCalled/${ticketID}`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteTicket(ticketID) {
  try {
    const response = axios.delete(`${config.url_server}/deleteTicket/${ticketID}`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
