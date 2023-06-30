import { createStore } from "vuex";
import axios from "axios";
import config from "./config.js";

export default createStore({
    state: {
        currentTicket: "999",
        currentTable: "99",
        currentUser: "-",
        lastTicket: "999",
        lastTable: "99",
        lastUser: "-",
        ticketInQueue: Array(100).fill(0), // se o ticket foi chamado: 0 ou 1
        ticketPreferential: Array(100).fill(0), // se o ticket é preferencial: 0 ou 1
        ticketName: Array(100).fill("-"), // nome do usuário do ticket
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
        changeCurrentTicket(state, data) {
            console.log(data);
            if (state.lastTicket !== state.currentTicket) {
                state.lastTicket = state.currentTicket;
                state.lastTable = state.currentTable;
                state.lastUser = state.currentUser;
            }

            const nextTicketNumber = data.newTicket;
            const nextTableNumber = data.newTable;
            state.currentTicket = nextTicketNumber.toString().padStart(3, "0");
            state.currentTable = nextTableNumber.toString().padStart(2, "0");
            state.currentUser = data.newUser;
        },
        setTicketInQueue(state, { array }) {
            state.ticketInQueue = array;
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
            { index, ticketInQueue, ticketPreferential, ticketName }
        ) {
            state.ticketInQueue[index] = ticketInQueue;
            state.ticketPreferential[index] = ticketPreferential;
            state.ticketName[index] = ticketName;
        },
    },
    actions: {
        updatedGlobalCurrentTicket({ commit }, data) {
            console.log(data);
            commit("changeCurrentTicket", data);
        },
        updatedNextTicket({ commit, state }) {
            const index = state.ticketInQueue.findIndex(
                (inQueue) => inQueue === 0
            );
            if (index !== -1) {
                commit("markTicketAsQueue", { index });
            }
        },
        getVariablesAPI({ commit }) {
            return axios
                .get(`${config.url_server_api}`) // Ajuste a URL se necessário
                .then((response) => {
                    const {
                        currentTicket,
                        currentTable,
                        lastTicket,
                        lastTable,
                        ticketInQueue,
                        ticketPreferential,
                        ticketName,
                    } = response.data;

                    // Chamar as mutações para atualizar as variáveis globais
                    commit("setCurrentTicket", currentTicket);
                    commit("setCurrentTable", currentTable);
                    commit("setLastTicket", lastTicket);
                    commit("setLastTable", lastTable);

                    // Atualizar as arrays com os dados recebidos
                    commit("setTicketInQueue", { array: ticketInQueue });
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
                lastTicket,
                lastTable,
                ticketInQueue,
                ticketPreferential,
                ticketName,
            } = state;
            const updatedData = {
                currentTicket,
                currentTable,
                lastTicket,
                lastTable,
                ticketInQueue,
                ticketPreferential,
                ticketName,
            };
            console.log(updatedData);

            // Envie uma requisição PUT ou POST para a API com os dados atualizados
            return axios
                .put(
                    `${config.url_server_api}/updateVariablesInAPI`,
                    updatedData
                )
                .then(() => {
                    console.log("Variáveis atualizadas no backend");
                })
                .catch((error) => {
                    console.error(
                        "Erro ao atualizar as variáveis no backend:",
                        error
                    );
                    throw error;
                });
        },
    },
});
