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
    name: "monitor_page",
    data() {
        return {};
    },
    mounted() {
        this.socket = io(config.url_server);

        // Receba a atualização do currentTicket
        this.socket.on("updateCurrentTicket", () => {
            // Atualize a interface do usuário com a nova atualização
            this.updateMonitor();
        });

        this.$store.dispatch("getVariablesAPI");
    },
    methods: {
        updateMonitor() {
            //const audio = new Audio(require("@/assets/sound.wav"));
            //audio.play();
            this.$store.dispatch("getVariablesAPI");
        },
    },
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
