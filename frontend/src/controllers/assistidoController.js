import { api } from "@/services/api.js";

// Sugestoes enquanto digita: { cpf } (comeco do CPF) ou { nome } (palavras)
export async function getSugestoes(params) {
  const response = await api.get(`/assistidos/sugestoes`, { params });
  return response.data.sugestoes;
}

// Depois de escolher/digitar a pessoa: { id } | { cpf } | { nome } (Sem CPF)
// -> { candidatos, hoje }
export async function getTriagem(params) {
  const response = await api.get(`/assistidos/triagem`, { params });
  return response.data;
}

// "Confirmar" do bloco de pendencias
// { manterId?, juntarIds?, nome, cpf? | semCpf: true } -> { assistido, juntados }
export async function resolverCadastro(body) {
  const response = await api.post(`/assistidos/resolver`, body);
  return response.data;
}
