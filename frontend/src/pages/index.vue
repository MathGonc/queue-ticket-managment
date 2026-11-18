<template>
  <div class="index">
    <topbar></topbar>
    <span class="title_page">Sistema de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="buttons">
          <!-- Icone do lado de fora, a esquerda de cada botao -->
          <div v-for="item in MENU" :key="item.route" class="menu-row">
            <component :is="item.icon" :size="26" class="menu-icon" aria-hidden="true" />
            <button type="button" class="btn btn-outline-primary" @click="router.push({ name: item.route })">
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- Status do sistema (so admin): nao e botao, so informa -->
        <div v-if="isAdmin && status" class="system-status" role="status" aria-live="polite">
          <span class="status-title">Status do sistema</span>
          <span class="badge status-badge">
            <Users :size="14" aria-hidden="true" />
            {{ status.usuariosConectados }} {{ status.usuariosConectados === 1 ? "usuário conectado" : "usuários conectados" }}
          </span>
          <span class="badge status-badge" :class="status.monitor.ok ? 'status-ok' : 'status-off'">
            <Tv :size="14" aria-hidden="true" />
            <template v-if="status.monitor.ok">Monitor OK<template v-if="status.monitor.usuario"> ({{ status.monitor.usuario }})</template></template>
            <template v-else>Monitor não conectado</template>
          </span>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardList, Headset, History, Settings, Tv, Users } from 'lucide-vue-next'
import topbar from '../components/topbar.vue'
import { useAuth } from '@/stores/auth.js'
import { getSystemStatus } from '@/controllers/globalController.js'

const MENU = [
  { route: 'service', label: 'Atendimento', icon: Headset },
  { route: 'sorting', label: 'Triagem', icon: ClipboardList },
  { route: 'monitor', label: 'Monitor', icon: Tv },
  { route: 'history', label: 'Histórico de atendimentos', icon: History },
  { route: 'config', label: 'Configurações', icon: Settings },
]

const router = useRouter()
const auth = useAuth()
const transitionFade = ref(false)

// Status: usuarios conectados e se o monitor (TV) esta aberto ha mais de 1 min.
// Atualiza a cada 15 s enquanto a tela esta aberta.
const isAdmin = computed(() => (auth.userData?.role || 0) >= 3)
const status = ref(null)
let timer = null

async function loadStatus() {
  if (!isAdmin.value) return
  try {
    status.value = await getSystemStatus()
  } catch {
    status.value = null
  }
}

onMounted(() => {
  transitionFade.value = true
  loadStatus()
  timer = setInterval(loadStatus, 15000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.index {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons {
  margin-top: 20px;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 10px 0;
  /* O icone fica fora: o botao continua centralizado na tela */
  margin-left: -40px;
}

.menu-icon {
  width: 26px;
  flex-shrink: 0;
  color: var(--qtm-primary);
}

.btn {
  font-weight: bold;
  display: block;
  min-width: 300px;
  min-height: 50px;
}

.system-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
}

.status-title {
  width: 100%;
  font-size: var(--qtm-fs-small);
  font-weight: 600;
  color: var(--qtm-text-muted);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: var(--qtm-fs-small);
  font-weight: 600;
  background: var(--qtm-surface);
  color: var(--qtm-text);
  border: 1px solid var(--qtm-border);
}

.status-ok {
  border-color: #2e7d32;
  color: #1e6b24;
  background: rgba(46, 125, 50, 0.1);
}

.status-off {
  border-color: #c62828;
  color: #b71c1c;
  background: rgba(198, 40, 40, 0.08);
}

[data-bs-theme="dark"] .status-ok {
  color: #81c784;
}

[data-bs-theme="dark"] .status-off {
  color: #ff8a80;
}
</style>
