<template>
  <div>
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <div class="sidebar col-3 col-md-auto col-xl-auto px-sm-auto px-2 min-vh-100">
          <div class="px-3 pt-2" v-if="this.$route.name != 'index'">
            <router-link :to="{ name: 'index' }">
              <button type="button" class="btn btn-primary btn-sm">
                <img src="../assets/arrow-left.svg" /> Voltar
              </button>
            </router-link>
            <hr class="separator" />
          </div>

          <div class="sidebar-list d-0 px-3 pt-1 text-white">
            <ul class="nav flex-column mb-0">
              <div v-if="ticketStatus.filter((status) => status === 1).length">
                <span class="fs-5 d-none d-sm-inline text-white">
                  <h5 style="text-align: left">
                    <img src="../assets/icon_queued.svg" /> Fila:
                    <button
                      @click="toggleCollapseMenuQueued()"
                      type="button"
                      class="btn btn-link btn-sm"
                      style="float: right"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseQueued"
                      :aria-expanded="this.collapseMenu.queued"
                      aria-controls="#collapseQueued"
                      :disabled="buttonDisabled">
                      <img v-if="this.collapseMenu.queued" src="../assets/icon_arrow_down.svg" />
                      <img v-else src="../assets/icon_arrow_left.svg" />
                    </button>
                  </h5>
                </span>
                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div
                    :class="[
                      isTransitioningQueued
                        ? 'collapsing'
                        : [collapseMenu.queued ? 'collapse show' : 'collapse'],
                    ]"
                    id="collapseQueued"
                    @transitionend="onTransitionEndQueued">
                    <div class="row" v-if="ticket.ticketStatus == 1">
                      <div class="col-auto px-0 py-1" v-if="userRole >= 3">
                        <button
                          @click="handleDeleteTicket(ticket.ticketID)"
                          type="button"
                          class="btn btn-danger btn-sm"
                          :disabled="buttonDisabled">
                          <img src="../assets/trash.svg" />
                        </button>
                      </div>
                      <div class="col-auto align-middle px-2">
                        <span>
                          {{ ticket.ticketNumber }} - {{ ticket.ticketName
                          }}<span v-if="ticket.ticketPreferential" style="color: red"
                            >&nbsp;(P)</span
                          >
                        </span>
                        <div class="col small">
                          <div>({{ ticket.ticketType }})</div>
                          <div v-if="ticket.ticketDocNumber">
                            CPF: {{ ticket.ticketDocNumber }}
                            <!-- <button
                            @click="handleDeleteTicket(ticket.ticketID)"
                            type="button"
                            class="btn btn-primary btn-sm"
                            :disabled="buttonDisabled">
                            <img src="../assets/clipboard.svg" />
                          </button> -->
                          </div>
                          <div>{{ convertDate(new Date(ticket.ticketDateQueue)) }}</div>
                        </div>
                      </div>
                      <hr class="separator" />
                    </div>
                  </div>
                </li>
              </div>
            </ul>
            <br />

            <ul class="nav flex-column mb-0">
              <div v-if="ticketStatus.filter((status) => status === 2).length">
                <span class="fs-5 d-none d-sm-inline text-white">
                  <h5 style="text-align: left">
                    <img src="../assets/icon_serviced.svg" /> Atendidos:
                    <button
                      @click="toggleCollapseMenuServiced()"
                      type="button"
                      class="btn btn-link btn-sm"
                      style="float: right"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseServiced"
                      :aria-expanded="this.collapseMenu.serviced"
                      aria-controls="#collapseServiced"
                      :disabled="buttonDisabled">
                      <img v-if="this.collapseMenu.serviced" src="../assets/icon_arrow_down.svg" />
                      <img v-else src="../assets/icon_arrow_left.svg" />
                    </button>
                  </h5>
                </span>

                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div
                    :class="[
                      isTransitioningServiced
                        ? 'collapsing'
                        : [collapseMenu.serviced ? 'collapse show' : 'collapse'],
                    ]"
                    id="collapseServiced"
                    @transitionend="onTransitionEndServiced">
                    <div class="row" v-if="ticket.ticketStatus == 2">
                      <div hidden class="col-auto px-0 py-1">
                        <button
                          type="button"
                          class="btn btn-info btn-sm"
                          :disabled="buttonDisabled">
                          <img src="../assets/button_recall.svg" />
                        </button>
                      </div>
                      <div class="col-auto align-middle px-2">
                        <span>
                          {{ ticket.ticketNumber }} - {{ ticket.ticketName
                          }}<span v-if="ticket.ticketPreferential" style="color: red"
                            >&nbsp;(P)</span
                          >
                        </span>
                        <div class="col small">
                          <div>({{ ticket.ticketType }})</div>
                          <div v-if="ticket.docNumber">CPF: {{ ticket.docNumber }}</div>
                          <div>
                            <span v-if="userRole >= 3"> por {{ ticket.ticketServicedBy }} </span>
                            ({{ convertDate(new Date(ticket.ticketDateServiced)) }})
                          </div>
                        </div>
                      </div>
                      <hr class="separator" />
                    </div>
                  </div>
                </li>
              </div>
            </ul>
          </div>
          <span class="margin-bottom">&nbsp;</span>
        </div>
        <div class="col py-3"><router-view></router-view></div>
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
        serviced: ref(true),
      }),
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

      if (this.userRole < 3) return useToast().success("Sem permissão");

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
hr.separator {
  border-top: 1px solid rgb(226, 226, 226);
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 0px;
}
</style>
