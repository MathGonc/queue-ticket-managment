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
              <!-- - e + ao lado do numero: troca de guiche sem digitar -->
              <div class="input-group counter-group">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  aria-label="Guichê anterior"
                  :disabled="Number(userTable) <= TABLE_MIN"
                  @click="stepTable(-1)"
                >
                  <Minus :size="18" class="icon" />
                </button>
                <input
                  id="counter"
                  v-model="userTable"
                  type="number"
                  class="form-control counter-input"
                  :min="TABLE_MIN"
                  :max="TABLE_MAX"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  aria-label="Próximo guichê"
                  :disabled="Number(userTable) >= TABLE_MAX"
                  @click="stepTable(1)"
                >
                  <Plus :size="18" class="icon" />
                </button>
              </div>

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

              <!-- Anotacoes da ultima senha chamada por este atendente -->
              <div v-if="calledTicket" class="called-notes mt-4">
                <div class="called-head">
                  Senha {{ calledTicket.number }} · {{ calledTicket.name }}
                </div>
                <label class="form-label" for="svc-note-sorting">Anotação da triagem</label>
                <textarea
                  id="svc-note-sorting"
                  class="form-control note-readonly mb-3"
                  rows="2"
                  :value="calledTicket.notaTriagem || 'Sem anotação'"
                  disabled
                ></textarea>
                <label class="form-label" for="svc-note-service">Anotação do atendimento</label>
                <textarea
                  id="svc-note-service"
                  v-model="noteService"
                  class="form-control mb-2"
                  rows="3"
                  maxlength="1000"
                ></textarea>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="savingNote || noteService.trim() === (calledTicket.notaAtendimento || '')"
                  @click="saveNote"
                >
                  Salvar anotação
                </button>
              </div>
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
import { loadTicketsInQueue, loadTicket, saveNotaAtendimento } from "../controllers/ticketController";
import { callTicket } from "@/utils/callTicket.js";
import topbar from "../components/topbar.vue";
import config from "@/config.js";
import { logClientEvent } from "@/controllers/activityController.js";
import { Bell, Minus, Plus } from "lucide-vue-next";

const transitionFade = ref(false);
const callByName = useLocalStorage("callByName", true);
const showAttendantName = useLocalStorage("showAttendantName", false);
const userTable = useLocalStorage("userTable", 0);
const userCalledTicket = useLocalStorage("userCalledTicket", null);
const buttonDisabled = ref(false);

const TABLE_MIN = 1;
const TABLE_MAX = 99;
// Soma/subtrai 1 sem sair de 1..99 (vazio ou 0 vira 1)
function stepTable(delta) {
  const current = Number(userTable.value) || 0;
  const next = current < TABLE_MIN ? TABLE_MIN : current + delta;
  userTable.value = Math.min(TABLE_MAX, Math.max(TABLE_MIN, next));
}

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

// Ultima senha chamada por este atendente: anotacoes da triagem e do atendimento
const calledTicket = ref(null);
const noteService = ref("");
const savingNote = ref(false);

async function loadCalledTicket() {
  if (!userCalledTicket.value) {
    calledTicket.value = null;
    return;
  }
  try {
    const response = await loadTicket(userCalledTicket.value);
    calledTicket.value = response.data.ticket[0] || null;
    noteService.value = calledTicket.value?.notaAtendimento || "";
  } catch {
    calledTicket.value = null;
  }
}
watch(userCalledTicket, loadCalledTicket);

async function saveNote() {
  if (!calledTicket.value) return;
  savingNote.value = true;
  try {
    await saveNotaAtendimento(calledTicket.value._id, noteService.value);
    calledTicket.value.notaAtendimento = noteService.value.trim();
    toast.success("Anotação salva");
  } catch {
    toast.error("Não foi possível salvar a anotação");
  } finally {
    savingNote.value = false;
  }
}

onMounted(() => {
  transitionFade.value = true;
  loadCalledTicket();
});
</script>

<style scoped>
.service-card {
  width: min(360px, 90vw);
}

.counter-group {
  width: 180px;
}

.called-notes {
  text-align: left;
}

.called-head {
  font-weight: 600;
  margin-bottom: 8px;
}

/* So leitura, mas com a cor normal do texto (o cinza do disabled apagava) */
.note-readonly:disabled {
  background: var(--qtm-surface);
  color: var(--qtm-text);
  opacity: 1;
  resize: none;
}

.counter-input {
  text-align: center;
  font-size: var(--qtm-fs-heading);
  font-weight: 600;
  /* sem as setinhas do navegador: os botoes - e + fazem esse papel */
  -moz-appearance: textfield;
  appearance: textfield;
}

.counter-input::-webkit-outer-spin-button,
.counter-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
