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
                  <h5 style="text-align: center"><img src="../assets/icon_queued.svg" /> Fila:</h5>
                </span>
                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div class="row" v-if="ticket.ticketStatus == 1">
                    <div class="col-auto px-0 py-1">
                      <button
                        @click="handleDeleteTicket(ticket.ticketID)"
                        type="button"
                        class="btn btn-danger btn-sm">
                        <img src="../assets/trash.svg" />
                      </button>
                    </div>
                    <div class="col-auto align-middle px-2">
                      <span>
                        {{ ticket.ticketNumber }} - {{ ticket.ticketName
                        }}<span v-if="ticket.ticketPreferential" style="color: red">&nbsp;(P)</span>
                      </span>
                      <br />
                      ({{ ticket.ticketType }})
                      <br />
                      {{ convertDate(new Date(ticket.ticketDateQueue)) }}
                    </div>
                    <hr class="separator" />
                  </div>
                </li>
              </div>

              <br />

              <div v-if="ticketStatus.filter((status) => status === 2).length">
                <span class="fs-5 d-none d-sm-inline text-white">
                  <h5 style="text-align: center">
                    <img src="../assets/icon_serviced.svg" /> Atendidos:
                  </h5>
                </span>

                <li class="nav-item" v-for="(ticket, index) in filteredTickets" :key="index">
                  <div class="row" v-if="ticket.ticketStatus == 2">
                    <div hidden class="col-auto px-0 py-1">
                      <button type="button" class="btn btn-info btn-sm">
                        <img src="../assets/button_recall.svg" />
                      </button>
                    </div>
                    <div class="col-auto align-middle px-2">
                      <span>
                        {{ ticket.ticketNumber }} - {{ ticket.ticketName
                        }}<span v-if="ticket.ticketPreferential" style="color: red">&nbsp;(P)</span>
                      </span>
                      <div class="col small">
                        ({{ ticket.ticketType }})
                        <br />
                        por {{ ticket.ticketServicedBy }} ({{
                          convertDate(new Date(ticket.ticketDateServiced))
                        }})
                      </div>
                    </div>
                    <hr class="separator" />
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
import { defineComponent } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { loadTicketsInQueue, deleteTicket } from "../controllers/ticketController";

export default defineComponent({
  name: "page_sidebar",
  data() {
    return {
      ticketID: [],
      ticketNumber: [],
      ticketStatus: [],
      ticketType: [],
      ticketPreferential: [],
      ticketName: [],
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
        ticketDateQueue: this.ticketDateQueue[index],
        ticketDateServiced: this.ticketDateServiced[index],
        ticketServicedBy: this.ticketServicedBy[index],
      }));
    },
  },
  methods: {
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
          this.ticketDateQueue.push(queueData[i].dateQueue);
          this.ticketDateServiced.push(queueData[i].dateServiced);
          this.ticketServicedBy.push(queueData[i].servicedBy);
        }
      });
    },
    async handleDeleteTicket(ticketID) {
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
