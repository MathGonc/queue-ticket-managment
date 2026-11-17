<template>
  <topbar></topbar>
  <div class="config">
    <span class="title_page">Painel de configuração</span>

    <!-- Segmented control (btn-group do Bootstrap com radios) -->
    <div class="d-flex justify-content-center my-3">
      <div class="btn-group config-tabs" role="tablist" aria-label="Seções da configuração">
        <template v-for="tab in TABS" :key="tab.key">
          <input
            :id="`config-tab-${tab.key}`"
            v-model="activeTab"
            type="radio"
            class="btn-check"
            name="config-tab"
            :value="tab.key"
            autocomplete="off"
          />
          <label class="btn btn-outline-primary" :for="`config-tab-${tab.key}`" role="tab" :aria-selected="activeTab === tab.key">
            <component :is="tab.icon" :size="16" class="icon" /> {{ tab.label }}
          </label>
        </template>
      </div>
    </div>

    <div class="container-xxl">
      <KeepAlive>
        <component :is="currentTab.component" :key="currentTab.key" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Monitor as MonitorIcon, ScrollText, Users, FileText } from "lucide-vue-next";
import topbar from "@/components/topbar.vue";
import MonitorTab from "@/components/config/MonitorTab.vue";
import ActivityTab from "@/components/config/ActivityTab.vue";
import UsersTab from "@/components/config/UsersTab.vue";
import LogsTab from "@/components/config/LogsTab.vue";

const TABS = [
  { key: "monitor", label: "Monitor", icon: MonitorIcon, component: MonitorTab },
  { key: "registro", label: "Registro", icon: ScrollText, component: ActivityTab },
  { key: "usuarios", label: "Usuários", icon: Users, component: UsersTab },
  { key: "logs", label: "Logs", icon: FileText, component: LogsTab },
];

const route = useRoute();
const router = useRouter();

// A aba fica no endereco (?aba=registro): da para criar atalho e o F5 mantem a aba
const activeTab = computed({
  get: () => (TABS.some((t) => t.key === route.query.aba) ? route.query.aba : TABS[0].key),
  set: (key) => router.replace({ query: { ...route.query, aba: key } }),
});
const currentTab = computed(() => TABS.find((t) => t.key === activeTab.value));
</script>

<style>
/* Cartoes das abas (usados pelos componentes em components/config) */
.config-card h5 {
  margin-bottom: 12px;
}
</style>

<style scoped>
/* As sidebars ficam recolhidas aqui (45px cada, fixas): o conteudo fica entre elas */
.config {
  padding: 0 60px;
}

.config-tabs .btn {
  min-width: 130px;
  font-weight: bold;
}
</style>
