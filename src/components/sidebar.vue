<template>
  <div>
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <div class="sidebar col-auto col-md-auto col-xl-auto px-sm-auto min-vh-100">
          <div class="pt-2" v-if="this.$route.name != 'index'">
            <router-link class="d-grid gap-2" :to="{ name: 'index' }">
              <button class="btn btn-primary btn-sm" type="button">
                <img src="../assets/arrow-left.svg" /> Voltar
              </button>
            </router-link>
          </div>

          <ul class="list-unstyled">
            <!-- Queue -->
            <li class="list">
              <div class="title position-relative">
                <div class="textarea">
                  <img class="icon" src="../assets/queued.svg" />
                  <span class="text"> Fila: </span>
                  <span class="badge rounded">
                    {{ this.ticketsInQueue }}
                  </span>
                </div>
                <div class="position-absolute top-50 end-0 translate-middle-y">
                  <button
                    @click="toggleCollapseMenuQueued()"
                    type="button"
                    class="btn btn-link btn-toggle btn-sm rounded"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseQueued"
                    :aria-expanded="this.collapseMenu.queued"
                    aria-controls="#collapseQueued"
                    :disabled="buttonDisabled">
                    <img
                      class="icon"
                      v-if="this.collapseMenu.queued"
                      src="../assets/arrow_down.svg" />
                    <img class="icon" v-else src="../assets/arrow_left.svg" />
                  </button>
                </div>
              </div>

              <div
                :class="[
                  isTransitioningQueued
                    ? 'collapsing'
                    : [collapseMenu.queued ? 'collapse show' : 'collapse'],
                ]"
                id="collapseQueued"
                @transitionend="onTransitionEndQueued">
                <div v-if="this.ticketsInQueue == 0" class="details">A fila está vazia</div>
                <ul class="nav flex-column">
                  <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                    <div class="ticket position-relative" v-if="ticket.ticketStatus == 1">
                      <div class="textarea col-auto align-middle">
                        <span class="name">
                          {{ ticket.ticketNumber }} - {{ ticket.ticketName }}
                          <span v-if="ticket.ticketPreferential">
                            <span class="badge rounded">P</span>
                          </span>
                        </span>
                        <div class="details">
                          <div>({{ ticket.ticketType }})</div>
                          <div v-if="ticket.ticketDocNumber">CPF: {{ ticket.ticketDocNumber }}</div>
                          <div>
                            {{ convertDate(new Date(ticket.ticketDateQueue)) }}
                          </div>
                        </div>
                      </div>
                      <div class="position-absolute top-50 end-0 translate-middle-y">
                        <button
                          v-if="userRole >= userRoleToDeleteTickets"
                          @click="handleDeleteTicket(ticket.ticketID)"
                          type="button"
                          class="btn btn-danger btn-sm"
                          :disabled="buttonDisabled">
                          <img class="icon" src="../assets/trash.svg" />
                        </button>
                        <button
                          @click="handleCallTicket(ticket.ticketID)"
                          type="button"
                          class="btn btn-primary btn-sm"
                          :disabled="buttonDisabled">
                          <img class="icon" src="../assets/volume-up-fill.svg" />
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </li>

            <!-- Serviced -->
            <li class="list">
              <div class="title position-relative">
                <div class="textarea">
                  <img class="icon" src="../assets/serviced.svg" />
                  <span class="text"> Atendidos: </span>
                </div>
                <div class="position-absolute top-50 end-0 translate-middle-y">
                  <button
                    @click="toggleCollapseMenuServiced()"
                    type="button"
                    class="btn btn-link btn-toggle btn-sm rounded"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseServiced"
                    :aria-expanded="this.collapseMenu.serviced"
                    aria-controls="#collapseServiced"
                    :disabled="buttonDisabled">
                    <img
                      class="icon"
                      v-if="this.collapseMenu.serviced"
                      src="../assets/arrow_down.svg" />
                    <img class="icon" v-else src="../assets/arrow_left.svg" />
                  </button>
                </div>
              </div>

              <div
                :class="[
                  isTransitioningServiced
                    ? 'collapsing'
                    : [collapseMenu.serviced ? 'collapse show' : 'collapse'],
                ]"
                id="collapseServiced"
                @transitionend="onTransitionEndServiced">
                <ul class="nav flex-column">
                  <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                    <div class="ticket position-relative" v-if="ticket.ticketStatus == 2">
                      <div class="textarea col-auto align-middle">
                        <span class="name">
                          {{ ticket.ticketNumber }} - {{ ticket.ticketName }}
                          <span v-if="ticket.ticketPreferential">
                            <span class="badge rounded">P</span>
                          </span>
                        </span>
                        <div class="details">
                          <div>({{ ticket.ticketType }})</div>
                          <div v-if="ticket.ticketDocNumber">CPF: {{ ticket.ticketDocNumber }}</div>
                          <div>
                            {{ convertDate(new Date(ticket.ticketDateQueue)) }}
                          </div>
                        </div>
                      </div>
                      <div class="position-absolute top-50 end-0 translate-middle-y">
                        <button
                          @click="handleCallTicket(ticket.ticketID)"
                          type="button"
                          class="btn btn-primary btn-sm"
                          :disabled="buttonDisabled">
                          <img class="icon" src="../assets/volume-up-fill.svg" />
                        </button>
                        <button
                          v-if="userRole >= userRoleToDeleteTickets"
                          @click="handleDeleteTicket(ticket.ticketID)"
                          type="button"
                          class="btn btn-danger btn-sm"
                          :disabled="buttonDisabled">
                          <img class="icon" src="../assets/trash.svg" />
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
        <div class="col"><router-view></router-view></div>
      </div>
    </div>
  </div>
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
import config from "../config";

export default defineComponent({
  name: "page_sidebar",
  directives: { maska: vMaska },
  data() {
    return {
      buttonDisabled: false,
      userRole: 0,
      isTransitioning: false,
      collapseMenu: useLocalStorage("collapseMenu", {
        queued: ref(true),
        serviced: ref(false),
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
      await this.auth.checkPermission().then((data) => {
        this.userRole = data.role;
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
.sidebar {
  background: #2e2e2e;
  max-height: 500px;
  max-width: 700px;
  min-width: 350px;
  overflow-y: auto;
  position: fixed;
}

.sidebar .list {
  color: white;
  margin-block-end: 10%;
}

.sidebar .list .badge {
  background-color: rgba(255, 19, 19, 0.432);
}

.sidebar .list .icon {
  filter: brightness(0) invert(1); /*white*/
}

.sidebar .title {
  align-items: center;
  display: flex;
  margin: 5px 0px;
}

.sidebar .title .textarea {
  text-align: left;
}

.sidebar .list .title .icon {
  width: 24px;
  height: 24px;
}
.sidebar .list .title .btn {
  text-align: right;
}

.sidebar .ticket {
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.178);
  padding: 5px;
  margin-bottom: 5px;
  text-align: left;
}

.sidebar .ticket .text {
  padding-inline-end: 50px;
  align-items: center;
}

.sidebar .list .nav-item {
  margin: 0 5px;
}

.sidebar .list .nav-item .btn {
  margin-top: 2px;
  margin-right: 5px;
}

.sidebar .list .ticket .textarea .name {
  font-size: 16px;
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
