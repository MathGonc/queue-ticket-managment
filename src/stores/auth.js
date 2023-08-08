import { ref } from "vue";
import { defineStore } from "pinia";

export const useAuth = defineStore("auth", {
  state: () => ({
    token: ref(localStorage.getItem("token")),
    isAuth: ref(false),
    userData: ref({}),
  }),
  actions: {
    clearToken() {
      this.setIsAuth(false);
      localStorage.clear();
      //localStorage.removeItem("token");
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
  },
});
