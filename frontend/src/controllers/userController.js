import { api } from "@/services/api.js";
import { useAuth } from "../stores/auth.js";

export async function checkToken() {
  try {
    const response = await api.get(`/auth/verify`);
    return response;
  } catch (error) {
    const auth = useAuth();
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

export async function updatePassword(id, newPassword) {
  try {
    const response = await api.put(`/api/users/${id}`, { password: newPassword });
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
