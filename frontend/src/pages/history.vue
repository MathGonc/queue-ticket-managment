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
                Atendimentos: {{ pagination.total }} (Completos:
                {{ stats.totalComplete }})
              </div>
              <div v-if="stats.avgWaitTime" class="text-sm-start">
                Tempo de espera médio nesse periodo:
                {{ convertHours(stats.avgWaitTime) }}
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
                    @click.prevent="sortTable(columns.field[index])"
                    :class="{ active: sortColumn == columns.field[index] }"
                  >
                    {{ column }}
                    <vue-feather
                      v-if="sortColumn == columns.field[index]"
                      :type="[ascending ? 'arrow-down' : 'arrow-up']"
                      size="16"
                      class="icon"
                      stroke-width="3"
                    />
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ticket in ticketData" :key="ticket._id">
                <td>{{ ticket.number }}</td>
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
            v-for="page in paginationPages"
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

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useAuth } from "@/stores/auth.js";
import topbar from "@/components/topbar.vue";
import { loadTicketHistory } from "@/controllers/ticketController.js";
import { convertDate, convertHours } from "@/utils/index.js";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import VueFeather from "vue-feather";
import logoUrl from "@/assets/logo.png";

const auth = useAuth();

const transitionFade = ref(false);
const ticketData = ref([]);
const currentPage = ref(1);

const columns = ref({
  display: [
    "Nº",
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
    "name",
    "docNumber",
    "type",
    "queuedBy",
    "dateQueue",
    "servicedBy",
    "dateServiced",
    "timeWaited",
  ],
});

const ascending = ref(false);
const sortColumn = ref("dateQueue");
const dateServiced = ref(null);
const searchTerm = ref("");
const itemsPerPage = ref(50);
const itemsPerPageOptions = ref([10, 50, 100, 250, 500, 2500, 5000, 10000]);

// Server-side pagination and stats
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 1 });
const stats = ref({ totalComplete: 0, avgWaitTime: 0 });

// Debounce timer for search
let searchDebounceTimer = null;

// Computed: pagination pages for display
const paginationPages = computed(() => {
  const total = pagination.value.pages;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  // Show first, last, and pages around current
  const pages = new Set([1, total]);
  for (let i = Math.max(2, currentPage.value - 1); i <= Math.min(total - 1, currentPage.value + 1); i++) {
    pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
});

function changePage(newPage) {
  if (newPage === "prev" && currentPage.value > 1) {
    currentPage.value--;
  } else if (newPage === "next" && currentPage.value < pagination.value.pages) {
    currentPage.value++;
  } else if (
    typeof newPage === "number" &&
    newPage >= 1 &&
    newPage <= pagination.value.pages
  ) {
    currentPage.value = newPage;
  }
}

function sortTable(col) {
  if (sortColumn.value === col) {
    ascending.value = !ascending.value;
  } else {
    ascending.value = true;
    sortColumn.value = col;
  }
  currentPage.value = 1;
  fetchData();
}

async function fetchData() {
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    sortField: sortColumn.value,
    sortOrder: ascending.value ? 'asc' : 'desc',
  };

  if (searchTerm.value) {
    params.search = searchTerm.value;
  }

  if (dateServiced.value && dateServiced.value[0] && dateServiced.value[1]) {
    params.startDate = new Date(dateServiced.value[0]).toISOString();
    params.endDate = new Date(dateServiced.value[1]).toISOString();
  }

  try {
    const response = await loadTicketHistory(params);
    ticketData.value = response.data.ticket;
    pagination.value = response.data.pagination || { page: 1, limit: 50, total: 0, pages: 1 };
    stats.value = response.data.stats || { totalComplete: 0, avgWaitTime: 0 };
  } catch (error) {
    console.error(error);
  }
}

// Watch search term with debounce
watch(searchTerm, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 400);
});

// Watch date, items per page, and page changes
watch([dateServiced, itemsPerPage], () => {
  currentPage.value = 1;
  fetchData();
});

watch(currentPage, () => {
  fetchData();
});

function createPDF() {
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
  // URL absoluta do asset gerado pelo Vite (a janela do PDF nao tem base propria)
  win.document.write(
    `<img src="${new URL(logoUrl, window.location.href).href}">`
  );
  win.document.write(
    "<p style='margin:0;font-family:times new roman,times,serif;font-size:10pt;' > NÚCLEO REGIONAL DA DEFENSORIA PÚBLICA DA UNIÃO NO ESTADO DE MATO GROSSO DO SUL </p> <br> "
  );

  win.document.write("<title>Relátorio de atendimento gerado por: ");
  win.document.write(auth.userData.username);
  win.document.write("</title></div>");
  win.document.write(dTable);
  win.document.write(style);
  win.document.write("</head>");
  win.document.write("<body>");
  win.document.write(sTable);
  win.document.write("</body></html>");

  win.document.close();

  win.print();
}

onMounted(() => {
  fetchData();
  transitionFade.value = true;
});
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
