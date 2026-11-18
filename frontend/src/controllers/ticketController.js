import { api } from "@/services/api.js";

export async function loadTicketsInQueue() {
  try {
    const response = await api.get(`/loadTicketsInQueue`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function loadTicket(data) {
  try {
    const response = await api.get(`/loadTicket/${data}`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function insertTicket(updatedData) {
  try {
    const response = await api.post(`/insertTicket`, updatedData);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateTicketCalled(ticketID, data) {
  try {
    const response = await api.put(`/updateTicketCalled/${ticketID}`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteTicket(ticketID) {
  try {
    const response = await api.delete(`/deleteTicket/${ticketID}`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function loadTicketHistory(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString 
      ? `/loadTicketHistory?${queryString}`
      : `/loadTicketHistory`
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Anotacao do atendimento (painel de atendimento)
export async function saveNotaAtendimento(ticketID, notaAtendimento) {
  const response = await api.put(`/tickets/${ticketID}/notaAtendimento`, { notaAtendimento });
  return response;
}
