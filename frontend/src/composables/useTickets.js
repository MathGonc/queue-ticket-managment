import { ref } from 'vue'
import {
  loadTicketsInQueue,
  loadTicket,
  insertTicket,
  updateTicketCalled,
  deleteTicket,
  loadTicketHistory
} from '@/controllers/ticketController.js'

export function useTickets() {
  const tickets = ref([])
  const loading = ref(false)

  async function fetchTicketsInQueue() {
    loading.value = true
    try {
      const response = await loadTicketsInQueue()
      tickets.value = response.data.ticket
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    tickets,
    loading,
    fetchTicketsInQueue,
    loadTicket,
    insertTicket,
    updateTicketCalled,
    deleteTicket,
    loadTicketHistory,
  }
}
