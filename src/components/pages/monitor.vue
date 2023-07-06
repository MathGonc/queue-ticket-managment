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
                    <span v-if="currentTicket != -1">
                      <h1>
                        <b>Senha: {{ currentTicket }} (Guichê: {{ currentTable }}) </b>
                      </h1></span
                    >
                  </b>
                </p>
              </Transition>
              <br />
              <span v-if="lastTicket != -1">
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
import { socket } from "@/socket";
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
  async mounted() {
    socket.connect();
    this.transitionFade = true;
    this.transitionNewTicket = true;

    await socket.on("receiveUpdateGlobal", () => {
      this.$store.dispatch("getGlobalVariablesAPI");
    });

    await socket.on("receiveUpdateMonitor", (newTicket) => {
      useToast().info("Nova senha!", { position: "bottom-center" });
      this.transitionNewTicket = false;

      setTimeout(() => (this.transitionNewTicket = true), 1000);
      if (this.soundNotification == true) {
        const audio = new Audio(require("@/assets/sound.wav"));
        audio.play();
      }

      setTimeout(() => {
        if (this.soundCallTicket == true) {
          if (!("speechSynthesis" in window))
            return console.log("o navegador não suporta a API Web Speech.");
          speechSynthesis.cancel(); // Encerra todas as falas em andamento
          var message = new SpeechSynthesisUtterance();
          message.text =
            "Senha numero " + this.currentTicket + ", dirija-se ao guichê " + this.currentTable;
          console.log(newTicket);
          console.log(this.currentTicket);
          message.voice = speechSynthesis.getVoices()[this.soundCallTicketVoice];
          speechSynthesis.speak(message);
        }
      }, 1000);
    });
  },
  unmounted() {
    socket.disconnect();
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
