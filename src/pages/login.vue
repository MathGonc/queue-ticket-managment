<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input type="text" v-model="username" placeholder="Usuário" required />
      <input type="password" v-model="password" placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "page_login",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    login() {
      axios
        .post("/login", {
          username: this.username,
          password: this.password,
        })
        .then((response) => {
          console.log(response.data.message);
        })
        .catch((error) => {
          console.error(error.response.data.error);
        });
    },
  },
};
</script>
