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
                  <span v-if="ticketGlobalData.currentNumber">
                    <h1 style="font-size: 48px">
                      <b>
                        Senha: {{ ticketGlobalData.currentNumber }}
                        <br />
                        {{ ticketGlobalData.currentUser }}
                        <br />
                        (Guichê {{ ticketGlobalData.currentTable }})
                      </b>
                    </h1></span
                  >
                </p>
              </Transition>
              <span v-if="ticketGlobalData.lastNumber">
                <h3>
                  Última Senha: {{ ticketGlobalData.lastNumber }} -
                  {{ ticketGlobalData.lastUser }} (Guichê {{ ticketGlobalData.lastTable }})
                </h3>
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
// import { computed } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { loadMonitorConfigs, getGlobalTicketData } from "../controllers/globalController";

import topbar from "../components/topbar";

export default {
  name: "page_monitor",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: true,
      transitionNewTicket: false,
      monitorConfig: {},

      ticketGlobalData: {
        nextToQueue: -1,
        currentNumber: -1,
        currentTable: -1,
        currentUser: "",
        lastNumber: -1,
        lastTable: -1,
        lastUser: "",
      },
    };
  },
  async mounted() {
    this.transitionFade = true;
    this.transitionNewTicket = true;

    await this.fetchMonitorConfigs();

    await getGlobalTicketData().then((responseTicketData) => {
      this.ticketGlobalData = responseTicketData.data.ticket;
    });

    socket.on("receiveUpdateMonitorConfigs", () => {
      this.fetchMonitorConfigs();
    });

    socket.on("receiveUpdateMonitor", (callTicketByName) => {
      getGlobalTicketData().then((response) => {
        this.ticketGlobalData = response.data.ticket;

        useToast().info("Nova senha!", { position: "bottom-center" });
        this.transitionNewTicket = false;

        setTimeout(() => (this.transitionNewTicket = true), 1000);
        if (this.monitorConfig.soundNotification == true) {
          const audio = new Audio(require("@/assets/sound.wav"));
          audio.play();
        }

        setTimeout(() => {
          if (this.monitorConfig.soundCallTicket == true) {
            if (!("speechSynthesis" in window))
              return console.log("o navegador não suporta a API Web Speech.");
            speechSynthesis.cancel(); // Encerra todas as falas em andamento
            var message = new SpeechSynthesisUtterance();
            callTicketByName
              ? (message.text =
                  this.ticketGlobalData.currentUser +
                  ", dirija-se ao guichê " +
                  this.ticketGlobalData.currentTable)
              : (message.text =
                  "Senha numero " +
                  this.ticketGlobalData.currentNumber +
                  ", dirija-se ao guichê " +
                  this.ticketGlobalData.currentTable);

            message.voice = speechSynthesis.getVoices()[this.monitorConfig.soundCallTicketVoice];
            speechSynthesis.speak(message);
          }
        }, 1000);
      });
    });
  },
  async beforeUnmount() {
    socket.off("receiveUpdateMonitor", this.handleReceiveUpdateMonitor);
  },
  methods: {
    async fetchMonitorConfigs() {
      await loadMonitorConfigs().then((response) => {
        this.monitorConfig = response;
      });
    },
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
