import axios from "axios";

export const API_BASE_URL = "http://localhost:3030/api"; // Substitua pelo URL correto do seu servidor backend

export const getVariables = () => {
    return axios
        .get(`${API_BASE_URL}`)
        .then((response) => response.data)
        .catch((error) => {
            console.error("Erro ao obter os dados das variáveis:", error);
            throw error;
        });
};
