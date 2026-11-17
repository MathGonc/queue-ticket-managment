<template>
  <!-- <div class="col"> -->
  <!-- <div class="col-sm-auto flex-nowrap"> -->

  <div class="sidebar">
    <div
      class="side-left"
      :class="[collapseMenu.all ? 'sidebar-collapsed' : 'sidebar-display']"
    >
      <div class="container head-buttons">
        <div class="row justify-content-between">
          <div class="col-md-auto btn-sidebar">
            <button
              class="btn btn-dark btn-sm"
              type="button"
              :title="collapseMenu.all ? 'Abrir as barras laterais' : 'Recolher as barras laterais'"
              :aria-label="collapseMenu.all ? 'Abrir as barras laterais' : 'Recolher as barras laterais'"
              :aria-expanded="!collapseMenu.all"
              @click="toggleCollapseSidebar()"
            >
              <Menu :size="16" class="icon" color="white" />
            </button>
          </div>
          <div class="col-md-auto btn-back" v-if="$route.name != 'index'">
            <router-link :to="{ name: 'index' }">
              <button class="btn btn-primary btn-sm" type="button">
                <ArrowLeft :size="16" class="icon" />
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
                    <Users class="icon" />
                    <span class="text"> Fila </span>
                    <span class="count-badge" :aria-label="`${ticketsInQueue} na fila`">{{ ticketsInQueue }}</span>
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
                      <ChevronLeft
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
                      <div class="ticket" :class="{ 'ticket-called': ticket.ticketList._id === lastCalledTicketId }" v-if="ticket.ticketList.status == 1">
                        <div class="ticket-main">
                          <div class="ticket-head">
                            <span class="ticket-number">{{ ticket.ticketList.number }}</span>
                            <span v-if="ticket.ticketList.preferential" class="tag tag-pref" title="Preferencial">P</span>
                            <span v-if="calculateAge(ticket.ticketList.assistedAge) >= 80 || ticket.ticketList.preferential == 2" class="tag tag-elderly" title="80 anos ou mais">80+</span>
                            <span class="ticket-name">{{ ticket.ticketList.name }}</span>
                          </div>
                          <div class="details">
                            <div v-if="ticket.ticketList.type">{{ ticket.ticketList.type }}</div>
                            <div v-if="ticket.ticketList.docNumber">CPF {{ ticket.ticketList.docNumber }}</div>
                            <div v-if="ticket.ticketList.assistedAge">{{ calculateAge(ticket.ticketList.assistedAge) }} anos</div>
                            <div>Cadastrada {{ shortDateTime(ticket.ticketList.dateQueue) }}</div>
                          </div>
                        </div>
                        <!-- Chamar em destaque; excluir pequeno, afastado e com confirmacao -->
                        <div class="ticket-actions">
                          <button
                            @click="handleCallTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-primary btn-sm"
                            :disabled="buttonDisabled"
                          >
                            <Bell :size="16" class="icon" /> Chamar
                          </button>
                          <button
                            v-if="userRole >= userRoleToDeleteTickets"
                            @click="handleDeleteTicket(ticket.ticketList)"
                            type="button"
                            class="btn btn-sm btn-delete"
                            :disabled="buttonDisabled"
                            :title="`Excluir a senha ${ticket.ticketList.number}`"
                            :aria-label="`Excluir a senha ${ticket.ticketList.number}`"
                          >
                            <Trash2 :size="16" class="icon" />
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
    <div
      class="end-0 side-right"
      :class="[collapseMenu.all ? 'sidebar-collapsed' : 'sidebar-display']"
    >
      <div class="container head-buttons">
        <div class="row justify-content-between">
          <div class="col-md-auto btn-sidebar">
            <!-- Tema: sol e lua sempre visiveis; o marcador desliza ate o atual -->
            <button
              class="theme-toggle"
              :class="{ 'is-dark': isDark }"
              type="button"
              role="switch"
              :aria-checked="isDark"
              aria-label="Tema escuro"
              :title="isDark ? 'Tema escuro (clique para o claro)' : 'Tema claro (clique para o escuro)'"
              @click="toggleTheme()"
            >
              <span class="theme-thumb" aria-hidden="true"></span>
              <span class="theme-cell sun" aria-hidden="true"><Sun :size="14" /></span>
              <span class="theme-cell moon" aria-hidden="true"><Moon :size="14" /></span>
            </button>
          </div>
          <div class="col-md-auto btn-sidebar">
            <div v-if="showInterface" class="text-white">
              <template v-if="auth.isAuth">
                <User :size="16" class="icon" />
                <span v-if="collapseMenu.all == false" class="p-1"> {{ username }} </span>
                <button class="btn btn-outline-light btn-sm" type="button" title="Sair" aria-label="Sair" @click="logout()">
                  <LogOut :size="16" class="icon" />
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
                    <UserCheck class="icon" />
                    <span class="text"> Atendidas </span>
                    <span class="count-badge" :aria-label="`${ticketsServiced} atendidas`">{{ ticketsServiced }}</span>
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
                      <ChevronLeft
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
                      <div class="ticket" :class="{ 'ticket-called': ticket.ticketList._id === lastCalledTicketId }" v-if="ticket.ticketList.status == 2">
                        <div class="ticket-main">
                          <div class="ticket-head">
                            <span class="ticket-number">{{ ticket.ticketList.number }}</span>
                            <span v-if="ticket.ticketList.preferential" class="tag tag-pref" title="Preferencial">P</span>
                            <span class="ticket-name">{{ ticket.ticketList.name }}</span>
                          </div>
                          <div class="details">
                            <div v-if="ticket.ticketList.type">{{ ticket.ticketList.type }}</div>
                            <div v-if="ticket.ticketList.docNumber">CPF {{ ticket.ticketList.docNumber }}</div>
                            <div>Cadastrada {{ shortDateTime(ticket.ticketList.dateQueue) }}</div>
                            <div>Atendida {{ shortDateTime(ticket.ticketList.dateServiced) }}<template v-if="ticket.ticketList.servicedBy"> por {{ ticket.ticketList.servicedBy }}</template></div>
                          </div>
                        </div>
                        <div class="ticket-actions">
                          <button
                            @click="handleCallTicket(ticket.ticketList._id)"
                            type="button"
                            class="btn btn-outline-light btn-sm"
                            :disabled="buttonDisabled"
                            :title="`Chamar a senha ${ticket.ticketList.number} de novo`"
                          >
                            <Bell :size="16" class="icon" /> Chamar
                          </button>
                          <button
                            v-if="userRole >= userRoleToDeleteTickets"
                            @click="handleDeleteTicket(ticket.ticketList)"
                            type="button"
                            class="btn btn-sm btn-delete"
                            :disabled="buttonDisabled"
                            :title="`Excluir a senha ${ticket.ticketList.number}`"
                            :aria-label="`Excluir a senha ${ticket.ticketList.number}`"
                          >
                            <Trash2 :size="16" class="icon" />
                          </button>
                        </div>
                      </div>
                    </li>
                    <div class="details list-note">Últimos 7 dias</div>
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
import { toast } from "@/services/notify.js";
import { useLocalStorage } from "@vueuse/core";
import { useAuth } from "@/stores/auth.js";
import { createSocket, publicSocket } from "@/socket.js";
import { logoutUser } from "@/controllers/userController.js";
import { loadTicketsInQueue, deleteTicket } from "@/controllers/ticketController.js";
import { calculateAge, shortDateTime } from "@/utils/index.js";
import { callTicket } from "@/utils/callTicket.js";
import { ArrowLeft, Bell, ChevronLeft, LogOut, Menu, Moon, Sun, Trash2, User, UserCheck, Users } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme.js";
import config from "@/config.js";

defineOptions({
  name: "page_sidebar",
});

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const { isDark, toggleTheme } = useTheme();

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

const ticketsServiced = computed(() => ticketData.value.filter((t) => t.status === 2).length);

// Methods

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
  // Escolha manual: deixa de ser um recolhimento automatico
  collapseMenu.value.autoCollapsed = false;
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

async function handleDeleteTicket(ticket) {
  if (buttonDisabled.value) return;
  if (!confirm(`Excluir a senha ${ticket.number} (${ticket.name})?`)) return;
  setButtonDisabled();
  const ticketID = ticket._id;

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

// Telas largas recolhem as sidebars (que sao fixas e cobririam o conteudo)
// e, ao sair delas, voltam como o usuario tinha deixado. A marca
// autoCollapsed fica salva junto (localStorage), entao vale tambem apos F5.
// immediate: vale tambem ao abrir a tela direto pelo endereco.
const WIDE_PAGES = ["history", "config"];
watch(
  () => route.name,
  (newRouteName) => {
    const wide = WIDE_PAGES.includes(newRouteName);
    if (wide && !collapseMenu.value.all) {
      collapseMenu.value.all = true;
      collapseMenu.value.autoCollapsed = true;
    } else if (!wide && collapseMenu.value.autoCollapsed) {
      collapseMenu.value.all = false;
      collapseMenu.value.autoCollapsed = false;
    }
    if (newRouteName === "monitor") {
      showInterface.value = false;
    } else if (showInterface.value === false) {
      showInterface.value = true;
    }
  },
  { immediate: true }
);
</script>

<style>
.sidebar {
  z-index: 1000;
  position: fixed;
}

/* Sidebars: so a moldura muda de largura. O conteudo tem largura fixa e
   desliza junto com a borda que fecha, esmaecendo: nada se reacomoda nem
   espreme durante a animacao. */
.sidebar-collapsed,
.sidebar-display {
  --sidebar-open: clamp(280px, 26vw, 400px);
  --sidebar-speed: 0.45s;
  --sidebar-ease: cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--qtm-sidebar-bg);
  min-height: 100vh !important;
  max-height: 100%;
  position: fixed;
  /* Presa ao topo da janela. Sem "top", a barra fixa fica onde estaria no
     fluxo e desce junto com a margem do titulo da pagina (.title_page), que
     vaza para fora dos blocos pais (margin collapse). */
  top: 0;
  padding: 5px;
  border-top-right-radius: 3px;
  overflow-x: hidden;
  transition: width var(--sidebar-speed) var(--sidebar-ease);
}

.sidebar-display {
  width: var(--sidebar-open);
  overflow-y: auto;
}

.sidebar-collapsed {
  width: 45px;
  overflow-y: hidden;
}

.sidebar .content {
  /* 20px: padding da moldura + barra de rolagem */
  width: calc(var(--sidebar-open) - 20px);
  transition:
    transform var(--sidebar-speed) var(--sidebar-ease),
    opacity var(--sidebar-speed) ease,
    visibility 0s linear 0s;
}

.sidebar-collapsed .content {
  opacity: 0;
  visibility: hidden;
  transition:
    transform var(--sidebar-speed) var(--sidebar-ease),
    opacity var(--sidebar-speed) ease,
    visibility 0s linear var(--sidebar-speed);
}

/* Esquerda: o conteudo acompanha a borda direita, que fecha para a esquerda.
   Direita: a borda que se move e a esquerda, e o conteudo ja vai junto. */
.side-left.sidebar-collapsed .content {
  transform: translateX(calc(45px - var(--sidebar-open)));
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-collapsed,
  .sidebar-display,
  .sidebar .content {
    transition: none;
  }
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

/* Botoes de contorno nas barras: borda fina cinza e fixa, sem o branco forte */
.sidebar .btn-outline-light {
  --bs-btn-color: #c3cad2;
  --bs-btn-border-color: #4a5563;
  --bs-btn-hover-color: #fff;
  --bs-btn-hover-bg: rgba(255, 255, 255, 0.08);
  --bs-btn-hover-border-color: #6b7685;
  --bs-btn-active-color: #fff;
  --bs-btn-active-bg: rgba(255, 255, 255, 0.14);
  --bs-btn-active-border-color: #6b7685;
  --bs-btn-disabled-color: #c3cad2;
  --bs-btn-disabled-border-color: #4a5563;
}

/* Seletor de tema: trilho com sol e lua, marcador claro que desliza */
.theme-toggle {
  --cell: 24px;
  position: relative;
  display: inline-flex;
  margin-bottom: 5px;
  padding: 2px;
  border: 1px solid #4a5563;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.theme-toggle:hover {
  border-color: #6b7685;
}

.theme-toggle:focus-visible {
  outline: 2px solid #8ab4f8;
  outline-offset: 2px;
}

.theme-cell {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cell);
  height: var(--cell);
  color: #8d97a3;
  transition: color 0.25s ease;
}

.theme-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: var(--cell);
  height: var(--cell);
  border-radius: 50%;
  background: #e6ebf0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle.is-dark .theme-thumb {
  transform: translateX(var(--cell));
}

/* Icone sobre o marcador fica escuro; o outro, apagado */
.theme-toggle:not(.is-dark) .sun,
.theme-toggle.is-dark .moon {
  color: #1d2733;
}

/* Barra recolhida (45px): o seletor fica em pe */
.sidebar-collapsed .theme-toggle {
  flex-direction: column;
}

.sidebar-collapsed .theme-toggle.is-dark .theme-thumb {
  transform: translateY(var(--cell));
}

@media (prefers-reduced-motion: reduce) {
  .theme-thumb,
  .theme-cell {
    transition: none;
  }
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
  padding-inline: 12px;
  padding-bottom: 15%;
}

/* Quantidade ao lado de "Fila" e "Atendidas": neutra (nao e alerta) */
.sidebar .count-badge {
  display: inline-block;
  min-width: 1.7em;
  margin-left: 4px;
  padding: 0 0.45em;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: var(--qtm-fs-small);
  font-weight: 600;
  line-height: 1.6;
  text-align: center;
  vertical-align: 2px;
}

/* Prioridade do assistido, ao lado do numero */
.sidebar .tag {
  display: inline-block;
  padding: 0 0.4em;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.sidebar .tag-pref {
  background: var(--qtm-preferential);
}

.sidebar .tag-elderly {
  background: var(--qtm-elderly);
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
  /* seta de abrir/fechar a lista: clara sobre a moldura escura */
  color: #fff;
}

.sidebar .list .title .button-area .icon.collapsed {
  transition: all 0.5s ease-out;
  transform: rotate(0deg);
}

.sidebar .list .title .button-area .icon.display {
  transition: all 0.5s ease-out;
  transform: rotate(-90deg);
}

/* Cartao da senha: dados a esquerda, acoes numa coluna a direita */
.sidebar .ticket {
  display: flex;
  gap: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 12px;
  margin-bottom: 8px;
  text-align: left;
}

.sidebar .ticket:hover {
  transition: background 0.3s ease-out;
  background: rgba(255, 255, 255, 0.05);
}

.sidebar .ticket-main {
  flex: 1;
  min-width: 0;
}

/* Numero e etiquetas fixos a esquerda; o nome quebra so dentro do proprio
   espaco (em telas de 1366px ele nao cai para baixo do numero) */
.sidebar .ticket-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.3;
}

.sidebar .ticket-number,
.sidebar .tag {
  flex-shrink: 0;
}

.sidebar .ticket-number {
  font-weight: 700;
}

.sidebar .ticket-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.sidebar .list .details {
  margin-top: 4px;
  color: #b6c0ca;
  font-size: 13px;
  line-height: 1.45;
}

.sidebar .list .list-note {
  text-align: center;
}

/* Chamar em cima; excluir embaixo, so icone, longe do clique principal */
.sidebar .ticket-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.sidebar .ticket-actions .btn {
  white-space: nowrap;
}

.sidebar .btn-delete {
  --bs-btn-color: #ff8a8a;
  --bs-btn-border-color: transparent;
  --bs-btn-hover-color: #ffb3b3;
  --bs-btn-hover-bg: rgba(255, 138, 138, 0.12);
  --bs-btn-hover-border-color: #ff8a8a;
  --bs-btn-active-color: #ffb3b3;
  --bs-btn-active-bg: rgba(255, 138, 138, 0.2);
  --bs-btn-active-border-color: #ff8a8a;
  --bs-btn-disabled-color: #ff8a8a;
  --bs-btn-disabled-border-color: transparent;
  padding: 2px 6px;
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
