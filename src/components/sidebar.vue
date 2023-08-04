<template>
  <!-- <div class="col"> -->
  <!-- <div class="col-sm-auto flex-nowrap"> -->

  <div class="sidebar">
    <div :class="[this.collapseMenu.all ? 'sidebar-collapsed' : 'sidebar-display']">
      <div class="container head-buttons">
        <div class="row justify-content-between">
          <div class="col-md-auto btn-sidebar">
            <button class="btn btn-dark btn-sm" type="button" @click="toggleCollapseSidebar()">
              <vue-feather type="menu" size="16" class="icon" stroke="white" />
            </button>
            <!-- <div class="position-relative">
              <div v-if="this.collapseMenu.all">
                <div class="position-absolute top-50 start-100 translate-middle">
                  <span class="badge rounded">{{ this.ticketsInQueue }} </span>
                </div>
              </div>
            </div> -->
          </div>
          <div class="col-md-auto btn-back" v-if="this.$route.name != 'index'">
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
          <!-- Queue -->
          <li class="list">
            <div class="row justify-content-between title">
              <div class="col-auto text-area">
                <vue-feather type="users" class="icon" />
                <span class="text"> Fila: </span>
                <span class="badge rounded">{{ this.ticketsInQueue }} </span>
              </div>
              <div class="col-auto button-area">
                <button
                  @click="toggleCollapseMenuQueued()"
                  type="button"
                  class="btn btn-link btn-toggle btn-sm rounded"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseQueued"
                  :aria-expanded="!this.collapseMenu.queued"
                  aria-controls="#collapseQueued"
                  :disabled="buttonDisabled">
                  <vue-feather
                    type="chevron-left"
                    :class="[this.collapseMenu.queued ? 'icon collapsed' : 'icon display']" />
                </button>
              </div>
            </div>

            <div
              :class="[
                isTransitioningQueued
                  ? 'collapsing'
                  : [collapseMenu.queued ? 'collapse' : 'collapse show'],
              ]"
              id="collapseQueued"
              @transitionend="onTransitionEndQueued">
              <div v-if="this.ticketsInQueue == 0" class="details">A fila está vazia</div>
              <ul class="nav flex-column">
                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div class="ticket row" v-if="ticket.ticketStatus == 1">
                    <div class="text-area col">
                      <span class="name">
                        {{ ticket.ticketNumber }} - {{ ticket.ticketName }}
                        <span v-if="ticket.ticketPreferential">
                          <span class="badge rounded">P</span>
                        </span>
                      </span>
                      <div class="details">
                        <div v-if="ticket.ticketType">({{ ticket.ticketType }})</div>
                        <div v-if="ticket.ticketDocNumber">CPF: {{ ticket.ticketDocNumber }}</div>
                        <div>
                          Cadastrada:
                          {{ convertDate(new Date(ticket.ticketDateQueue)) }}
                        </div>
                      </div>
                    </div>
                    <div class="button-area col-sm-auto">
                      <button
                        v-if="userRole >= userRoleToDeleteTickets"
                        @click="handleDeleteTicket(ticket.ticketID)"
                        type="button"
                        class="btn btn-danger btn-sm"
                        :disabled="buttonDisabled">
                        <vue-feather type="trash-2" size="16" class="icon" />
                      </button>
                      <button
                        @click="handleCallTicket(ticket.ticketID)"
                        type="button"
                        class="btn btn-primary btn-sm"
                        :disabled="buttonDisabled">
                        <vue-feather type="bell" size="16" class="icon" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </li>

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
                  class="btn btn-link btn-toggle btn-sm rounded"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseServiced"
                  :aria-expanded="!this.collapseMenu.serviced"
                  aria-controls="#collapseServiced"
                  :disabled="buttonDisabled">
                  <vue-feather
                    type="chevron-left"
                    :class="[this.collapseMenu.serviced ? 'icon collapsed' : 'icon display']" />
                </button>
              </div>
            </div>

            <div
              :class="[
                isTransitioningServiced
                  ? 'collapsing'
                  : [collapseMenu.serviced ? 'collapse' : 'collapse show'],
              ]"
              id="collapseServiced"
              @transitionend="onTransitionEndServiced">
              <ul class="nav flex-column">
                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div class="ticket row" v-if="ticket.ticketStatus == 2">
                    <div class="text-area col">
                      <span class="name">
                        {{ ticket.ticketNumber }} - {{ ticket.ticketName }}
                        <span v-if="ticket.ticketPreferential">
                          <span class="badge rounded">P</span>
                        </span>
                      </span>
                      <div class="details">
                        <div v-if="ticket.ticketType">({{ ticket.ticketType }})</div>
                        <div v-if="ticket.ticketDocNumber">CPF: {{ ticket.ticketDocNumber }}</div>
                        <div>
                          Cadastrada:
                          {{ convertDate(new Date(ticket.ticketDateQueue)) }}
                        </div>
                        <div>
                          Atendida:
                          {{ convertDate(new Date(ticket.ticketDateServiced)) }}
                        </div>
                        <div>
                          Atendida por:
                          {{ ticket.ticketServicedBy }}
                        </div>
                      </div>
                    </div>
                    <div class="button-area col-sm-auto">
                      <button
                        v-if="userRole >= userRoleToDeleteTickets"
                        @click="handleDeleteTicket(ticket.ticketID)"
                        type="button"
                        class="btn btn-danger btn-sm"
                        :disabled="buttonDisabled">
                        <vue-feather type="trash-2" size="16" class="icon" />
                      </button>
                      <button
                        @click="handleCallTicket(ticket.ticketID)"
                        type="button"
                        class="btn btn-primary btn-sm"
                        :disabled="buttonDisabled">
                        <vue-feather type="bell" size="16" class="icon" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
              <div class="details">(Resultados dos últimos 7 dias)</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="col-auto"><router-view></router-view></div>
  <!-- </div> -->
  <!-- </div> -->
</template>

<script>
import { defineComponent, ref } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { useLocalStorage } from "@vueuse/core";
import { loadTicketsInQueue, deleteTicket } from "../controllers/ticketController";
import { vMaska } from "maska";
import { useAuth } from "@/stores/auth.js";
import { callTicket } from "../utils";
import { checkToken } from "../controllers/userController";

import VueFeather from "vue-feather";
import config from "../config";

export default defineComponent({
  name: "page_sidebar",
  directives: { maska: vMaska },
  components: {
    "vue-feather": VueFeather,
  },
  data() {
    return {
      buttonDisabled: false,
      userRole: 0,
      isTransitioning: false,
      collapseMenu: useLocalStorage("collapseMenu", {
        all: ref(false),
        queued: ref(false),
        serviced: ref(true),
      }),
      ticketsInQueue: 0,
      ticketID: [],
      ticketNumber: [],
      ticketStatus: [],
      ticketType: [],
      ticketPreferential: [],
      ticketName: [],
      ticketDocNumber: [],
      ticketDateQueue: [],
      ticketDateServiced: [],
      ticketServicedBy: [],
    };
  },
  async mounted() {
    this.handleLoadTicketsInQueue();
    socket.on("receiveUpdateGlobal", () => {
      this.handleLoadTicketsInQueue();
    });
    if (this.auth.isAuth) {
      await checkToken().then((data) => {
        this.userRole = data.userData.role;
      });
    }
  },
  setup() {
    const auth = useAuth();
    return {
      auth,
    };
  },
  computed: {
    userRoleToDeleteTickets() {
      return config.userRoleToDeleteTickets;
    },
    filteredTickets() {
      return this.ticketNumber.map((ticketNumber, index) => ({
        ticketID: this.ticketID[index],
        ticketNumber: this.ticketNumber[index],
        ticketStatus: this.ticketStatus[index],
        ticketType: this.ticketType[index],
        ticketPreferential: this.ticketPreferential[index],
        ticketName: this.ticketName[index],
        ticketDocNumber: this.ticketDocNumber[index],
        ticketDateQueue: this.ticketDateQueue[index],
        ticketDateServiced: this.ticketDateServiced[index],
        ticketServicedBy: this.ticketServicedBy[index],
      }));
    },
  },
  methods: {
    handleCallTicket(_id) {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();
      callTicket(_id);
    },
    setButtonDisabled() {
      if (process.env.VUE_APP_DEV == 1) return 0;
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 5000);
      return 1;
    },
    formatValue(value) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    },
    onTransitionEndQueued() {
      this.isTransitioningQueued
        ? ((this.isTransitioningQueued = false), (this.buttonDisabled = false))
        : "";
    },
    onTransitionEndServiced() {
      this.isTransitioningServiced
        ? ((this.isTransitioningServiced = false), (this.buttonDisabled = false))
        : "";
    },
    toggleCollapseSidebar() {
      // if (this.buttonDisabled) return;
      // this.buttonDisabled = true;

      //this.collapseMenu.queued = true;
      //this.collapseMenu.serviced = true;

      this.collapseMenu.all ? (this.collapseMenu.all = false) : (this.collapseMenu.all = true);
    },
    toggleCollapseMenuQueued() {
      if (this.buttonDisabled) return;
      this.buttonDisabled = true;
      this.isTransitioningQueued = true;

      this.collapseMenu.queued
        ? (this.collapseMenu.queued = false)
        : (this.collapseMenu.queued = true);
    },
    toggleCollapseMenuServiced() {
      if (this.buttonDisabled) return;
      this.buttonDisabled = true;
      this.isTransitioningServiced = true;

      this.collapseMenu.serviced
        ? (this.collapseMenu.serviced = false)
        : (this.collapseMenu.serviced = true);
    },
    convertDate(date) {
      const formatedDate = `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString(
        "pt-BR",
        {
          hour12: false,
        }
      )}`.slice(0, 19);
      return formatedDate;
    },
    async handleLoadTicketsInQueue() {
      await loadTicketsInQueue().then((response) => {
        const queueData = response.data.ticket;
        this.ticketsInQueue = response.data.ticket.filter((ticket) => ticket.status === 1).length;
        console.log(queueData);

        this.ticketID = [];
        this.ticketNumber = [];
        this.ticketStatus = [];
        this.ticketType = [];
        this.ticketPreferential = [];
        this.ticketName = [];
        this.ticketDocNumber = [];
        this.ticketDateQueue = [];
        this.ticketDateServiced = [];
        this.ticketServicedBy = [];

        for (let i = 0; i < queueData.length; i++) {
          this.ticketID.push(queueData[i]._id);
          this.ticketNumber.push(queueData[i].number);
          this.ticketStatus.push(queueData[i].status);
          this.ticketType.push(queueData[i].type);
          this.ticketPreferential.push(queueData[i].preferential);
          this.ticketName.push(queueData[i].name);
          this.ticketDocNumber.push(queueData[i].docNumber);
          this.ticketDateQueue.push(queueData[i].dateQueue);
          this.ticketDateServiced.push(queueData[i].dateServiced);
          this.ticketServicedBy.push(queueData[i].servicedBy);
        }
      });
    },
    async handleDeleteTicket(ticketID) {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();

      if (this.userRole < config.userRoleToDeleteTickets)
        return useToast().success("Sem permissão");

      await deleteTicket(ticketID).then((response) => {
        response.status == 200
          ? useToast().success("Ticket excluido")
          : useToast().error("Ocorreu um erro");

        //this.handleLoadTicketsInQueue();
        socket.emit("signalUpdateValues");
      });
    },
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
        ? true
        : false;
    },
  },
});
</script>

<style>
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
  transition: all 0.3s ease-out;
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
  transition: opacity 0.3s ease-out, visibility 0.5s ease-out;
  opacity: 0;
  visibility: hidden;
}

.sidebar-display .content {
  transition: opacity 0.3s ease-out, visibility 0.5s ease-out;
  opacity: 100;
  visibility: visible;
}

.sidebar-collapsed .head-buttons .btn {
  margin-bottom: 5px;
}

/* .sidebar::-webkit-scrollbar {
  display: none;
} */

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
}

.badge {
  background-color: rgba(255, 19, 19, 0.432);
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
</style>
