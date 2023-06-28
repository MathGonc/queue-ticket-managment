import { createStore } from "vuex";

export default createStore({
  state: {
    currentTicket: "001",
    currentTable: "00",
    lastTicket: "000",
    lastTable: "00",
  },
  mutations: {
    setCurrentTicket(state, ticket) {
      state.currentTicket = ticket;
    },
    setCurrentTable(state, table) {
      state.currentTable = table;
    },
    setLastTicket(state, ticket) {
      state.lastTicket = ticket;
    },
    setLastTable(state, table) {
      state.lastTable = table;
    },
    incrementCurrentTicket(state) {
      const ticketNumber = parseInt(state.currentTicket);
      const nextTicketNumber = ticketNumber + 1;
      state.currentTicket = nextTicketNumber.toString().padStart(3, "0");
    },
  },
  actions: {
    updateCurrentTicket({ commit }) {
      commit("incrementCurrentTicket");
    },
  },
});
