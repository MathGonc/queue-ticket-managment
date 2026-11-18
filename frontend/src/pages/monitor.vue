<template>
  <div class="monitor">
    <topbar large></topbar>
    <transition-group>
      <div v-if="transitionFade">
        <!-- Senha chamada agora: o nome e o guiche sao o que se le de longe -->
        <section class="container menu-default call-card" aria-live="polite">
          <Transition name="bounce">
            <div v-if="transitionNewTicket">
              <div v-if="hasCurrent" class="current-ticket">
                <div class="call-label">Senha chamada</div>
                <div v-if="monitorConfig.showTicketNumber == true" class="call-number">
                  {{ ticketGlobalData.currentNumber }}
                </div>
                <div class="call-name">{{ ticketGlobalData.currentUser }}</div>
                <div class="call-table">Guichê {{ ticketGlobalData.currentTable }}</div>
                <div v-if="ticketGlobalData.currentShowAttendant == true" class="call-attendant">
                  Atendente: {{ ticketGlobalData.currentServicedBy }}
                </div>
              </div>
              <div v-else class="call-waiting">Aguardando a primeira chamada</div>
            </div>
          </Transition>
        </section>

        <section v-if="hasLast" class="container menu-default last-card">
          <div class="call-label">Senha anterior</div>
          <div class="last-line">
            <span v-if="monitorConfig.showTicketNumber == true" class="last-number">{{ ticketGlobalData.lastNumber }}</span>
            <span class="last-name">{{ ticketGlobalData.lastUser }}</span>
            <span class="last-table">Guichê {{ ticketGlobalData.lastTable }}</span>
          </div>
          <div v-if="ticketGlobalData.lastShowAttendant == true" class="call-attendant">
            Atendente: {{ ticketGlobalData.lastServicedBy }}
          </div>
        </section>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { toast } from "@/services/notify.js";
import { publicSocket } from "@/socket.js";
import { useAuth } from "@/stores/auth.js";
import {
  loadMonitorConfigs,
  getGlobalTicketData,
} from "../controllers/globalController.js";
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

// -1 = ninguem chamado ainda (banco novo ou numeracao zerada)
const hasCurrent = computed(() => Number(ticketGlobalData.value.currentNumber) > 0);
const hasLast = computed(() => Number(ticketGlobalData.value.lastNumber) > 0);

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
/* Painel da TV: lido de longe por quem espera. Tamanhos acompanham a tela. */
.monitor {
  text-align: center;
  line-height: 1.1;
  /* Tudo em maiusculas, como os nomes no cadastro */
  text-transform: uppercase;
}

.monitor .menu-default {
  text-align: center;
}

.call-card {
  padding: clamp(16px, 3vw, 48px);
}

.call-label {
  color: var(--qtm-text-muted);
  font-size: clamp(20px, 2.2vw, 36px);
  font-weight: 600;
}

.call-number {
  margin-top: 8px;
  font-size: clamp(72px, 10vw, 180px);
  font-weight: 700;
  line-height: 1;
}

.call-name {
  margin-top: 12px;
  font-size: clamp(44px, 6vw, 112px);
  font-weight: 700;
  overflow-wrap: anywhere;
}

/* Para onde ir: a unica cor de destaque do painel */
.call-table {
  margin-top: 16px;
  color: var(--qtm-primary);
  font-size: clamp(40px, 5vw, 96px);
  font-weight: 700;
}

.call-attendant {
  margin-top: 12px;
  color: var(--qtm-text-muted);
  font-size: clamp(20px, 2.4vw, 40px);
}

.call-waiting {
  padding: clamp(24px, 6vw, 96px) 0;
  color: var(--qtm-text-muted);
  font-size: clamp(32px, 4vw, 64px);
  font-weight: 600;
}

.last-card {
  margin-top: 24px;
  padding: clamp(12px, 2vw, 28px);
  max-width: 1100px;
}

.last-line {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 0 0.8em;
  margin-top: 6px;
  font-size: clamp(28px, 3.4vw, 56px);
}

.last-number,
.last-name {
  font-weight: 700;
}

.last-table {
  color: var(--qtm-primary);
  font-weight: 700;
}

/* Nova chamada: o unico movimento da tela, para puxar o olhar */
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

@media (prefers-reduced-motion: reduce) {
  .bounce-enter-active,
  .bounce-leave-active {
    animation: none;
  }
}
</style>
