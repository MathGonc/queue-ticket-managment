<template>
  <div class="sorting">
    <topbar></topbar>
    <span class="title_page">Painel de triagem</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <form @submit.prevent="handleRegisterTicket()">
                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text"
                    >*Nome:</span
                  >
                  <input
                    type="text"
                    class="form-control"
                    maxlength="50"
                    v-model="inputTicket.name"
                  />
                </div>

                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text"
                    >CPF:</span
                  >
                  <input
                    type="text"
                    class="form-control"
                    maxlength="18"
                    v-maska
                    v-model="inputTicket.docNumber.masked"
                    data-maska="###.###.###-##"
                  />
                </div>
                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text"
                    >Nasc.:</span
                  >
                  <div class="col-auto DatePicker">
                    <VueDatePicker
                      v-model="assistedAge"
                      :dark="isDark"
                      :text-input="{ format: DATE_FORMAT }"
                      :locale="ptBR"
                      :formats="{ input: DATE_FORMAT, weekDay: WEEKDAY_FORMAT }"
                      :action-row="{ selectBtnLabel: 'Selecionar', cancelBtnLabel: 'Cancelar' }"
                    />
                  </div>
                </div>

                <div class="input-group input-group-sm mb-3">
                  <button
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Tipo:
                  </button>
                  <ul class="dropdown-menu">
                    <li v-for="item in dropdownTicketTypes" :key="item.name">
                      <a
                        class="dropdown-item"
                        href="#"
                        @click="inputTicket.type = item.name"
                        >{{ item.name }}</a
                      >
                    </li>
                  </ul>
                  <input
                    type="text"
                    class="form-control"
                    maxlength="50"
                    aria-label="Text input with dropdown button"
                    v-model="inputTicket.type"
                  />
                </div>

                <div class="form-check form-switch">
                  <label class="form-check-label" for="sort-preferential">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="sort-preferential"
                      v-model="preferentialBool"
                      :disabled="calculateAge(assistedAge) >= 60"
                    />
                    Preferencial</label
                  >
                  <!-- Ordem de preferencia: 80+ >>> Preferencial (gravidas, 60+, crianças de colo, etc...) >>>> Sem preferencia -->
                   <!-- Dentro desses 3, ordenar por ordem de chegada -->
                </div>
                <button
                  type="submit"
                  class="btn btn-outline-primary"
                  :disabled="buttonDisabled"
                >
                  Cadastrar Senha {{ ticketGlobalData.nextToQueue }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from "vue";
import { toast } from "@/services/notify.js";
import { publicSocket, createSocket } from "@/socket.js";
import { insertTicket } from "@/controllers/ticketController.js";
import {
  getGlobalTicketData,
  updateGlobalTicketData,
} from "@/controllers/globalController.js";
import { vMaska } from "maska/vue";
import { useAuth } from "@/stores/auth.js";
import { calculateAge, onlyDigits } from "@/utils/index.js";
import topbar from "@/components/topbar.vue";
import config from "@/config.js";

import { VueDatePicker } from "@vuepic/vue-datepicker";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/composables/useTheme.js";
import "@vuepic/vue-datepicker/dist/main.css";

// Formato das datas no seletor (exibicao e digitacao)
const DATE_FORMAT = "dd/MM/yyyy";
// Dias da semana com 1 letra (D S T Q Q S S), como nos calendarios brasileiros
const WEEKDAY_FORMAT = "EEEEE";
const { isDark } = useTheme();

defineOptions({
  name: "page_sorting",
});

const auth = useAuth();

// Reactive state
const transitionFade = ref(false);
const buttonDisabled = ref(false);
const preferentialBool = ref(false);
const assistedAge = ref(null);
const ticketGlobalData = ref({});

const inputTicket = reactive({
  name: "",
  // maska 3 nao preenche mais um objeto { masked, unmasked } via v-maska="obj";
  // o valor mascarado vem do v-model e os digitos sao extraidos no envio.
  docNumber: {
    masked: "",
  },
  type: "",
  preferential: 0,
});

const dropdownTicketTypes = [
  { name: "INICIAL" },
  { name: "AGENDAMENTO" },
  { name: "RETORNO" },
  { name: "INFORMAÇÕES" },
  { name: "JUNTADA DE DOCUMENTOS" },
];

// Watchers
watch(preferentialBool, (newValue) => {
  if (newValue) {
    updatePreferentialAge();
  }
});

watch(assistedAge, (newValue) => {
  if (newValue) {
    updatePreferentialAge();
  }
});

// Methods
function updatePreferentialAge() {
  if (calculateAge(assistedAge.value) >= 80) {
    inputTicket.preferential = 2;
    preferentialBool.value = true;
  } else if (calculateAge(assistedAge.value) >= 60) {
    inputTicket.preferential = 1;
    preferentialBool.value = true;
  } else if (preferentialBool.value === true) {
    inputTicket.preferential = 1;
  } else if (preferentialBool.value === false) {
    inputTicket.preferential = 0;
  }
}

function setButtonDisabled() {
  if (config.dev == 1) return 0;
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 5000);
  return 1;
}

async function handleGetGlobalTicketData() {
  const response = await getGlobalTicketData();
  ticketGlobalData.value = response.data.ticket;
}

async function handleRegisterTicket() {
  if (inputTicket.name.length < 1) return toast.error("Digite um nome");

  if (buttonDisabled.value) return;
  setButtonDisabled();

  await handleGetGlobalTicketData();

  const insertResponse = await insertTicket({
    number: ticketGlobalData.value.nextToQueue,
    status: 1,
    type: inputTicket.type,
    queuedBy: auth.userData.username,
    preferential: inputTicket.preferential,
    name: inputTicket.name,
    docNumber: onlyDigits(inputTicket.docNumber.masked),
    dateQueue: Date.now(),
    assistedAge: assistedAge.value,
  });

  if (insertResponse.status != 200)
    return toast.error("Ocorreu um erro ao cadastrar a senha");
  toast.success("Usuario cadastrado com sucesso");

  // Reset form
  inputTicket.name = "";
  inputTicket.docNumber.masked = "";
  inputTicket.type = "";
  inputTicket.preferential = 0;

  // Update global next number
  ticketGlobalData.value.nextToQueue += 1;
  const updateResponse = await updateGlobalTicketData({
    ticket: ticketGlobalData.value,
  });
  if (updateResponse.status != 200)
    return toast.error("Ocorreu um erro ao atualizar a lista");
  createSocket().emit("signalUpdateValues");
}

// Lifecycle
onMounted(async () => {
  transitionFade.value = true;
  await handleGetGlobalTicketData();
  // Create authenticated socket for control events
  if (auth.token) {
    createSocket();
  }
  publicSocket.on("receiveUpdateGlobal", handleGetGlobalTicketData);
});

// Sem isso, cada visita a triagem somava mais um listener
onBeforeUnmount(() => {
  publicSocket.off("receiveUpdateGlobal", handleGetGlobalTicketData);
});
</script>

<style scoped></style>
