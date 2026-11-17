<template>
  <div class="row justify-content-center g-3">
    <!-- Indicadores -->
    <div class="col-12">
      <div class="menu-default config-card">
        <h5>Indicadores por dia</h5>
        <form class="filters" @submit.prevent="loadStats">
          <div class="input-group input-group-sm">
            <span class="input-group-text">De</span>
            <input v-model="statsPeriod.from" type="date" class="form-control" />
            <span class="input-group-text">até</span>
            <input v-model="statsPeriod.to" type="date" class="form-control" />
          </div>
          <button type="submit" class="btn btn-outline-primary btn-sm">Atualizar</button>
        </form>

        <div class="d-flex flex-wrap justify-content-center gap-2 mb-2">
          <span class="badge text-bg-primary">Emitidas: {{ stats.totals.emitidas }}</span>
          <span class="badge text-bg-success">Atendidas: {{ stats.totals.atendidas }}</span>
          <span class="badge text-bg-warning">Preferenciais: {{ stats.totals.preferenciais }}</span>
          <span class="badge text-bg-secondary">Espera média: {{ formatWait(stats.totals.esperaMediaMs) }}</span>
        </div>

        <div class="table-responsive scroll-table">
          <table class="table table-sm table-hover mb-0">
            <thead>
              <tr>
                <th>Dia</th>
                <th class="text-end">Emitidas</th>
                <th class="text-end">Preferenciais</th>
                <th class="text-end">Atendidas</th>
                <th class="text-end">Espera média</th>
                <th class="text-end">Espera máxima</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in stats.days" :key="day.dia">
                <td class="text-nowrap">{{ formatDay(day.dia) }}</td>
                <td class="text-end">{{ day.emitidas }}</td>
                <td class="text-end">{{ day.preferenciais }}</td>
                <td class="text-end">{{ day.atendidas }}</td>
                <td class="text-end">{{ formatWait(day.esperaMediaMs) }}</td>
                <td class="text-end">{{ formatWait(day.esperaMaxMs) }}</td>
              </tr>
              <tr v-if="!stats.days.length">
                <td colspan="6">Nenhuma senha no período</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Registro de atividades -->
    <div class="col-12">
      <div class="menu-default config-card">
        <h5>Registro de atividades</h5>
        <form class="filters" @submit.prevent="loadActivity(1)">
          <div class="input-group input-group-sm">
            <span class="input-group-text">Atividade</span>
            <select v-model="filter.type" class="form-select form-select-sm">
              <option value="">Todas</option>
              <option v-for="(label, key) in ACTIVITY_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Usuário</span>
            <input v-model="filter.user" type="text" class="form-control" placeholder="nome ou login" />
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">De</span>
            <input v-model="filter.from" type="date" class="form-control" />
            <span class="input-group-text">até</span>
            <input v-model="filter.to" type="date" class="form-control" />
          </div>
          <button type="submit" class="btn btn-outline-primary btn-sm">Filtrar</button>
          <button type="button" class="btn btn-outline-success btn-sm" :disabled="exporting" @click="exportCsv">
            <Download :size="14" class="icon" /> {{ exporting ? "Exportando..." : "Exportar CSV" }}
          </button>
        </form>

        <div class="table-responsive">
          <table class="table table-sm table-hover activity-table mb-2">
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Atividade</th>
                <th>Usuário</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in activity.items" :key="item._id" :class="rowClass(item.type)">
                <td class="text-nowrap">{{ convertDate(item.date) }}</td>
                <td class="text-nowrap">{{ activityLabel(item.type) }}</td>
                <td>{{ item.user || item.login }}</td>
                <td>{{ describeActivity(item) }}</td>
              </tr>
              <tr v-if="!activity.items.length">
                <td colspan="4">Nenhuma atividade encontrada</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex align-items-center justify-content-center gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="activity.pagination.page <= 1" @click="loadActivity(activity.pagination.page - 1)">Anterior</button>
          <span class="small">Página {{ activity.pagination.page }} de {{ activity.pagination.pages }} ({{ activity.pagination.total }} registros)</span>
          <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="activity.pagination.page >= activity.pagination.pages" @click="loadActivity(activity.pagination.page + 1)">Próxima</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Download } from "lucide-vue-next";
import { toast } from "@/services/notify.js";
import { getActivity, getDailyStats } from "@/controllers/activityController.js";
import { convertDate, convertHours } from "@/utils/index.js";
import { ACTIVITY_LABELS, activityLabel, describeActivity } from "@/utils/activity.js";
import { toCsv, downloadCsv } from "@/utils/csv.js";

const EXPORT_LIMIT = 10000;
const PAGE_SIZE = 50;

// Datas no fuso local: "de" no inicio do dia, "ate" no fim
const startOfDay = (day) => new Date(`${day}T00:00:00`).toISOString();
const endOfDay = (day) => new Date(`${day}T23:59:59.999`).toISOString();
const isoDay = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const today = new Date();
const statsPeriod = ref({ from: isoDay(new Date(today.getTime() - 29 * 864e5)), to: isoDay(today) });
const stats = ref({ days: [], totals: { emitidas: 0, atendidas: 0, preferenciais: 0, esperaMediaMs: null } });

const filter = ref({ type: "", user: "", from: "", to: "" });
const activity = ref({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
const exporting = ref(false);

function formatWait(ms) {
  return ms == null ? "-" : convertHours(ms);
}

function formatDay(day) {
  const [y, m, d] = day.split("-");
  const weekday = new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" });
  return `${d}/${m}/${y} (${weekday.replace(".", "")})`;
}

// Destaque visual para o que merece atencao
function rowClass(type) {
  if (["erro_servidor", "backup_falhou", "login_bloqueado", "sinal_recusado"].includes(type)) return "table-danger";
  if (["login_falhou", "painel_desconectado", "senha_excluida", "numeracao_resetada"].includes(type)) return "table-warning";
  return "";
}

function filterParams() {
  const f = filter.value;
  const params = {};
  if (f.type) params.type = f.type;
  if (f.user) params.user = f.user;
  if (f.from) params.from = startOfDay(f.from);
  if (f.to) params.to = endOfDay(f.to);
  return params;
}

async function loadStats() {
  const params = {};
  if (statsPeriod.value.from) params.from = startOfDay(statsPeriod.value.from);
  if (statsPeriod.value.to) params.to = endOfDay(statsPeriod.value.to);
  const response = await getDailyStats(params);
  if (response?.status === 200) stats.value = response.data;
  else toast.error("Erro ao carregar os indicadores");
}

async function loadActivity(page = 1) {
  const response = await getActivity({ ...filterParams(), page, limit: PAGE_SIZE });
  if (response?.status === 200) activity.value = response.data;
  else toast.error("Erro ao carregar o registro de atividades");
}

async function exportCsv() {
  exporting.value = true;
  try {
    const rows = [];
    for (let page = 1; rows.length < EXPORT_LIMIT; page++) {
      const response = await getActivity({ ...filterParams(), page, limit: 500 });
      if (response?.status !== 200) throw new Error("falha ao buscar o registro");
      rows.push(...response.data.items);
      if (page >= response.data.pagination.pages) break;
    }
    const csv = toCsv(rows.slice(0, EXPORT_LIMIT), [
      { label: "Data/hora", value: (a) => convertDate(a.date) },
      { label: "Atividade", value: (a) => activityLabel(a.type) },
      { label: "Usuário", value: (a) => a.user },
      { label: "Login", value: (a) => a.login },
      { label: "Detalhes", value: (a) => describeActivity(a) },
      { label: "IP", value: (a) => a.ip },
    ]);
    downloadCsv(`registro-atividades-${isoDay(new Date())}.csv`, csv);
    if (rows.length > EXPORT_LIMIT) toast.warning(`Exportados os ${EXPORT_LIMIT} registros mais recentes. Use os filtros para o restante.`);
    else toast.success(`${rows.length} registro(s) exportado(s)`);
  } catch {
    toast.error("Erro ao exportar o registro");
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  loadStats();
  loadActivity(1);
});
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}

.filters .input-group {
  width: auto;
}

.scroll-table {
  max-height: 320px;
  overflow-y: auto;
}

.scroll-table thead th {
  position: sticky;
  top: 0;
  background: var(--qtm-table-head);
}

.activity-table td,
.activity-table th {
  font-size: 0.85em;
  text-align: left;
}
</style>
