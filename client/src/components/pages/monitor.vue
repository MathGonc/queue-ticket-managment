<template>
    <div class="monitor">
        <topbar></topbar>
        <transition-group>
            <div v-if="transitionFade">
                <div class="container">
                    <div class="row">
                        <div class="col">
                            <Transition name="bounce">
                                <p v-if="transitionNewTicket" style="text-align: center">
                                    <b>
                                        <span v-if="currentTicket >= 0">
                                            <h1>
                                                <b
                                                    >Senha: {{ currentTicket }} (Guichê:
                                                    {{ currentTable }})
                                                </b>
                                            </h1></span
                                        >
                                    </b>
                                </p>
                            </Transition>
                            <br />
                            <span v-if="currentTicket >= 1">
                                <h4>Última Senha: {{ lastTicket }} (Guichê: {{ lastTable }})</h4>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>
    </div>
</template>

<script>
import { mapState } from "vuex";
import { useToast } from "vue-toastification";
import io from "socket.io-client";
import config from "../../../config.js";
import topbar from "../topbar";

export default {
    name: "page_monitor",
    components: {
        topbar,
    },
    data() {
        return {
            transitionFade: true,
            transitionNewTicket: false,
        };
    },
    mounted() {
        this.transitionFade = true;
        this.transitionNewTicket = true;
        this.socket = io(config.url_server);
        this.socket.on("receiveUpdateGlobal", () => {
            this.$store.dispatch("getGlobalVariablesAPI");
        });

        this.socket.on("receiveUpdateMonitor", (newTicket) => {
            useToast().info("Nova senha!", { position: "bottom-center" });
            this.transitionNewTicket = false;
            setTimeout(() => (this.transitionNewTicket = true), 1000);
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
                        console.log("o navegador não suporta a API Web Speech.");
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
.bounce-enter-active {
    animation: bounce-in 0.5s;
}
.bounce-leave-active {
    animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
    0% {
        transform: scale(0);
    }
    50% {
        transform: scale(1.25);
    }
    100% {
        transform: scale(1);
    }
}
</style>
