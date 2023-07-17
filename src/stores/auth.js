import { computed, ref } from "vue";
import { defineStore } from "pinia";
import http from "@/services/http.js";
import axios from "axios";
import router from "../router";
import { useUserStore } from "@/stores/user.js";
import config from "../../config";

export const useAuth = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"));
  const isAuth = ref(false);

  function setToken(tokenValue) {
    localStorage.setItem("token", tokenValue);
    token.value = tokenValue;
  }

  function setIsAuth(auth) {
    isAuth.value = auth;
  }

  function setUserData(data) {
    const userStore = useUserStore();
    userStore.userData = data;
  }

  const isAuthenticated = computed(() => {
    return token.value;
  });

  async function checkToken() {
    try {
      const tokenAuth = "Bearer " + token.value;
      const { data } = await http.get("/auth/verify", {
        headers: {
          Authorization: tokenAuth,
        },
      });

      return data;
    } catch (error) {
      clearToken();
      router.push("/login");
      console.log("error", error.response.data);
    }
  }

  async function checkPermission() {
    try {
      const tokenAuth = "Bearer " + token.value;
      const { data } = await http.get("/auth/verifyPermission", {
        headers: {
          Authorization: tokenAuth,
        },
      });
      return data;
    } catch (error) {
      clearToken();
      router.push("/login");
      console.log("error", error.response.data);
    }
  }

  function clearToken() {
    localStorage.clear();
    //localStorage.removeItem("token");
    token.value = null;
  }

  async function login(loginData) {
    try {
      const response = await axios.post(
        `${config.url_server}/login`,
        loginData
      );
      const data = response.data;
      setToken(data.token);
      isAuth.value = true;
      setUserData(data.user);
      router.push({ name: "index" });
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function register(data) {
    try {
      await http.post("/register", data);
      //router.push("/login");
    } catch (error) {
      console.log(error.response.data);
      return error.response.status;
    }
  }

  async function saveConfigs(data) {
    try {
      await http.post("/saveConfigs", data);
    } catch (error) {
      console.log(error.response.data);
      return error.response.status;
    }
  }

  return {
    token,
    isAuth,
    isAuthenticated,
    setToken,
    checkToken,
    checkPermission,
    setIsAuth,
    clearToken,
    login,
    register,
    saveConfigs,
  };
});
