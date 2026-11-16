import { defineStore } from "pinia";

export const useAuth = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token"),
    isAuth: false,
    userData: {
      username: "",
    },
  }),
  actions: {
    clearToken() {
      this.setIsAuth(false);
      localStorage.removeItem("token");
      this.token = null;
    },

    setToken(tokenValue) {
      localStorage.setItem("token", tokenValue);
      this.token = tokenValue;
      this.isAuth = true;
    },

    setIsAuth(auth) {
      this.isAuth = auth;
    },

    setUserData(userdata) {
      this.userData = userdata;
    },
  },

  getters: {
    isAuthenticated: (state) => state.token,
    getUsername: (state) => state.userData.username,
  },
});
