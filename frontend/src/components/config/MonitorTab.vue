<template>
  <div class="row justify-content-center g-3">
    <div class="col-12 col-md-auto">
      <div class="menu-default config-card">
        <h5>Painel (monitor)</h5>

        <div class="input-group input-group-sm mb-2">
          <span class="input-group-text">Idioma</span>
          <select v-model="displayLanguage" class="form-select" disabled>
            <option value="0">Português</option>
            <option value="1">English</option>
          </select>
        </div>

        <div class="input-group input-group-sm mb-3">
          <span class="input-group-text">Modo do monitor</span>
          <select v-model="monitorConfig.monitorMode" class="form-select" disabled>
            <option value="0">Horizontal</option>
            <option value="1">Vertical</option>
          </select>
        </div>

        <div class="text-start">
          <div class="form-check form-switch">
            <input id="cfg-show-number" v-model="monitorConfig.showTicketNumber" class="form-check-input" type="checkbox" :disabled="buttonDisabled" />
            <label class="form-check-label" for="cfg-show-number">Mostrar número da senha no painel</label>
          </div>
          <div class="form-check form-switch">
            <input id="cfg-sound" v-model="monitorConfig.soundNotification" class="form-check-input" type="checkbox" :disabled="buttonDisabled" />
            <label class="form-check-label" for="cfg-sound">Notificação ao chamar senha</label>
          </div>
          <div class="form-check form-switch">
            <input id="cfg-voice" v-model="monitorConfig.soundCallTicket" class="form-check-input" type="checkbox" :disabled="buttonDisabled" />
            <label class="form-check-label" for="cfg-voice">Voz ao chamar senha</label>
          </div>
        </div>

        <div v-if="monitorConfig.soundCallTicket" class="input-group input-group-sm mt-2">
          <span class="input-group-text">Tipo de voz</span>
          <select v-model="monitorConfig.soundCallTicketVoice" class="form-select" :disabled="buttonDisabled">
            <option v-for="value in 21" :key="value - 1" :value="value - 1">{{ value - 1 }}</option>
          </select>
        </div>

        <button type="button" class="btn btn-outline-primary mt-3" :disabled="buttonDisabled" @click="saveConfigs">
          Salvar
        </button>
      </div>
    </div>

    <div class="col-12 col-md-auto">
      <div class="menu-default config-card">
        <h5>Numeração</h5>
        <p class="small text-muted mb-3">Volta a numeração para a senha 1 e limpa as senhas exibidas no painel.</p>
        <button type="button" class="btn btn-outline-danger" :disabled="buttonDisabled" @click="handleResetGlobalTicketData">
          Resetar painel de senhas
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { toast } from "@/services/notify.js";
import { createSocket } from "@/socket.js";
import {
  loadMonitorConfigs,
  saveMonitorConfigs,
  resetGlobalTicketData,
} from "@/controllers/globalController.js";

const monitorConfig = ref({});
const displayLanguage = ref(0);
const buttonDisabled = ref(false);

function setButtonDisabled() {
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 10000);
}

function saveConfigs() {
  saveMonitorConfigs(monitorConfig.value)
    .then(() => {
      toast.success("Configurações salvas");
      createSocket().emit("signalUpdateMonitorConfigs");
      setButtonDisabled();
    })
    .catch(() => {
      toast.error("Erro ao salvar as configurações");
    });
}

async function handleResetGlobalTicketData() {
  if (buttonDisabled.value) return;
  if (!confirm("Zerar a numeração? A próxima senha volta a ser a 1.")) return;
  setButtonDisabled();
  const response = await resetGlobalTicketData();
  if (response.status !== 200) {
    return toast.error("Erro ao resetar as senhas");
  }
  createSocket().emit("signalUpdateValues");
  toast.success("Senhas resetadas");
}

onMounted(async () => {
  monitorConfig.value = await loadMonitorConfigs();
});
</script>
