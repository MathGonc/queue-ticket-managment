<template>
  <div>
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <div class="sidebar col-auto col-md-auto col-xl-auto px-sm-auto px-0">
          <div class="px-3 pt-2">
            <router-link :to="{ name: 'index' }">
              <button type="button" class="btn btn-primary btn-sm">
                <img src="../assets/arrow-left.svg" />
              </button>
            </router-link>
          </div>

          <span class="fs-5 d-none d-sm-inline text-white m">
            <hr />
            <h5>Próximos atendimentos:</h5>
          </span>

          <div
            class="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100"
          >
            <ul
              class="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start"
            >
              <li
                class="nav-item"
                v-for="(ticket, index) in filteredTickets"
                :key="index"
              >
                <a
                  href="#"
                  class="nav-link align-middle px-0"
                  style="color: rgb(255, 255, 255)"
                >
                  <span class="ms-1 d-none d-sm-inline"
                    >{{ ticket.ticketNumber }} - {{ ticket.ticketName }} ({{
                      ticket.ticketType
                    }})<span v-if="ticket.ticketPreferential" style="color: red"
                      >&nbsp;(Preferencial)</span
                    >
                  </span>
                </a>
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
import io from "socket.io-client";
import config from "../../config.js";

export default {
  name: "page_sidebar",
  mounted() {
    this.socket = io(config.url_server);
    this.socket.on("receiveUpdateGlobal", () => {
      this.$store.dispatch("getGlobalVariablesAPI");
    });
  },
  computed: {
    ...mapState([
      "ticketInQueue",
      "ticketType",
      "ticketPreferential",
      "ticketName",
    ]),
    filteredTickets() {
      return this.ticketInQueue.reduce((filtered, ticket, index) => {
        if (ticket === 1) {
          filtered.push({
            ticketNumber: index,
            ticketName: this.ticketName[index],
            ticketType: this.ticketType[index],
            ticketPreferential: this.ticketPreferential[index],
          });
        }
        return filtered;
      }, []);
    },
  },
  methods: {
    isMobile() {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

<style></style>
