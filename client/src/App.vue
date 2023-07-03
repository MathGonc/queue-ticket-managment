<template>
    <div id="app">
        <topbar></topbar>
        <router-view></router-view>
    </div>
</template>

<script>
import topbar from "@/components/topbar.vue";
import io from "socket.io-client";
import config from "../config.js";

export default {
    name: "IndexPage",
    components: {
        topbar,
    },
    data() {
        return {
            showAlert: false,
            stringAlert: "-",
        };
    },
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("receiveUpdateGlobal", () => {
            this.$store.dispatch("getGlobalVariablesAPI");
        });
        this.transitionFade = true;
        this.$store.dispatch("getGlobalVariablesAPI");
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

nav {
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
    background: #bdbdbdb2;
    border-radius: 10px;
    padding: 20px; /* Adicione um valor de espaçamento desejado */
}

.col > *:not(:last-child) {
    padding-right: 10px; /* Espaço horizontal desejado entre elementos dentro de container*/
    padding-block: 10px;
}

.title_page {
    text-align: center;
    font-size: 32px;
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
