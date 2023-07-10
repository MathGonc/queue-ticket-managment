<template>
  <div id="app">
    <router-view></router-view>
    <nav class="position-absolute top-0 end-0">
      <template v-if="auth.isAuth"
        >{{ this.userData.username }} ({{ this.userRole }})
        <button class="btn btn-outline-dark btn-sm" @click="logout()">Sair</button>
      </template>
    </nav>
    <nav class="navbar fixed-bottom">
      <!--  <span class="col pt-auto px-3">Desenvolvido por Matheus Gonçalves</span>-->
    </nav>
  </div>
</template>

<script>
import { useGlobalStore } from "@/stores/global";
import { socket } from "./socket";
import { useAuth } from "@/stores/auth.js";
import { useLocalStorage } from "@vueuse/core";

export default {
  name: "page_index",
  data() {
    return {
      userRole: 0,
    };
  },
  setup() {
    const auth = useAuth();

    const userData = useLocalStorage("userData", { username: "" });
    return {
      userData,
      auth,
    };
  },
  computed: {},
  async mounted() {
    this.transitionFade = true;
    await socket.connect();

    const globalStore = useGlobalStore();
    globalStore.getGlobalVariablesAPI();
    socket.on("receiveUpdateGlobal", () => {
      globalStore.getGlobalVariablesAPI();
    });

    if (this.auth.isAuth) {
      this.userRole = 0;
      await this.auth.checkPermission().then((data) => {
        this.userRole = data.role;
      });

      await console.log(this.userRole);
    }
  },
  methods: {
    async logout() {
      await this.auth.clearToken();
      await this.auth.setIsAuth(false);
      await this.$router.push({ name: "login" });
    },
  },
};
</script>

<style>
html,
body {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  opacity: 1;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #ffffff 10px),
    repeating-linear-gradient(#eaeaea55, #eaeaea);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px; /* Adicione o valor desejado para criar espaço entre a topbar e o conteúdo abaixo */
}

.sidebar {
  text-align: center;
  background: #464646;
}
.sidebar .sidebar-list {
  text-align: left;
}

.navbar.fixed-bottom {
  background: #242424;
  color: #3d3d3d;
  text-align: right;
}

nav {
  /*background-color: #f1f1f1;*/
  padding: 10px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

.container {
  text-align: center;
  background: #e0e0e0b2;
  border-radius: 10px;
  padding: 20px; /* Adicione um valor de espaçamento desejado */
}

/*.col > *:not(:last-child) {
    padding-right: 10px;
    padding-block: 10px;
}*/

.title_page {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
}

/* fade effect! */
.v-enter-active,
.v-leave-active {
  transition: opacity 1.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
