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
                  <span v-if="currentTicket != -1">
                    <h1 style="font-size: 72px">
                      <b>Senha: {{ currentTicket }} (Guichê {{ currentTable }})</b>
                    </h1></span
                  >
                </p>
              </Transition>
              <br />
              <span v-if="lastTicket != -1">
                <h3>Última Senha: {{ lastTicket }} (Guichê {{ lastTable }})</h3>
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { computed } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import topbar from "../components/topbar";
import { useGlobalStore } from "@/stores/global";

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
  setup() {
    const globalStore = useGlobalStore();
    const soundNotification = computed(() => globalStore.soundNotification);
    const soundCallTicket = computed(() => globalStore.soundCallTicket);
    const soundCallTicketVoice = computed(() => globalStore.soundCallTicketVoice);
    const currentTicket = computed(() => globalStore.currentTicket);
    const currentTable = computed(() => globalStore.currentTable);
    const currentUser = computed(() => globalStore.currentUser);
    const lastTicket = computed(() => globalStore.lastTicket);
    const lastTable = computed(() => globalStore.lastTable);
    return {
      globalStore,
      soundCallTicket,
      soundNotification,
      soundCallTicketVoice,
      currentTicket,
      currentTable,
      currentUser,
      lastTicket,
      lastTable,
    };
  },
  async mounted() {
    this.transitionFade = true;
    this.transitionNewTicket = true;

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
  async beforeUnmount() {
    socket.off("receiveUpdateMonitor", this.handleReceiveUpdateMonitor);
  },
  methods: {},
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
