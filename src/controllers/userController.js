import axios from "axios";
import config from "../config.js";
import { useAuth } from "../stores/auth.js";

export async function checkToken() {
  const auth = await useAuth();
  try {
    const tokenAuth = "Bearer " + auth.token;
    const response = await axios.get(`${config.url_server}/auth/verify`, {
      headers: {
        Authorization: tokenAuth,
      },
    });
    return response;
  } catch (error) {
    auth.clearToken();
    return error.response;
  }
}

export async function loginUser(loginData) {
  try {
    const response = await axios.post(`${config.url_server}/login`, loginData);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function registerUser(data) {
  try {
    await axios.post(`${config.url_server}/register`, data);
    //router.push("/login");
  } catch (error) {
    console.log(error.response.data);
    return error.response.status;
  }
}
