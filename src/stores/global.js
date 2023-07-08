import { defineStore } from "pinia";
import axios from "axios";
import config from "../../config.js";

export const useGlobalStore = defineStore("global", {
  state: () => ({
    monitorMode: 0,
    soundNotification: false,
    soundCallTicket: false,
    soundCallTicketVoice: 0,
    currentTicket: "999",
    currentTable: "99",
    currentUser: "-",
    lastTicket: "999",
    lastTable: "99",
    ticketInQueue: Array(100).fill(0),
    ticketType: Array(100).fill("-"),
    ticketPreferential: Array(100).fill(0),
    ticketName: Array(100).fill("-"),
  }),
  getters: {
    nextTicketEnterInQueue(state) {
      return state.ticketInQueue.findIndex((ticket) => ticket === 0);
    },
  },
  actions: {
    updatedGlobalCurrentTicket(data) {
      console.log(data);
      this.changeCurrentTicket(data);
    },
    resetStoreAllTickets() {
      this.ticketInQueue = Array(this.ticketInQueue.length).fill(0);
      this.ticketType = Array(this.ticketType.length).fill(0);
      this.ticketPreferential = Array(this.ticketPreferential.length).fill(0);
      this.ticketName = Array(this.ticketName.length).fill(0);
      return 0;
    },
    getGlobalVariablesAPI() {
      return axios
        .get(`${config.url_server_api}`)
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

          this.monitorMode = monitorMode;
          this.soundNotification = soundNotification;
          this.soundCallTicket = soundCallTicket;
          this.soundCallTicketVoice = soundCallTicketVoice;
          this.currentTicket = currentTicket;
          this.currentTable = currentTable;
          this.currentUser = currentUser;
          this.lastTicket = lastTicket;
          this.lastTable = lastTable;
          this.ticketInQueue = ticketInQueue;
          this.ticketType = ticketType;
          this.ticketPreferential = ticketPreferential;
          this.ticketName = ticketName;
        })
        .catch((error) => {
          console.error("Erro ao obter as variáveis:", error);
          throw error;
        });
    },
    updateVariablesInAPI() {
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
      } = this.$state;

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
    updateGlobalConfigs(updatedData) {
      Object.assign(this.$state, updatedData);

      return axios
        .put(`${config.url_server_api}/updateGlobalConfigs`, this.$state)
        .then(() => {
          console.log("Configurações globais atualizadas no backend");
        })
        .catch((error) => {
          console.error("Erro ao atualizar as configurações globais no backend:", error);
          throw error;
        });
    },
    setMonitorMode(monitorMode) {
      this.monitorMode = monitorMode;
    },
    setSoundNotification(soundNotification) {
      this.soundNotification = soundNotification;
    },
    setSoundCallTicket(soundCallTicket) {
      this.soundCallTicket = soundCallTicket;
    },
    setSoundCallTicketVoice(soundCallTicketVoice) {
      this.soundCallTicketVoice = soundCallTicketVoice;
    },
    setCurrentTicket(ticket) {
      this.currentTicket = ticket;
    },
    setCurrentTable(table) {
      this.currentTable = table;
    },
    setCurrentUser(table) {
      this.currentUser = table;
    },
    setLastTicket(ticket) {
      this.lastTicket = ticket;
    },
    setLastTable(table) {
      this.lastTable = table;
    },
    changeCurrentTicket(data) {
      this.lastTicket = this.currentTicket;
      this.lastTable = this.currentTable;
      const nextTicketNumber = data.newTicket;
      const nextTableNumber = data.newTable;
      this.currentTicket = nextTicketNumber.toString().padStart(2, "0");
      this.currentTable = nextTableNumber.toString();
      this.currentUser = data.newUser;
    },
    setTicketInQueue({ array }) {
      this.ticketInQueue = array;
    },
    setTicketType({ array }) {
      this.ticketType = array;
    },
    markTicketAsQueue({ index }) {
      this.ticketInQueue[index] = 1;
      this.currentTicket = index.toString().padStart(3, "0");
    },
    setTicketPreferential({ array }) {
      this.ticketPreferential = array;
    },
    setTicketName({ array }) {
      this.ticketName = array;
    },
    setTicketData({ index, ticketInQueue, ticketType, ticketPreferential, ticketName }) {
      this.ticketInQueue[index] = ticketInQueue;
      this.ticketType[index] = ticketType;
      this.ticketPreferential[index] = ticketPreferential;
      this.ticketName[index] = ticketName;
    },
  },
});
