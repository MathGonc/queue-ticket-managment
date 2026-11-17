<template>
  <div id="app">
    <router-view></router-view>
  </div>
  <!-- Avisos (toasts) de todo o sistema: services/notify.js -->
  <Toaster rich-colors close-button position="top-right" :theme="theme" />
  <footer class="navbar small p-1 fixed-bottom">
    <span class="col small px-2">© 2025 - Matheus Gonçalves - Todos os direitos reservados.</span>
  </footer>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useAuth } from '@/stores/auth.js'
import { useTheme } from '@/composables/useTheme.js'
import { createSocket } from './socket.js'
import { refreshToken } from '@/controllers/userController.js'

const auth = useAuth()
const route = useRoute()
const { theme, setForceLight } = useTheme()
let refreshInterval = null

// O painel da TV e sempre claro
watch(() => route.name, (name) => setForceLight(name === 'monitor'), { immediate: true })

// Renova o token a cada hora enquanto a aba estiver aberta (o token vale 72h).
// Mantem o monitor e os guiches logados indefinidamente, desde que a maquina
// nao fique mais de 72h desligada. O intervalo roda sempre: se o login
// acontecer depois de abrir a pagina, a renovacao tambem passa a valer.
const REFRESH_INTERVAL_MS = 60 * 60 * 1000

onMounted(() => {
  if (auth.token) createSocket()

  refreshInterval = setInterval(() => {
    if (auth.token) refreshToken()
  }, REFRESH_INTERVAL_MS)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style>
/* Cores do sistema por tema (data-bs-theme no <html>, ver useTheme.js).
   O tema escuro e um cinza confortavel para leitura o dia todo; as sidebars
   ficam mais escuras que a pagina para continuarem sendo moldura. */
:root,
[data-bs-theme="light"] {
  --qtm-page-bg: #ffffff;
  --qtm-page-line: #eaeaea;
  --qtm-page-line-soft: #eaeaea55;
  --qtm-text: #2c3e50;
  --qtm-surface: #e0e0e067;
  --qtm-surface-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  --qtm-table-head: #f1f1f1;
  --qtm-sidebar-bg: #2e2e2e;
  --qtm-footer-bg: #242424;
  --qtm-footer-text: #838383c7;
}

/* :root[...] vence o bloco do Bootstrap (o CSS dele carrega depois deste) */
:root[data-bs-theme="dark"] {
  --qtm-page-bg: #1f2226;
  --qtm-page-line: #272b30;
  --qtm-page-line-soft: #272b3055;
  --qtm-text: #dde1e6;
  --qtm-surface: #2a2e33;
  --qtm-surface-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  --qtm-table-head: #30353b;
  --qtm-sidebar-bg: #16181b;
  --qtm-footer-bg: #121416;
  --qtm-footer-text: #8a929b;
  /* Bootstrap: fundo e texto base no mesmo cinza */
  --bs-body-bg: #1f2226;
  --bs-body-color: #dde1e6;
}

/* Seletor de datas no escuro com as cores dos campos do Bootstrap
   (:root na frente: o CSS do seletor carrega depois, junto da pagina) */
:root .dp--theme-dark {
  --dp-background-color: var(--bs-body-bg);
  --dp-text-color: var(--bs-body-color);
  --dp-border-color: var(--bs-border-color);
  --dp-menu-border-color: var(--bs-border-color);
}

/* Mesma fonte do #app para o que o Bootstrap desenha fora dele
   (janelas/modais no <body>) */
html:root {
  --bs-body-font-family: Avenir, Helvetica, Arial, sans-serif;
}

html,
body {
  height: 100%;
  width: 100%;
  background-color: var(--qtm-page-bg);
  opacity: 1;
  background-attachment: fixed;
  background-image: repeating-radial-gradient(
      circle at 0 0,
      transparent 0,
      var(--qtm-page-bg) 10px
    ),
    repeating-linear-gradient(var(--qtm-page-line-soft), var(--qtm-page-line));
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--qtm-text);
  /* espaco para o rodape fixo nao cobrir o fim das paginas */
  padding-bottom: 36px;
}

.navbar.fixed-bottom {
  background: var(--qtm-footer-bg);
  color: var(--qtm-footer-text);
  text-align: right;
}

.menu-default {
  text-align: center;
  background: var(--qtm-surface);
  border-radius: 10px;
  padding: 20px;
  box-shadow: var(--qtm-surface-shadow);
}

.title_page {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
}

/* fade effect! */
.v-enter-active,
.v-leave-active {
  transition: opacity 1.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.icon {
  vertical-align: sub;
}

</style>
