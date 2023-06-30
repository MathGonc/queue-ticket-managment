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
