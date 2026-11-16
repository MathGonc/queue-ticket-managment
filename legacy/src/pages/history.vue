<template>
  <div class="ticket-history">
    <topbar></topbar>
    <span class="title_page">Histórico</span>
    <transition-group>
      <div class="container" v-if="transitionFade">
        <div class="row justify-content-between table-utils">
          <div class="col-auto DatePicker">
            <span class="text-sm-start"><b>Data de atendimento:</b></span>
            <VueDatePicker
              v-model="dateServiced"
              text-input
              range
              multi-calendars
              locale="br"
              select-text="Selecionar"
              cancel-text="Cancelar"
              show-now-button
              now-button-label="Hoje"
              format="dd/MM/yyyy"
            />
            <div id="tab-summary">
              <div v-if="dateServiced" format="dd/MM/yyyy">
                Periodo: {{ convertDate(dateServiced[0]) }} até
                {{ convertDate(dateServiced[1]) }}
              </div>
              <div class="text-sm-start">
                Atendimentos: {{ this.results }} (Completos:
                {{ this.totalServiceComplete }})
              </div>
              <div v-if="this.totalExpectedTime" class="text-sm-start">
                Tempo de espera médio nesse periodo:
                {{
                  convertHours(
                    this.totalExpectedTime / this.totalServiceComplete
                  )
                }}
              </div>
            </div>
          </div>
          <div class="col-auto">
            <div class="input-group">
              <div class="input-group-prepend">
                <input
                  type="text"
                  class="form-control"
                  v-model="searchTerm"
                  placeholder="Procurar"
                />
              </div>
              <select class="custom-select" v-model="itemsPerPage">
                <option v-for="option in itemsPerPageOptions" :key="option">
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-auto">
            <button class="btn btn-primary" @click="createPDF()">
              <vue-feather
                type="airplay"
                size="16"
                class="icon"
                stroke-width="3"
              /><b> Salvar como PDF</b>
            </button>
          </div>
        </div>

        <div id="tab" class="table-container">
          <table class="table table-striped data-table">
            <thead>
              <tr class="text-nowrap">
                <th v-for="(column, index) in columns.display" :key="column">
                  <a
                    href="#"
                    @click="sortTable(columns.field[index])"
                    :class="{ active: sortColumn == columns.field[index] }"
                  >
                    {{ column }}
                    <vue-feather
                      v-if="this.sortColumn == columns.field[index]"
                      :type="[this.ascending ? 'arrow-down' : 'arrow-up']"
                      size="16"
                      class="icon"
                      stroke-width="3"
                    />
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ticket in filterTickets" :key="ticket._id">
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
                <td>
                  <span v-if="ticket.dateServiced">
                    {{
                      convertHours(
                        new Date(ticket.dateServiced) -
                          new Date(ticket.dateQueue)
                      )
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="pagination">
          <li>
            <button class="btn btn-primary btn-sm" @click="changePage('prev')">
              <vue-feather type="arrow-left" size="16" class="icon" />
            </button>
          </li>
          <li
            v-for="page in pages"
            :key="page"
            :class="{ active: currentPage === page }"
          >
            <button class="btn btn-primary btn-sm" @click="changePage(page)">
              {{ page }}
            </button>
          </li>
          <li>
            <button class="btn btn-primary btn-sm" @click="changePage('next')">
              <vue-feather type="arrow-right" size="16" class="icon" />
            </button>
          </li>
        </ul>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { useAuth } from "../stores/auth.js";
import topbar from "../components/topbar.vue";

import { loadTicketHistory } from "../controllers/ticketController";
import { convertDate, convertHours } from "../utils";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import VueFeather from "vue-feather";

export default {
  name: "page_ticket_history",
  components: {
    topbar,
    VueDatePicker,
    "vue-feather": VueFeather,
  },
  data() {
    return {
      transitionFade: false,
      ticketData: [],

      columns: {
        display: [
          "Nº",
          // "Status",
          // "Preferential",
          "Nome",
          "Documento",
          "Tipo",
          "Triagem",
          "Horario",
          "Atendente",
          "Horario",
          "Espera",
        ],
        field: [
          "number",
          // "status",
          // "preferential",
          "name",
          "docNumber",
          "type",
          "queuedBy",
          "dateQueue",
          "servicedBy",
          "dateServiced",
          "timeWaited", //no use
        ],
      },
      ascending: false,
      sortColumn: "dateQueue",
      dateServiced: null,
      searchTerm: "",
      itemsPerPage: 50,
      itemsPerPageOptions: [10, 50, 100, 250, 500, 2500, 5000, 10000],
      totalExpectedTime: 0,
      totalServiceComplete: 0,
      results: 0,
    };
  },
  setup() {
    const auth = useAuth();
    return {
      auth,
    };
  },
  mounted() {
    this.handleLoadTicketHistory();

    //Comment to show queued tickets
    // const startDate = new Date(new Date().setDate(new Date().getDate() - 365));
    // const endDate = new Date(new Date().setDate(startDate.getDate()));
    // this.dateServiced = [startDate, endDate];

    this.transitionFade = true;
  },
  computed: {
    pages() {
      return Math.ceil(this.ticketData.length / this.itemsPerPage);
    },
    filterTickets() {
      const searchedTickets = this.ticketData.filter((ticket) => {
        return Object.values(ticket).some((value) => {
          this.totalServiceComplete = 0; // reset atendimentos completos
          this.totalExpectedTime = 0;
          this.results = 0;

          const searchTermMatch = value
            .toString()
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase());

          if (this.dateServiced) {
            const isDateInRange =
              new Date(this.dateServiced[0]) <= new Date(ticket.dateServiced) &&
              new Date(this.dateServiced[1]) >= new Date(ticket.dateServiced);
            return searchTermMatch && isDateInRange;
          }
          return searchTermMatch;
        });
      });

      const sortedTickets = [...searchedTickets];
      if (this.sortColumn) {
        sortedTickets.sort((a, b) => {
          if (a[this.sortColumn] > b[this.sortColumn]) {
            return this.ascending ? 1 : -1;
          } else if (a[this.sortColumn] < b[this.sortColumn]) {
            return this.ascending ? -1 : 1;
          }
          return 0;
        });
      }

      const filteredTickets = sortedTickets.map((row, index) => {
        this.results = sortedTickets.length;
        if (sortedTickets[index].dateServiced) {
          this.totalServiceComplete++;
          this.totalExpectedTime +=
            new Date(sortedTickets[index].dateServiced).getTime() -
            new Date(sortedTickets[index].dateQueue).getTime();

          console.log(this.totalExpectedTime);
        }

        return {
          ...row,
          id: index + 1,
          isVisible:
            index >= (this.currentPage - 1) * this.itemsPerPage &&
            index < this.currentPage * this.itemsPerPage,
        };
      });
      return filteredTickets.slice(0, this.itemsPerPage);
    },
  },
  methods: {
    convertDate(date) {
      return convertDate(date);
    },
    convertHours(ms) {
      return convertHours(ms);
    },
    handleitemsPerPageChange() {
      this.currentPage = 1;
    },
    changePage(newPage) {
      if (newPage === "prev" && this.currentPage > 1) {
        this.currentPage--;
      } else if (newPage === "next" && this.currentPage < this.pages) {
        this.currentPage++;
      } else if (
        typeof newPage === "number" &&
        newPage >= 1 &&
        newPage <= this.pages
      ) {
        this.currentPage = newPage;
      }
      this.limitPagination();
    },
    limitPagination() {
      // Implemente sua lógica de limitação de paginação aqui
    },
    sortTable(col) {
      if (this.sortColumn === col) {
        this.ascending = !this.ascending;
      } else {
        this.ascending = true;
        this.sortColumn = col;
      }
    },
    async handleLoadTicketHistory() {
      await loadTicketHistory().then((response) => {
        this.ticketData = response.data.ticket;
        // this.ticketsInQueue = this.ticketData.filter((ticket) => ticket.status === 1).length;
      });
    },
    createPDF() {
      var sTable = document.getElementById("tab").innerHTML;
      var dTable = document.getElementById("tab-summary").innerHTML;

      var style = "<style>";
      style = style + "table {width: 100%;font: 17px Calibri;}";
      style =
        style +
        "table, th, td {border: solid 1px #DDD; border-collapse: collapse;";
      style = style + "padding: 2px 3px;text-align: center;}";
      style = style + "</style>";

      var win = window.open("", "", "height=700,width=700");

      win.document.write("<html><head>");
      win.document.write("<div align='center'>");
      win.document.write(
        '<img src="http://172.30.24.32:8080/img/logo.c8355536.png">'
      );
      win.document.write(
        "<p style='margin:0;font-family:times new roman,times,serif;font-size:10pt;' > NÚCLEO REGIONAL DA DEFENSORIA PÚBLICA DA UNIÃO NO ESTADO DE MATO GROSSO DO SUL </p> <br> "
      );

      win.document.write("<title>Relátorio de atendimento gerado por: ");
      win.document.write(this.auth.userData.username);
      win.document.write("</title></div>");
      win.document.write(dTable);
      win.document.write(style);
      win.document.write("</head>");
      win.document.write("<body>");
      win.document.write(sTable);
      win.document.write("</body></html>");

      win.document.close();

      win.print();
    },
  },
};
</script>

<style scoped>
.pagination .btn {
  margin-inline: 1px;
}
.table-utils {
  align-items: center;
}
.table-utils .DatePicker {
  background-color: #88888821;
  padding: 5px 10px;
  border-radius: 5px;
}

.table-container {
  margin-top: 20px;
}

td:hover,
th:hover {
  transition: background 0.3s ease-out;
  background: rgba(141, 141, 141, 0.596);
  border-radius: 10px;
  font-weight: bold;
}

input,
select {
  border-radius: 5px;
}

a {
  font-weight: normal;
  text-decoration: none;
  color: inherit;
}

a.active {
  font-weight: bold;
  text-decoration: none;
}
</style>
