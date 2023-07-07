<template>
  <div id="app">
    <router-view></router-view>
    <nav class="navbar fixed-bottom">
      <!--  <span class="col pt-auto px-3">Desenvolvido por Matheus Gonçalves</span>-->
    </nav>
  </div>
</template>

<script>
import { socket } from "./socket";

export default {
  name: "page_index",
  data() {
    return {};
  },
  async mounted() {
    this.transitionFade = true;
    await socket.connect();
    await this.$store.dispatch("getGlobalVariablesAPI");
    await socket.on("receiveUpdateGlobal", () => {
      this.$store.dispatch("getGlobalVariablesAPI");
    });
  },
  methods: {},
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

.navbar {
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
