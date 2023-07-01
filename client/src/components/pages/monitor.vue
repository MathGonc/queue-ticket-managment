<template>
    <div class="monitor">
        <div class="container">
            <h1>Senha: {{ currentTicket }} (Guichê: {{ currentTable }})</h1>
        </div>
        <br />
        <div class="container">
            <h4>Última Senha: {{ lastTicket }} (Guichê: {{ lastTable }})</h4>
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import { useToast } from "vue-toastification";
import io from "socket.io-client";
import config from "../../../config.js";

export default {
    name: "page_monitor",
    data() {
        return {};
    },
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("receiveUpdateGlobal", () => {
            this.$store.dispatch("getVariablesAPI");
        });
        this.socket.on("receiveUpdateMonitor", (newTicket) => {
            useToast().info("Nova senha!", { position: "bottom-center" });
            if (this.soundNotification == true) {
                const audio = new Audio(require("@/assets/sound.wav"));
                audio.play();
            }
            setTimeout(() => {
                if (this.soundCallTicket == true) {
                    if ("speechSynthesis" in window) {
                        speechSynthesis.cancel(); // Encerra todas as falas em andamento
                        var message = new SpeechSynthesisUtterance();
                        message.text =
                            "Senha numero " +
                            this.currentTicket +
                            ", dirija-se ao guichê " +
                            this.currentTable;
                        console.log(newTicket);
                        var voices = speechSynthesis.getVoices();
                        message.voice = voices[this.soundCallTicketVoice];
                        speechSynthesis.speak(message);
                    } else {
                        console.log(
                            "o navegador não suporta a API Web Speech."
                        );
                    }
                }
            }, 1000);
        });
    },
    methods: {},
    computed: {
        ...mapState([
            "soundNotification",
            "soundCallTicket",
            "soundCallTicketVoice",
            "currentTicket",
            "currentTable",
            "currentUser",
            "lastTicket",
            "lastTable",
            "lastUser",
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
