import { createStore } from "vuex";
import axios from "axios";
import { API_BASE_URL } from "./src/main.js";

export default createStore({
    state: {
        currentTicket: "423432",
        currentTable: "324324",
        lastTicket: "324234",
        lastTable: "234324",
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
        getVariablesAPI({ commit }) {
            return axios
                .get(`${API_BASE_URL}`) // Ajuste a URL se necessário
                .then((response) => {
                    const {
                        currentTicket,
                        currentTable,
                        lastTicket,
                        lastTable,
                    } = response.data;

                    // Chamar as mutações para atualizar as variáveis globais
                    commit("setCurrentTicket", currentTicket);
                    commit("setCurrentTable", currentTable);
                    commit("setLastTicket", lastTicket);
                    commit("setLastTable", lastTable);
                })
                .catch((error) => {
                    console.error("Erro ao obter as variáveis:", error);
                    throw error;
                });
        },
        updateVariables({ state }) {
            const { currentTicket, currentTable, lastTicket, lastTable } =
                state;
            const updatedData = {
                currentTicket,
                currentTable,
                lastTicket,
                lastTable,
            };

            // Envie uma requisição PUT ou POST para a API com os dados atualizados
            return axios
                .put(`${API_BASE_URL}/data`, updatedData)
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
