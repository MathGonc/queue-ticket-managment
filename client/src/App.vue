<template>
    <div id="app">
        <topbar></topbar>
        <router-view></router-view>
    </div>
</template>

<script>
import topbar from "@/components/topbar.vue";

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
        this.$store.dispatch("getVariablesAPI");
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
    background-image: repeating-radial-gradient(
            circle at 0 0,
            transparent 0,
            #ffffff 10px
        ),
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
    padding: 30px;
}

nav a {
    font-weight: bold;
    color: #2c3e50;
}

nav a.router-link-exact-active {
    color: #42b983;
}
.container > *:not(:last-child) {
    padding-right: 10px; /* Espaço horizontal desejado */
}
</style>
