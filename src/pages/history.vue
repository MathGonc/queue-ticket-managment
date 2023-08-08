<template>
  <div class="ticket-history">
    <topbar></topbar>
    <span class="title_page">Histórico</span>
    <div class="container">
      <input v-model="searchTerm" placeholder="Procurar" />
      <select v-model="itemsPerPage">
        <option v-for="option in itemsPerPageOptions" :key="option">{{ option }}</option>
      </select>

      <table class="table table-striped">
        <thead>
          <tr>
            <th>Nº</th>
            <!-- <th>Status</th> -->
            <!-- <th>Preferential</th> -->
            <th>Nome</th>
            <th>Documento</th>
            <th>Tipo</th>
            <th>Triagem</th>
            <th>Horario</th>
            <th>Atendente</th>
            <th>Horario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in displayedTickets" :key="ticket._id">
            <td>{{ ticket.number }}</td>
            <!-- <td>{{ ticket.status }}</td> -->
            <!-- <td>{{ ticket.preferential }}</td> -->
            <td>{{ ticket.name }}</td>
            <td>{{ ticket.docNumber }}</td>
            <td>{{ ticket.type }}</td>
            <td>{{ ticket.queuedBy }}</td>
            <td>{{ convertDate(ticket.dateQueue) }}</td>
            <td>{{ ticket.servicedBy }}</td>
            <td>{{ convertDate(ticket.dateServiced) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import topbar from "../components/topbar";

import { loadTicketHistory } from "../controllers/ticketController";
import { convertDate } from "../utils";

export default {
  name: "page_ticket_history",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,

      searchTerm: "",
      itemsPerPage: 50,
      itemsPerPageOptions: [10, 50, 100, 250, 500],
      ticketData: [],
    };
  },
  mounted() {
    this.handleLoadTicketHistory();
    this.transitionFade = true;
  },
  computed: {
    displayedTickets() {
      const filteredTickets = this.ticketData.filter((ticket) =>
        Object.values(ticket).some((value) =>
          value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );

      return filteredTickets.slice(0, this.itemsPerPage);
    },
  },
  methods: {
    convertDate(date) {
      return convertDate(date);
    },
    async handleLoadTicketHistory() {
      await loadTicketHistory().then((response) => {
        this.ticketData = response.data.ticket;
        console.log(
          "🚀 ~ file: history.vue:86 ~ awaitloadTicketsInQueue ~ ticketData:",
          this.ticketData
        );
        this.ticketsInQueue = this.ticketData.filter((ticket) => ticket.status === 1).length;
      });
    },
  },
};
</script>

<style scoped>
td:hover {
  transition: all 0.3s ease-out;
  background: rgba(141, 141, 141, 0.596);
  border-radius: 10px;
  font-weight: bold;
}

input,
select {
  border-radius: 5px;
  margin: 5px;
}
</style>
