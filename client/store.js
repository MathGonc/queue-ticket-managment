import { createStore } from "vuex";
import axios from "axios";
import config from "./config.js";

export default createStore({
    state: {
        currentTicket: "000",
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
        changeCurrentTicket(state, data) {
            console.log(data);
            if (state.lastTicket !== state.currentTicket) {
                state.lastTicket = state.currentTicket;
                state.lastTable = state.currentTable;
            }

            const nextTicketNumber = data.newTicket;
            const nextTableNumber = data.newTable;
            state.currentTicket = nextTicketNumber.toString().padStart(3, "0");
            state.currentTable = nextTableNumber.toString().padStart(2, "0");
        },
    },
    actions: {
        updatedGlobalCurrentTicket({ commit }, data) {
            console.log(data);
            commit("changeCurrentTicket", data);
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
                .put(`${config.url_server_api}/updateVariables`, updatedData)
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
