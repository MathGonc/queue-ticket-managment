<template>
  <!-- <div class="col"> -->
  <!-- <div class="col-sm-auto flex-nowrap"> -->

  <div class="sidebar">
    <div
      :class="[collapseMenu.all ? 'sidebar-collapsed' : 'sidebar-display']"
    >
      <div class="container head-buttons">
        <div class="row justify-content-between">
          <div class="col-md-auto btn-sidebar">
            <button
              class="btn btn-dark btn-sm"
              type="button"
              @click="toggleCollapseSidebar()"
            >
              <vue-feather type="menu" size="16" class="icon" stroke="white" />
            </button>
          </div>
          <div class="col-md-auto btn-back" v-if="$route.name != 'index'">
            <router-link :to="{ name: 'index' }">
              <button class="btn btn-primary btn-sm" type="button">
                <vue-feather type="arrow-left" size="16" class="icon" />
              </button>
            </router-link>
          </div>
        </div>
      </div>

      <div class="content">
        <ul class="list-unstyled">
          <div class="container"> 
            <div class="row">
              <!-- Queue -->
              <li class="list">
                <div class="row justify-content-between title">
                  <div class="col-auto text-area">
                    <vue-feather type="users" class="icon" />
                    <span class="text"> Fila: </span>
                    <span class="badge rounded">{{ ticketsInQueue }} </span>
                  </div>
                  <div class="col-auto button-area">
                    <button
                      @click="toggleCollapseMenuQueued()"
                      type="button"
                      class="btn btn-link btn-sm rounded"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseQueued"
                      :aria-expanded="!collapseMenu.queued"
                      aria-controls="#collapseQueued"
                      :disabled="buttonDisabled"
                    >
                      <vue-feather
                        type="chevron-left"
                        :class="[
                          collapseMenu.queued
                            ? 'icon collapsed'
                            : 'icon display',
                        ]"
                      />
                    </button>
                  </div>
                </div>

                <div
                  :class="[collapseMenu.queued ? 'collapse' : 'collapse show']"
                  id="collapseQueued"
                  @transitionend="onTransitionEndQueued"
                >
                  <div v-if="ticketsInQueue == 0" class="details">
                    A fila está vazia
                  </div>
                  <ul class="nav flex-column">
                    <li
                      class="nav-item"
                      v-for="(ticket, index) in filteredTickets"
                      :key="index"
                    >
                      <div class="ticket row" :class="{ 'ticket-called': ticket.ticketList._id === lastCalledTicketId }" v-if="ticket.ticketList.status == 1">
                        <div class="text-area col">
                          <span class="name">
                            {{ ticket.ticketList.number }} -
                            {{ ticket.ticketList.name }}
                            <span v-if="ticket.ticketList.preferential">
                              <span class="badge rounded">P</span>
                            </span>

                            <span style="padding-left: 5px" v-if="calculateAge(ticket.ticketList.assistedAge) >= 80 || ticket.ticketList.preferential == 2">
                              <span class="AgeBadge badge rounded">80+</span>
                            </span>

                          </span>
                          <div class="details">
                            <div v-if="ticket.ticketList.type">
                              ({{ ticket.ticketList.type }})
                            </div>
                            <div>
                              <div v-if="ticket.ticketList.docNumber">CPF: {{ ticket.ticketList.docNumber }}</div>
                              <div v-if="ticket.ticketList.assistedAge">Idade: {{ calculateAge(ticket.ticketList.assistedAge) }} anos </div>
                            </div>
                            <div>
                              Cadastrada:
                              {{ convertDateFn(ticket.ticketList.dateQueue) }}
                            </div>
                          </div>
                        </div>
                        <div class="button-area col-sm-auto">
                          <button
                            v-if="userRole >= userRoleToDeleteTickets"
                            @click="handleDeleteTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-danger btn-sm"
                            :disabled="buttonDisabled"
                          >
                            <vue-feather type="trash-2" size="16" class="icon" />
                          </button>
                          <button
                            @click="handleCallTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-primary btn-sm"
                            :disabled="buttonDisabled"
                          >
                            <vue-feather type="bell" size="16" class="icon" />
                          </button>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </li>
            </div>
          </div>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- Sidebar Right -->
  <div class="sidebar">
    <div style="right: 0"
      :class="[collapseMenu.all ? 'sidebar-collapsed' : 'sidebar-display']"
    >
      <div class="container head-buttons">
        <div class="row" style="justify-content: flex-end">
          <div class="col-md-auto btn-sidebar">
            <div v-if="showInterface" style="color: white; position: relative; right:0;">
              <template v-if="auth.isAuth">
                <vue-feather type="user" size="16" class="icon" />
                <span v-if="collapseMenu.all == false" style="padding: 5px"> {{ username }} </span>
                <button class="btn btn-outline-light btn-sm" @click="logout()">
                  <vue-feather type="log-out" size="16" class="icon" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="content">
        <ul class="list-unstyled">
          <div class="container"> 
              <!-- Removed queue -->
               <div class="row">
              <!-- Serviced -->
              <li class="list">
                <div class="row justify-content-between title">
                  <div class="col-auto text-area">
                    <vue-feather type="user-check" class="icon" />
                    <span class="text"> Atendidas: </span>
                  </div>
                  <div class="col-auto button-area">
                    <button
                      @click="toggleCollapseMenuServiced()"
                      type="button"
                      class="btn btn-link btn-sm rounded"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseServiced"
                      :aria-expanded="!collapseMenu.serviced"
                      aria-controls="#collapseServiced"
                      :disabled="buttonDisabled"
                    >
                      <vue-feather
                        type="chevron-left"
                        :class="[
                          collapseMenu.serviced
                            ? 'icon collapsed'
                            : 'icon display',
                        ]"
                      />
                    </button>
                  </div>
                </div>

                <div
                  :class="[collapseMenu.serviced ? 'collapse' : 'collapse show']"
                  id="collapseServiced"
                  @transitionend="onTransitionEndServiced"
                >
                  <ul class="nav flex-column">
                    <li
                      class="nav-item"
                      v-for="(ticket, index) in filteredTickets"
                      :key="index"
                    >
                      <div class="ticket row" :class="{ 'ticket-called': ticket.ticketList._id === lastCalledTicketId }" v-if="ticket.ticketList.status == 2">
                        <div class="text-area col">
                          <span class="name">
                            {{ ticket.ticketList.number }} -
                            {{ ticket.ticketList.name }}
                            <span v-if="ticket.ticketList.preferential">
                              <span class="badge rounded">P</span>
                            </span>
                          </span>
                          <div class="details">
                            <div v-if="ticket.ticketList.type">
                              ({{ ticket.ticketList.type }})
                            </div>
                            <div v-if="ticket.ticketList.docNumber">
                              CPF: {{ ticket.ticketList.docNumber }}
                            </div>
                            <div>
                              Cadastrada:
                              {{ convertDateFn(ticket.ticketList.dateQueue) }}
                            </div>
                            <div>
                              Atendida:
                              {{ convertDateFn(ticket.ticketList.dateServiced) }}
                            </div>
                            <div>
                              Atendida por:
                              {{ ticket.ticketList.servicedBy }}
                            </div>
                          </div>
                        </div>
                        <div class="button-area col-sm-auto">
                          <button
                            v-if="userRole >= userRoleToDeleteTickets"
                            @click="handleDeleteTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-danger btn-sm"
                            :disabled="buttonDisabled"
                          >
                            <vue-feather type="trash-2" size="16" class="icon" />
                          </button>
                          <button
                            @click="handleCallTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-primary btn-sm"
                            :disabled="buttonDisabled"
                          >
                            <vue-feather type="bell" size="16" class="icon" />
                          </button>
                        </div>
                      </div>
                    </li>
                    <div class="details">(Resultados dos últimos 7 dias)</div>
                  </ul>
                </div>
              </li>
              <!-- (End)Serviced -->
            </div>
          </div>
        </ul>
      </div>
    </div>
  </div>
  <div><router-view></router-view></div>
  <!-- </div> -->
  <!-- </div> -->
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { useLocalStorage } from "@vueuse/core";
import { useAuth } from "@/stores/auth.js";
import { createSocket, publicSocket } from "@/socket.js";
import { logoutUser } from "@/controllers/userController.js";
import { loadTicketsInQueue, deleteTicket } from "@/controllers/ticketController.js";
import { convertDate, calculateAge } from "@/utils/index.js";
import { callTicket } from "@/utils/callTicket.js";
import VueFeather from "vue-feather";
import config from "@/config.js";

defineOptions({
  name: "page_sidebar",
  components: {
    "vue-feather": VueFeather,
  },
});

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const toast = useToast();

// Reactive state
const showInterface = ref(true);
const buttonDisabled = ref(false);
const isTransitioningQueued = ref(false);
const isTransitioningServiced = ref(false);
const ticketsInQueue = ref(0);
const ticketData = ref([]);
const lastCalledTicketId = ref(null);

// Persistent state via useLocalStorage
const collapseMenu = useLocalStorage("collapseMenu", {
  all: false,
  queued: false,
  serviced: true,
});

// Computed
// Derivados do store (o guard carrega userData antes de abrir a tela), entao
// reagem quando o cargo chega: corrige o F5 que escondia opcoes por cargo.
const username = computed(() => auth.userData?.username || "");
const userRole = computed(() => auth.userData?.role || 0);
const userRoleToDeleteTickets = computed(() => config.userRoleToDeleteTickets);

const filteredTickets = computed(() =>
  ticketData.value.map((getTicket) => ({
    ticketList: getTicket,
  }))
);

// Methods
function convertDateFn(date) {
  return convertDate(date);
}

async function logout() {
  // Registra a saida (sem travar o logout se o servidor nao responder)
  await logoutUser();
  auth.clearToken();
  auth.setIsAuth(false);
  router.push({ name: "login" });
}

function handleCallTicket(_id) {
  if (buttonDisabled.value) return;
  setButtonDisabled();
  callTicket(_id).then(() => {
    lastCalledTicketId.value = _id;
    setTimeout(() => {
      lastCalledTicketId.value = null;
    }, 3000);
  });
}

function setButtonDisabled() {
  if (config.dev == 1) return;
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 5000);
}

function onTransitionEndQueued() {
  if (isTransitioningQueued.value) {
    isTransitioningQueued.value = false;
    buttonDisabled.value = false;
  }
}

function onTransitionEndServiced() {
  if (isTransitioningServiced.value) {
    isTransitioningServiced.value = false;
    buttonDisabled.value = false;
  }
}

function toggleCollapseSidebar() {
  collapseMenu.value.all = !collapseMenu.value.all;
}

function toggleCollapseMenuQueued() {
  if (buttonDisabled.value) return;
  buttonDisabled.value = true;
  isTransitioningQueued.value = true;
  collapseMenu.value.queued = !collapseMenu.value.queued;
}

function toggleCollapseMenuServiced() {
  if (buttonDisabled.value) return;
  buttonDisabled.value = true;
  isTransitioningServiced.value = true;
  collapseMenu.value.serviced = !collapseMenu.value.serviced;
}

async function handleLoadTicketsInQueue() {
  try {
    const response = await loadTicketsInQueue();
    ticketData.value = response.data.ticket;
    ticketsInQueue.value = ticketData.value.filter(
      (ticket) => ticket.status === 1
    ).length;
  } catch (error) {
    console.error(error);
  }
}

async function handleDeleteTicket(ticketID) {
  if (buttonDisabled.value) return;
  setButtonDisabled();

  if (userRole.value < config.userRoleToDeleteTickets) {
    return toast.error("Sem permissão");
  }

  try {
    const response = await deleteTicket(ticketID);
    response.status == 200
      ? toast.success("Ticket excluido")
      : toast.error("Ocorreu um erro");

    createSocket().emit("signalUpdateValues");
  } catch {
    toast.error("Ocorreu um erro");
  }
}

// Lifecycle
onMounted(() => {
  // Token ja validado pelo guard; pre-conecta o socket de controle
  if (auth.token) createSocket();

  handleLoadTicketsInQueue();
  publicSocket.on("receiveUpdateGlobal", handleLoadTicketsInQueue);
});

// Sem isso, cada ida ao /monitor e volta somava mais um listener
onBeforeUnmount(() => {
  publicSocket.off("receiveUpdateGlobal", handleLoadTicketsInQueue);
});

// Watch route changes
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName === "history") {
      collapseMenu.value.all = true;
    }
    if (newRouteName === "monitor") {
      showInterface.value = false;
    } else if (showInterface.value === false) {
      showInterface.value = true;
    }
  }
);
</script>

<style>
.sidebar {
  z-index: 1000;
  position: fixed;
}

.sidebar-collapsed {
  transition: all 0.7s ease-out;
  background: #2e2e2e;
  min-height: 100vh !important;
  max-width: 45px;
  border-top-right-radius: 3px;
  position: fixed;
  padding: 5px;
}

.sidebar-display {
  transition: max-width 0.7s ease-out;
  background: #2e2e2e;
  min-height: 100vh !important;
  max-width: 30%;
  position: fixed;
  padding: 5px 5px;
  border-top-right-radius: 3px;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  /* overflow: hidden; */
}

.sidebar-collapsed .content {
  transition: opacity 0.7s ease-out, visibility 0.5s ease-out;
  opacity: 0;
  visibility: hidden;
}

.sidebar-display .content {
  transition: opacity 0.7s ease-out, visibility 0.5s ease-out;
  opacity: 100;
  visibility: visible;
}

/* .sidebar::-webkit-scrollbar {
  display: none;
} */

.collapse:not(.show) {
  animation: collapseAnimation 0.7s ease-out;
  display: block !important;
  max-width: 0px;
  max-height: 0px;
  opacity: 0%;
}

.collapse.show {
  animation: collapseShowAnimation 0.7s ease-out;
  max-width: 500px;
  max-height: 500px;
  opacity: 100%;
}

@keyframes collapseAnimation {
  0% {
    max-width: 500px;
    max-height: 500px;
    opacity: 100%;
  }
  50% {
    max-width: 500px;
    max-height: 0px;
    opacity: 0%;
  }
  100% {
    max-width: 0px;
    max-height: 0px;
    opacity: 0%;
  }
}

@keyframes collapseShowAnimation {
  0% {
    max-width: 0px;
    max-height: 0px;
    opacity: 0%;
  }
  50% {
    max-width: 500px;
    max-height: 0px;
    opacity: 0%;
  }
  100% {
    max-width: 500px;
    max-height: 500px;
    opacity: 100%;
  }
}

.head-buttons .btn {
  margin-bottom: 5px;
}

.head-buttons {
  display: contents;
}

.sidebar .list {
  color: white;
  margin-top: 10px;
  margin-bottom: 25px;
  
}

.sidebar .list .nav {
  padding-inline: 20px;
  padding-bottom: 15%;
}

.badge {
  background-color: rgba(255, 19, 19, 0.432);
}
.AgeBadge {
  background-color: rgba(31, 255, 19, 0.43);
}

.sidebar .list .icon {
  filter: brightness(0) invert(1); /*white*/
}

.sidebar .title .text-area {
  text-align: left;
}

.sidebar .list .title .icon {
  width: 24px;
  height: 24px;
}

.sidebar .list .title .btn {
  float: right;
}

.sidebar .list .title .button-area .icon.collapsed {
  transition: all 0.5s ease-out;
  transform: rotate(0deg);
}

.sidebar .list .title .button-area .icon.display {
  transition: all 0.5s ease-out;
  transform: rotate(-90deg);
}

.sidebar .ticket {
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.082);
  padding-top: 10px;
  padding-bottom: 10px;
  margin-bottom: 5px;
  text-align: left;
}

.sidebar .ticket:hover {
  transition: background 0.5s ease-out;
  background: #64646441;
}

.sidebar .ticket .text {
  padding-inline-end: 50px;
}

.sidebar .list .nav-item {
  margin: 0 5px;
}

.sidebar .list .nav-item .btn {
  margin-top: 2px;
  margin-right: 5px;
}

.sidebar .list .details {
  line-height: 1.2;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 2px;
}

hr.separator {
  border-top: 1px solid rgb(226, 226, 226);
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 0px;
}

.sidebar ::-webkit-scrollbar {
  width: 10px;
}

.sidebar ::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.5);
  border-radius: 50px;
}

.sidebar ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.sidebar .ticket.ticket-called {
  border-color: rgba(40, 167, 69, 0.8);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.4);
  animation: callPulse 0.5s ease-in-out 2;
}

@keyframes callPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(40, 167, 69, 0.4); }
  50% { box-shadow: 0 0 15px rgba(40, 167, 69, 0.8); }
}
</style>
