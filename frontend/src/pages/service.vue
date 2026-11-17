<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default service-card">
              <label class="form-label" for="counter">Guichê</label>
              <input
                id="counter"
                v-model="userTable"
                type="number"
                class="form-control counter-input"
                min="1"
                max="99"
              />

              <div class="form-check form-switch mt-3">
                <input id="svc-call-by-name" v-model="callByName" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="svc-call-by-name">Chamar pelo nome</label>
              </div>
              <div class="form-check form-switch">
                <input id="svc-show-attendant" v-model="showAttendantName" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="svc-show-attendant">Exibir nome do(a) atendente</label>
              </div>

              <!-- A acao do dia: botao cheio e largo; o resto fica em contorno -->
              <button
                type="button"
                class="btn btn-primary btn-lg w-100 mt-3"
                :disabled="buttonDisabled"
                @click="callNextTicket"
              >
                <Bell :size="20" class="icon" /> Chamar próxima senha
              </button>
              <button
                v-if="userCalledTicket"
                type="button"
                class="btn btn-outline-primary w-100 mt-2"
                :disabled="buttonDisabled || !userCalledTicket"
                @click="callSameTicket"
              >
                Chamar a última senha de novo
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { toast } from "@/services/notify.js";
import { useLocalStorage } from "@vueuse/core";
import { loadTicketsInQueue } from "../controllers/ticketController";
import { callTicket } from "@/utils/callTicket.js";
import topbar from "../components/topbar.vue";
import config from "@/config.js";
import { logClientEvent } from "@/controllers/activityController.js";
import { Bell } from "lucide-vue-next";

const transitionFade = ref(false);
const callByName = useLocalStorage("callByName", true);
const showAttendantName = useLocalStorage("showAttendantName", false);
const userTable = useLocalStorage("userTable", 0);
const userCalledTicket = useLocalStorage("userCalledTicket", null);
const buttonDisabled = ref(false);

// Troca de guiche vai para o registro de atividades. Espera o atendente
// terminar de digitar ("1" e depois "12") e so registra valores validos.
let loggedTable = Number(userTable.value) || null;
let tableTimer = null;
function commitTable() {
  clearTimeout(tableTimer);
  tableTimer = null;
  const table = Number(userTable.value);
  if (!(table >= 1 && table <= 99) || table === loggedTable) return;
  logClientEvent("guiche_alterado", { de: loggedTable, para: table });
  loggedTable = table;
}
watch(userTable, () => {
  clearTimeout(tableTimer);
  tableTimer = setTimeout(commitTable, 2000);
});
// Saiu da tela antes dos 2 s: registra na hora
onBeforeUnmount(() => {
  if (tableTimer) commitTable();
});

function setButtonDisabled() {
  if (config.dev == 1) return 0;
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 5000);
  return 1;
}

async function callNextTicket() {
  if (buttonDisabled.value) return;
  setButtonDisabled();

  const loadResponse = await loadTicketsInQueue();
  if (loadResponse.data.ticket.length < 1)
    return toast.error("Nenhuma senha cadastrada");

  if (loadResponse.data.ticket[0].status == 2)
    return toast.error("Todas as senhas já foram atendidas");

  await callTicket(loadResponse.data.ticket[0]._id);
}

async function callSameTicket() {
  if (buttonDisabled.value) return;
  setButtonDisabled();
  if (!userCalledTicket.value)
    return toast.error("Você não chamou nenhum ticket recentemente");
  await callTicket(userCalledTicket.value);
}

onMounted(() => {
  transitionFade.value = true;
});
</script>

<style scoped>
.service-card {
  width: min(360px, 90vw);
}

.counter-input {
  max-width: 120px;
  font-size: var(--qtm-fs-heading);
  font-weight: 600;
}
</style>
