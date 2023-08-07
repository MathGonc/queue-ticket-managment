import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useAuth = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"));
  const isAuth = ref(false);

  function clearToken() {
    setIsAuth(false);
    localStorage.clear();
    //localStorage.removeItem("token");
    token.value = null;
  }

  function setToken(tokenValue) {
    localStorage.setItem("token", tokenValue);
    token.value = tokenValue;
    isAuth.value = true;
  }

  function setIsAuth(auth) {
    isAuth.value = auth;
  }

  const isAuthenticated = computed(() => {
    return token.value;
  });

  return {
    token,
    isAuth,
    isAuthenticated,
    clearToken,
    setToken,
    setIsAuth,
  };
});
