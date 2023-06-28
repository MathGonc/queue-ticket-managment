<template>
    <div class="monitor">
        <h2>Monitor de Senhas</h2>
        <h1>Senha Atual: {{ currentTicket }}</h1>
        <h3>Guichê: {{ currentTable }}</h3>

        <h4>Última Senha: {{ lastTicket }} - Guichê: {{ lastTable }}</h4>
    </div>
</template>

<script>
import { mapState } from "vuex";

import io from "socket.io-client";

export default {
    name: "monitor_page",
    data() {
        return {
            socket: null,
        };
    },
    mounted() {
        this.socket = io("http://localhost:3030");

        // Receba a atualização do currentTicket
        this.socket.on("updateCurrentTicket", () => {
            // Atualize a interface do usuário com a nova atualização
            this.updateMonitor();
        });

        this.$store.dispatch("fetchVariables");
        window.addEventListener("keydown", this.handleKeyPress);
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.handleKeyPress);
    },
    methods: {
        updateMonitor() {
            this.$store.dispatch("fetchVariables");
        },
        updatelastTicket() {
            this.lastTicket = this.currentTicket;
            this.lastTable = this.currentTable;
        },
        handleKeyPress(event) {
            if (event.key === "n" || event.key === "N") {
                this.callNextPassword();
            }
        },
        callNextPassword() {
            this.$store.dispatch("updateCurrentTicket");
            this.$store.dispatch("updateVariables");
            this.socket.emit("newUpdate", this.currentTicket);
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
