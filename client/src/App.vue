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
    mounted() {
        this.$store.dispatch("getVariablesAPI");
    },
    // Outras configurações e métodos da página
};
</script>

<style>
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
</style>
