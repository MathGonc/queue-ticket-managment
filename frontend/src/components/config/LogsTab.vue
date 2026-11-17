<template>
  <div class="row justify-content-center g-3">
    <!-- Backups -->
    <div class="col-12">
      <div class="menu-default config-card">
        <h5>Backup do banco</h5>
        <div v-if="lastBackup" class="alert py-2 mb-2" :class="lastBackup.type === 'backup_concluido' ? 'alert-success' : 'alert-danger'">
          <strong>{{ lastBackup.type === "backup_concluido" ? "Último backup OK" : "Último backup FALHOU" }}</strong>
          em {{ convertDate(lastBackup.date) }}: {{ describeActivity(lastBackup) }}
          <div v-if="lastBackup.details?.local" class="small text-muted">Pasta: {{ lastBackup.details.local }}</div>
        </div>
        <div v-else class="alert alert-warning py-2 mb-2">
          Nenhum backup registrado. Na máquina do sistema, rode <code>infra\standalone\install-backup.cmd</code>.
        </div>
        <table v-if="backups.length > 1" class="table table-sm mb-0 small">
          <tbody>
            <tr v-for="item in backups.slice(1)" :key="item._id" :class="item.type === 'backup_falhou' ? 'table-danger' : ''">
              <td class="text-nowrap text-start">{{ convertDate(item.date) }}</td>
              <td class="text-start">{{ activityLabel(item.type) }}</td>
              <td class="text-start">{{ describeActivity(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Logs tecnicos -->
    <div class="col-12">
      <div class="menu-default config-card">
        <h5>Logs técnicos do backend</h5>
        <div v-if="!logsEnabled" class="alert alert-secondary py-2">
          Logs em arquivo desativados neste servidor (LOG_DIR vazio).
        </div>
        <template v-else>
          <form class="filters" @submit.prevent="loadLogs">
            <div class="input-group input-group-sm">
              <span class="input-group-text">Dia</span>
              <select v-model="selected.file" class="form-select form-select-sm">
                <option v-for="file in files" :key="file.name" :value="file.name">{{ fileLabel(file) }}</option>
              </select>
            </div>
            <div class="input-group input-group-sm">
              <span class="input-group-text">Nível</span>
              <select v-model="selected.level" class="form-select form-select-sm">
                <option value="">Todos</option>
                <option value="warn">Avisos e erros</option>
                <option value="error">Só erros</option>
              </select>
            </div>
            <div class="input-group input-group-sm">
              <span class="input-group-text">Texto</span>
              <input v-model="selected.search" type="text" class="form-control" placeholder="ex.: /login" />
            </div>
            <div class="input-group input-group-sm">
              <span class="input-group-text">Linhas</span>
              <select v-model="selected.limit" class="form-select form-select-sm">
                <option :value="200">200</option>
                <option :value="500">500</option>
                <option :value="2000">2000</option>
              </select>
            </div>
            <button type="submit" class="btn btn-outline-primary btn-sm">
              <RefreshCw :size="14" class="icon" /> Atualizar
            </button>
          </form>

          <div class="table-responsive log-table">
            <table class="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Nível</th>
                  <th>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, index) in logs.items" :key="index">
                  <td class="text-nowrap">{{ formatTime(line.time) }}</td>
                  <td><span class="badge" :class="LEVEL_CLASS[line.level] || 'text-bg-light'">{{ line.level }}</span></td>
                  <td class="text-start">
                    {{ line.msg }}
                    <code v-if="hasDetails(line)" class="d-block text-muted small text-truncate" :title="detailsText(line)">{{ detailsText(line) }}</code>
                  </td>
                </tr>
                <tr v-if="!logs.items.length">
                  <td colspan="3">Nenhuma linha encontrada</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="small text-muted mt-1">
            Mostrando {{ logs.items.length }} linha(s) mais recente(s) de {{ logs.total }} no arquivo. Os arquivos ficam em <code>backend\logs</code> (últimos 30 dias).
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { RefreshCw } from "lucide-vue-next";
import { toast } from "@/services/notify.js";
import { getActivity, getLogFiles, getLogs } from "@/controllers/activityController.js";
import { convertDate } from "@/utils/index.js";
import { activityLabel, describeActivity } from "@/utils/activity.js";

const LEVEL_CLASS = {
  info: "text-bg-info",
  warn: "text-bg-warning",
  error: "text-bg-danger",
  fatal: "text-bg-danger",
  debug: "text-bg-secondary",
};

const backups = ref([]);
const lastBackup = computed(() => backups.value[0] || null);

const logsEnabled = ref(true);
const files = ref([]);
const selected = ref({ file: "", level: "", search: "", limit: 200 });
const logs = ref({ items: [], total: 0 });

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour12: false }) : "";
}

function fileLabel(file) {
  const day = file.name.match(/\d{4}-\d{2}-\d{2}/)?.[0] || file.name;
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y} (${Math.max(Math.round(file.size / 1024), 1)} KB)`;
}

// Log de requisicao: method/url/status/responseTime ja estao na mensagem
const REQUEST_FIELDS = ["method", "url", "status", "responseTime"];
function hasDetails(line) {
  const keys = Object.keys(line.extra || {});
  return keys.length > 0 && !keys.every((k) => REQUEST_FIELDS.includes(k));
}

function detailsText(line) {
  return JSON.stringify(line.extra);
}

async function loadBackups() {
  const response = await getActivity({ type: "backup_concluido,backup_falhou", limit: 10 });
  if (response?.status === 200) backups.value = response.data.items;
}

async function loadFiles() {
  const response = await getLogFiles();
  if (response?.status !== 200) return toast.error("Erro ao listar os logs");
  logsEnabled.value = response.data.enabled;
  files.value = response.data.files;
  if (!selected.value.file && files.value.length) selected.value.file = files.value[0].name;
}

async function loadLogs() {
  if (!selected.value.file) return;
  const response = await getLogs({ ...selected.value });
  if (response?.status === 200) logs.value = response.data;
  else toast.error("Erro ao ler o log");
}

onMounted(async () => {
  loadBackups();
  await loadFiles();
  await loadLogs();
});
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  margin-bottom: 10px;
}

.filters .input-group {
  width: auto;
}

.log-table {
  max-height: 480px;
  overflow-y: auto;
  font-size: 0.85em;
}

.log-table thead th {
  position: sticky;
  top: 0;
  background: var(--qtm-table-head);
}

.log-table code {
  max-width: 700px;
}
</style>
