import axios from "axios";
import config from "../../config.js";

export const globalModule = {
  state: {
    monitorMode: 0,
    soundNotification: true,
    soundCallTicket: true,
    soundCallTicketVoice: 0,
    currentTicket: "999",
    currentTable: "99",
    currentUser: "-",
    lastTicket: "999",
    lastTable: "99",
    ticketInQueue: Array(100).fill(0), // se o ticket foi chamado: 0 ou 1
    ticketType: Array(100).fill("-"),
    ticketPreferential: Array(100).fill(0), // se o ticket é preferencial: 0 ou 1
    ticketName: Array(100).fill("-"), // nome do usuário do ticket
  },

  mutations: {
    setMonitorMode(state, monitorMode) {
      state.monitorMode = monitorMode;
    },
    setSoundNotification(state, soundNotification) {
      state.soundNotification = soundNotification;
    },
    setSoundCallTicket(state, soundCallTicket) {
      state.soundCallTicket = soundCallTicket;
    },
    setSoundCallTicketVoice(state, soundCallTicketVoice) {
      state.soundCallTicketVoice = soundCallTicketVoice;
    },
    setCurrentTicket(state, ticket) {
      state.currentTicket = ticket;
    },
    setCurrentTable(state, table) {
      state.currentTable = table;
    },
    setCurrentUser(state, table) {
      state.currentUser = table;
    },
    setLastTicket(state, ticket) {
      state.lastTicket = ticket;
    },
    setLastTable(state, table) {
      state.lastTable = table;
    },

    changeCurrentTicket(state, data) {
      console.log(data);

      state.lastTicket = state.currentTicket;
      state.lastTable = state.currentTable;
      const nextTicketNumber = data.newTicket;
      const nextTableNumber = data.newTable;
      state.currentTicket = nextTicketNumber.toString().padStart(2, "0");
      state.currentTable = nextTableNumber.toString();
      state.currentUser = data.newUser;
    },
    setTicketInQueue(state, { array }) {
      state.ticketInQueue = array;
    },
    setTicketType(state, { array }) {
      state.ticketType = array;
    },
    markTicketAsQueue(state, { index }) {
      state.ticketInQueue[index] = 1;
      state.currentTicket = index.toString().padStart(3, "0");
    },
    setTicketPreferential(state, { array }) {
      state.ticketPreferential = array;
    },
    setTicketName(state, { array }) {
      state.ticketName = array;
    },
    setTicketData(
      state,
      { index, ticketInQueue, ticketType, ticketPreferential, ticketName }
    ) {
      state.ticketInQueue[index] = ticketInQueue;
      state.ticketType[index] = ticketType;
      state.ticketPreferential[index] = ticketPreferential;
      state.ticketName[index] = ticketName;
    },
  },
  actions: {
    updatedGlobalCurrentTicket({ commit }, data) {
      console.log(data);
      commit("changeCurrentTicket", data);
    },
    resetStoreAllTickets({ commit }) {
      const ticketInQueue = Array(this.state.ticketInQueue.length).fill(0);
      const ticketType = Array(this.state.ticketType.length).fill(0);
      const ticketPreferential = Array(
        this.state.ticketPreferential.length
      ).fill(0);
      const ticketName = Array(this.state.ticketName.length).fill(0);

      commit("setTicketInQueue", { array: ticketInQueue });
      commit("setticketType", { array: ticketType });
      commit("setTicketPreferential", { array: ticketPreferential });
      commit("setTicketName", { array: ticketName });
    },
    getGlobalVariablesAPI({ commit }) {
      return axios
        .get(`${config.url_server_api}`) // Ajuste a URL se necessário
        .then((response) => {
          const {
            monitorMode,
            soundNotification,
            soundCallTicket,
            soundCallTicketVoice,
            currentTicket,
            currentTable,
            currentUser,
            lastTicket,
            lastTable,
            ticketInQueue,
            ticketType,
            ticketPreferential,
            ticketName,
          } = response.data;

          // Chamar as mutações para atualizar as variáveis globais
          commit("setMonitorMode", monitorMode);
          commit("setSoundNotification", soundNotification);
          commit("setSoundCallTicket", soundCallTicket);
          commit("setSoundCallTicketVoice", soundCallTicketVoice);
          commit("setCurrentTicket", currentTicket);
          commit("setCurrentTable", currentTable);
          commit("setCurrentUser", currentUser);
          commit("setLastTicket", lastTicket);
          commit("setLastTable", lastTable);

          // Atualizar as arrays com os dados recebidos
          commit("setTicketInQueue", { array: ticketInQueue });

          commit("setTicketType", { array: ticketType });
          commit("setTicketPreferential", {
            array: ticketPreferential,
          });
          commit("setTicketName", { array: ticketName });
        })
        .catch((error) => {
          console.error("Erro ao obter as variáveis:", error);
          throw error;
        });
    },
    updateVariablesInAPI({ state }) {
      const {
        currentTicket,
        currentTable,
        currentUser,
        lastTicket,
        lastTable,
        ticketInQueue,
        ticketType,
        ticketPreferential,
        ticketName,
      } = state;
      const updatedData = {
        currentTicket,
        currentTable,
        currentUser,
        lastTicket,
        lastTable,
        ticketInQueue,
        ticketType,
        ticketPreferential,
        ticketName,
      };
      console.log(updatedData);

      // Envie uma requisição PUT ou POST para a API com os dados atualizados
      return axios
        .put(`${config.url_server_api}/updateVariablesInAPI`, updatedData)
        .then(() => {
          console.log("Variáveis atualizadas no backend");
        })
        .catch((error) => {
          console.error("Erro ao atualizar as variáveis no backend:", error);
          throw error;
        });
    },
    updateGlobalConfigs({ state }, updatedData) {
      state = updatedData;

      return axios
        .put(`${config.url_server_api}/updateGlobalConfigs`, state)
        .then(() => {
          console.log("Configurações globais atualizadas no backend");
        })
        .catch((error) => {
          console.error(
            "Erro ao atualizar as configurações globais no backend:",
            error
          );
          throw error;
        });
    },
  },
};

export default globalModule;
