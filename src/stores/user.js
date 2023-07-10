import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useUserStore = defineStore("user", {
  state: () => {
    return {
      userData: useLocalStorage("userData", {
        username: "",
        login: "",
        language: "",
      }),
    };
  },

  getters: {
    getUsername: (state) => state.username,
    getLogin: (state) => state.login,
    getLanguage: (state) => state.language,
  },

  actions: {
    setUsername(username) {
      this.username = username;
    },
    setLogin(login) {
      this.login = login;
    },
    setLanguage(language) {
      this.language = language;
    },
  },
});
