<template>
  <div>
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <div
          class="sidebar col-3 col-md-auto col-xl-auto px-sm-auto px-2 min-vh-100"
        >
          <div class="px-3 pt-2">
            <router-link :to="{ name: 'index' }">
              <button type="button" class="btn btn-primary btn-sm">
                <img src="../assets/arrow-left.svg" /> Voltar
              </button>
            </router-link>
          </div>

          <span class="fs-5 d-none d-sm-inline text-white">
            <hr />
            <h5>Próximos atendimentos:</h5>
          </span>

          <div class="sidebar-list d-0 px-3 pt-1 text-white">
            <ul class="nav flex-column mb-0">
              <li
                class="nav-item"
                v-for="(ticket, index) in filteredTickets"
                :key="index"
              >
                <div class="row">
                  <div class="col-auto px-0">
                    <button
                      @click="removeTicket(ticket.ticketNumber)"
                      type="button"
                      class="btn btn-danger btn-sm"
                    >
                      X
                    </button>
                  </div>
                  <div class="col-auto align-middle px-2">
                    <span>
                      {{ ticket.ticketNumber }} - {{ ticket.ticketName
                      }}<span
                        v-if="ticket.ticketPreferential"
                        style="color: red"
                        >&nbsp;(P)</span
                      >
                    </span>
                    <br />
                    ({{ ticket.ticketType }})
                  </div>
                </div>

                <hr />
              </li>
            </ul>
          </div>
        </div>
        <div class="col py-3"><router-view></router-view></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { socket } from "@/socket";
import { useToast } from "vue-toastification";

export default {
  name: "page_sidebar",
  async mounted() {},
  computed: {
    ...mapState([
      "ticketInQueue",
      "ticketType",
      "ticketPreferential",
      "ticketName",
    ]),
    filteredTickets() {
      return this.ticketInQueue
        .reduce((filtered, ticket, index) => {
          if (ticket === 1 && this.ticketPreferential[index] === 1) {
            filtered.push({
              ticketNumber: index,
              ticketName: this.ticketName[index],
              ticketType: this.ticketType[index],
              ticketPreferential: this.ticketPreferential[index],
            });
          }
          return filtered;
        }, [])
        .concat(
          this.ticketInQueue.reduce((filtered, ticket, index) => {
            if (ticket === 1 && this.ticketPreferential[index] !== 1) {
              filtered.push({
                ticketNumber: index,
                ticketName: this.ticketName[index],
                ticketType: this.ticketType[index],
                ticketPreferential: this.ticketPreferential[index],
              });
            }
            return filtered;
          }, [])
        );
    },
  },
  methods: {
    removeTicket(index) {
      console.log(index);
      this.$store.commit("setTicketData", {
        index,
        ticketInQueue: 0,
        ticketPreferential: 0,
        ticketName: 0,
        ticketType: 0,
      });

      this.$store.dispatch("updateVariablesInAPI");
      socket.emit("signalUpdateValues");

      useToast().success("Senha " + index + " liberada");
    },
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
        ? true
        : false;
    },
  },
};
</script>

<style></style>
