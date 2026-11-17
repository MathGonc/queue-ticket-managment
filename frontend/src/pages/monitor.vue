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
                <User
                  :size="100"
                  class="icon"
                  :stroke-width="1"
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
                <Users :size="48" class="icon" />
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

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { toast } from "@/services/notify.js";
import { publicSocket } from "@/socket.js";
import { useAuth } from "@/stores/auth.js";
import {
  loadMonitorConfigs,
  getGlobalTicketData,
} from "../controllers/globalController.js";
import { User, Users } from "lucide-vue-next";
import topbar from "../components/topbar.vue";
import soundFile from "@/assets/sound.wav";


const transitionFade = ref(true);
const transitionNewTicket = ref(false);
const monitorConfig = ref({});

const ticketGlobalData = ref({
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
});

async function fetchMonitorConfigs() {
  const response = await loadMonitorConfigs();
  monitorConfig.value = response;
}

function handleReceiveUpdateMonitorConfigs() {
  fetchMonitorConfigs();
}

function handleReceiveUpdateMonitor(callByName) {
  console.log("🚀 ~ socket.on ~ callByName:", callByName);
  getGlobalTicketData().then((response) => {
    ticketGlobalData.value = response.data.ticket;
    console.log(
      "🚀 ~ getGlobalTicketData ~ ticketGlobalData:",
      ticketGlobalData.value
    );

    toast.info("Nova senha!", { position: "bottom-center" });
    transitionNewTicket.value = false;

    setTimeout(() => (transitionNewTicket.value = true), 1000);
    if (monitorConfig.value.soundNotification == true) {
      const audio = new Audio(soundFile);
      audio.play();
    }

    setTimeout(() => {
      if (monitorConfig.value.soundCallTicket == true) {
        if (!("speechSynthesis" in window))
          return console.log("o navegador não suporta a API Web Speech.");
        speechSynthesis.cancel();
        var message = new SpeechSynthesisUtterance();
        callByName
          ? (message.text =
              ticketGlobalData.value.currentUser +
              ", dirija-se ao guichê " +
              ticketGlobalData.value.currentTable)
          : (message.text =
              "Senha numero " +
              ticketGlobalData.value.currentNumber +
              ", dirija-se ao guichê " +
              ticketGlobalData.value.currentTable);

        message.voice =
          speechSynthesis.getVoices()[
            monitorConfig.value.soundCallTicketVoice
          ];
        speechSynthesis.speak(message);
      }
    }, 1000);
  });
}

const auth = useAuth();

function announcePanel() {
  publicSocket.emit("painelOnline", { usuario: auth.userData?.username || "" });
}

onMounted(async () => {
  transitionFade.value = true;
  transitionNewTicket.value = true;

  await fetchMonitorConfigs();

  const responseTicketData = await getGlobalTicketData();
  ticketGlobalData.value = responseTicketData.data.ticket;

  publicSocket.on("receiveUpdateMonitorConfigs", handleReceiveUpdateMonitorConfigs);
  publicSocket.on("receiveUpdateMonitor", handleReceiveUpdateMonitor);

  // Presenca do painel no registro de atividades (avisa de novo ao reconectar)
  announcePanel();
  publicSocket.on("connect", announcePanel);
});

onBeforeUnmount(() => {
  publicSocket.off("receiveUpdateMonitorConfigs", handleReceiveUpdateMonitorConfigs);
  publicSocket.off("receiveUpdateMonitor", handleReceiveUpdateMonitor);
  publicSocket.off("connect", announcePanel);
  publicSocket.emit("painelOffline");
});
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
