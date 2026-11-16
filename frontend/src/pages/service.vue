<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <!-- <h5 v-if="globalTicketData.currentNumber != -1">
                Senha atual: {{ globalTicketData.currentNumber }} ({{
                  globalTicketData.currentUser
                }}) (Guichê: {{ globalTicketData.currentTable }})
              </h5>
              <br /> -->
              <div class="input-group mb-1 justify-content-center">
                <span class="input-group-text" id="basic-addon1">Guichê:</span
                ><input
                  type="number"
                  id="counter"
                  min="01"
                  max="99"
                  maxlength="2"
                  v-model="userTable"
                />
              </div>
              <div class="form-check form-switch py-2">
                <label class="form-check-label" for="flexSwitchCheckDefault">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="callByName"
                  />Chamar pelo nome</label
                >
              </div>
              <div class="form-check form-switch py-2">
                <label class="form-check-label" for="flexSwitchCheckDefault">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="showAttendantName"
                  />Exibir nome do(a) atendente</label
                >
              </div>
              <span class="px-1"
                ><button
                  type="button"
                  @click="callNextTicket"
                  :disabled="buttonDisabled"
                  class="btn btn-outline-primary"
                >
                  Chamar Próxima Senha
                </button></span
              >

              <span class="px-1" v-if="userCalledTicket"
                ><button
                  type="button"
                  @click="callSameTicket"
                  :disabled="buttonDisabled || !userCalledTicket"
                  class="btn btn-outline-primary"
                >
                  Chamar ultima senha novamente
                </button></span
              >
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useLocalStorage } from "@vueuse/core";
import { loadTicketsInQueue } from "../controllers/ticketController";
import { callTicket } from "../utils";
import { useAuth } from "@/stores/auth.js";
import topbar from "../components/topbar.vue";
import config from "@/config.js";

const auth = useAuth();
const toast = useToast();

const transitionFade = ref(false);
const callByName = useLocalStorage("callByName", true);
const showAttendantName = useLocalStorage("showAttendantName", false);
const userTable = useLocalStorage("userTable", 0);
const userCalledTicket = useLocalStorage("userCalledTicket", null);
const buttonDisabled = ref(false);

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

<style scoped></style>
