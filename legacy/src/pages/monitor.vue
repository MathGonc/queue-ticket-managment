<template>
  <div class="monitor">
    <topbar></topbar>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container menu-default">
          <Transition name="bounce">
            <div v-if="transitionNewTicket">
              <span
                v-if="ticketGlobalData.currentNumber"
                class="current-ticket"
              >
                <vue-feather
                  type="user"
                  size="100"
                  class="icon"
                  stroke-width="1"
                />
                <div class="row">
                  <span class="number">
                    Senha atual:
                    <span v-if="monitorConfig.showTicketNumber == true">
                      {{ ticketGlobalData.currentNumber }}
                    </span>
                  </span>
                </div>
                <div class="row">
                  <span class="name">{{ ticketGlobalData.currentUser }} </span>
                </div>
                <div class="row">
                  <span class="table"
                    >(Guichê: {{ ticketGlobalData.currentTable
                    }}<span
                      v-if="ticketGlobalData.currentShowAttendant == true"
                      class="nameAttendant"
                    >
                      - Atendente:
                      {{ ticketGlobalData.currentServicedBy }}</span
                    >)
                  </span>
                </div>
              </span>
            </div>
          </Transition>
        </div>

        <br />

        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-sm-auto menu-default">
              <span v-if="ticketGlobalData.lastNumber" class="last-ticket">
                <vue-feather type="users" size="48" class="icon" />
                <div class="number">
                  Última Senha:
                  <span v-if="monitorConfig.showTicketNumber == true">
                    {{ ticketGlobalData.lastNumber }}
                  </span>
                </div>
                <span class="name">
                  {{ ticketGlobalData.lastUser }}
                </span>
                (Guichê {{ ticketGlobalData.lastTable
                }}<span
                  v-if="ticketGlobalData.lastShowAttendant == true"
                  class="nameAttendant"
                >
                  - Atendente:
                  {{ ticketGlobalData.lastServicedBy }} </span
                >)
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
import {
  loadMonitorConfigs,
  getGlobalTicketData,
} from "../controllers/globalController.js";
import VueFeather from "vue-feather";
import topbar from "../components/topbar";

export default {
  name: "page_monitor",
  components: {
    "vue-feather": VueFeather,
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
        currentShowAttendant: false,
        currentServicedBy: "",
        lastNumber: -1,
        lastTable: -1,
        lastUser: "",
        lastShowAttendant: false,
        lastServicedBy: "",
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

    socket.on("receiveUpdateMonitor", (callByName) => {
      console.log("🚀 ~ socket.on ~ callByName:", callByName);
      getGlobalTicketData().then((response) => {
        this.ticketGlobalData = response.data.ticket;
        console.log(
          "🚀 ~ getGlobalTicketData ~ this.ticketGlobalData:",
          this.ticketGlobalData
        );

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
            callByName
              ? (message.text =
                  this.ticketGlobalData.currentUser +
                  ", dirija-se ao guichê " +
                  this.ticketGlobalData.currentTable)
              : (message.text =
                  "Senha numero " +
                  this.ticketGlobalData.currentNumber +
                  ", dirija-se ao guichê " +
                  this.ticketGlobalData.currentTable);

            message.voice =
              speechSynthesis.getVoices()[
                this.monitorConfig.soundCallTicketVoice
              ];
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
.monitor {
  text-align: center;
  line-height: 1;
}
.monitor .current-ticket .name {
  font-size: 72px;
  font-weight: bold;
}

.monitor .current-ticket .number {
  font-size: 100px;
}

.monitor .current-ticket .table {
  font-size: 72px;
}

.monitor .last-ticket {
  font-size: 48px;
}

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
