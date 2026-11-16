import { api } from "@/services/api.js";
import { useAuth } from "../stores/auth.js";

// Valida o token no servidor e atualiza os dados do usuario no store.
// Chamado pelo guard a cada navegacao protegida (corrige o F5 sem cargo).
export async function checkToken() {
  const auth = useAuth();
  try {
    // skipAuthRedirect: quem trata o 401 aqui e o guard (evita toast duplo)
    const response = await api.get(`/auth/verify`, { skipAuthRedirect: true });
    if (response.data?.userData) auth.setUserData(response.data.userData);
    return response;
  } catch (error) {
    auth.clearToken();
    return error.response;
  }
}

export async function loginUser(loginData) {
  try {
    const response = await api.post(`/login`, loginData);
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function registerUser(data) {
  try {
    const response = await api.post(`/register`, data);
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function getUsers() {
  try {
    const response = await api.get(`/api/users`);
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function updateUser(id, userData) {
  try {
    const response = await api.put(`/api/users/${id}`, userData);
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function deleteUser(id) {
  try {
    const response = await api.delete(`/api/users/${id}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function refreshToken() {
  const auth = useAuth();
  try {
    const response = await api.post(`/auth/refresh`, {});
    if (response.data.token) {
      auth.setToken(response.data.token);
    }
    // O backend devolve o usuario atualizado (funcao pode ter mudado)
    if (response.data.user) {
      auth.setUserData(response.data.user);
    }
    return response;
  } catch (error) {
    return error.response;
  }
}
