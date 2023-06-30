<template>
    <div class="monitor">
        <h2>Monitor de Senhas</h2>
        <h1>Senha Atual: {{ currentTicket }}</h1>
        <h3>Guichê: {{ currentTable }}</h3>

        <h4>Última Senha: {{ lastTicket }} (Guichê: {{ lastTable }})</h4>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "page_monitor",
    data() {
        return {};
    },
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("updatedGlobalCurrentTicket", () => {
            const audio = new Audio(require("@/assets/sound.wav"));
            audio.play();
            this.$store.dispatch("getVariablesAPI");
        });
    },
    methods: {},
    computed: {
        ...mapState([
            "currentTicket",
            "currentTable",
            "lastTicket",
            "lastTable",
        ]),
    },
};
</script>

<style scoped>
.monitor {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
