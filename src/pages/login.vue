<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Login:</label>
        <input v-model="login" type="text" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
import { useAuth } from "@/stores/auth.js";
import { ref } from "vue";

export default {
  name: "page_login",
  setup() {
    const auth = useAuth();
    const login = ref("");
    const password = ref("");

    function handleLogin() {
      const loginData = { login: login.value, password: password.value };
      auth.login(loginData);
    }

    return {
      login,
      password,
      handleLogin,
    };
  },
};
</script>
