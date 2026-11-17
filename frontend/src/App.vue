<template>
  <div id="app">
    <router-view></router-view>
  </div>
  <!-- Avisos (toasts) de todo o sistema: services/notify.js -->
  <Toaster rich-colors close-button position="top-right" :theme="theme" />
  <footer class="navbar small p-1 fixed-bottom">
    <span class="col small px-2">© {{ year }} - Matheus Gonçalves - Todos os direitos reservados.</span>
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
// Ano do rodape: o atual, nao um numero fixo no codigo
const year = new Date().getFullYear()

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
/* Rawline: a fonte do padrao visual gov.br (Raleway com numeros alinhados).
   Arquivos locais: a rede da producao nao alcanca CDNs. Licenca: OFL.txt */
@font-face {
  font-family: "Rawline";
  src: url("./assets/fonts/rawline/rawline-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Rawline";
  src: url("./assets/fonts/rawline/rawline-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Rawline";
  src: url("./assets/fonts/rawline/rawline-600.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Rawline";
  src: url("./assets/fonts/rawline/rawline-700.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Cores do sistema por tema (data-bs-theme no <html>, ver useTheme.js).
   Azul institucional do gov.br nas acoes; o escuro e um cinza confortavel
   para o dia todo e as barras laterais sao a moldura, mais escuras. */
:root,
[data-bs-theme="light"] {
  --qtm-page-bg: #f2f4f7;
  --qtm-page-line: #e8ecf1;
  --qtm-page-line-soft: #e8ecf100;
  --qtm-text: #1b2a3a;
  --qtm-text-muted: #5c6b7a;
  --qtm-surface: #ffffff;
  --qtm-border: #d8dee6;
  --qtm-surface-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
  --qtm-table-head: #eef1f5;
  --qtm-row-hover: #e8eef8;
  --qtm-sidebar-bg: #1d2733;
  --qtm-footer-bg: #18212b;
  --qtm-footer-text: #a7b1bb;
  --qtm-primary: #1351b4;
  --qtm-primary-rgb: 19, 81, 180;
  --qtm-primary-hover: #0f4596;
  --qtm-primary-active: #0c3a80;
  --qtm-on-primary: #ffffff;
  --qtm-preferential: #b42318;
  --qtm-elderly: #1e7a3c;
}

/* :root[...] vence o bloco do Bootstrap (o CSS dele carrega depois deste) */
:root[data-bs-theme="dark"] {
  --qtm-page-bg: #1f2226;
  --qtm-page-line: #262a2f;
  --qtm-page-line-soft: #262a2f00;
  --qtm-text: #dde1e6;
  --qtm-text-muted: #a3acb6;
  --qtm-surface: #2a2e33;
  --qtm-border: #3a4048;
  --qtm-surface-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  --qtm-table-head: #30353b;
  --qtm-row-hover: #343a42;
  --qtm-sidebar-bg: #16181b;
  --qtm-footer-bg: #121416;
  --qtm-footer-text: #9aa4ae;
  /* Azul claro: o azul do tema claro some no cinza escuro (3,5:1) */
  --qtm-primary: #8ab4f8;
  --qtm-primary-rgb: 138, 180, 248;
  --qtm-primary-hover: #a8c7fa;
  --qtm-primary-active: #c2d7fb;
  --qtm-on-primary: #0b1f3f;
  /* Bootstrap: fundo e texto base no mesmo cinza */
  --bs-body-bg: #1f2226;
  --bs-body-color: #dde1e6;
}

/* Fonte e escala (28 / 20 / 16 / 14). html:root vence o :root do Bootstrap;
   vale tambem para o que ele desenha fora do #app (janelas no <body>). */
html:root {
  --qtm-font: "Rawline", "Segoe UI", system-ui, sans-serif;
  --qtm-fs-title: 1.75rem;
  --qtm-fs-heading: 1.25rem;
  --qtm-fs-small: 0.875rem;
  --bs-body-font-family: var(--qtm-font);
  /* Rawline 400 e fina para leitura o dia todo: texto corrido em 500 */
  --bs-body-font-weight: 500;
  --bs-primary: var(--qtm-primary);
  --bs-primary-rgb: var(--qtm-primary-rgb);
  --bs-link-color: var(--qtm-primary);
  --bs-link-color-rgb: var(--qtm-primary-rgb);
  --bs-link-hover-color: var(--qtm-primary-hover);
  --bs-link-hover-color-rgb: var(--qtm-primary-rgb);
}

/* Botoes e campos do Bootstrap no azul do sistema */
/* Botoes em 600: o texto do botao e uma ordem, precisa pesar mais que o corpo */
:root .btn {
  --bs-btn-font-weight: 600;
}

:root .btn-primary {
  --bs-btn-color: var(--qtm-on-primary);
  --bs-btn-bg: var(--qtm-primary);
  --bs-btn-border-color: var(--qtm-primary);
  --bs-btn-hover-color: var(--qtm-on-primary);
  --bs-btn-hover-bg: var(--qtm-primary-hover);
  --bs-btn-hover-border-color: var(--qtm-primary-hover);
  --bs-btn-focus-shadow-rgb: var(--qtm-primary-rgb);
  --bs-btn-active-color: var(--qtm-on-primary);
  --bs-btn-active-bg: var(--qtm-primary-active);
  --bs-btn-active-border-color: var(--qtm-primary-active);
  --bs-btn-disabled-color: var(--qtm-on-primary);
  --bs-btn-disabled-bg: var(--qtm-primary);
  --bs-btn-disabled-border-color: var(--qtm-primary);
}

:root .btn-outline-primary {
  --bs-btn-color: var(--qtm-primary);
  --bs-btn-border-color: var(--qtm-primary);
  --bs-btn-hover-color: var(--qtm-on-primary);
  --bs-btn-hover-bg: var(--qtm-primary);
  --bs-btn-hover-border-color: var(--qtm-primary);
  --bs-btn-focus-shadow-rgb: var(--qtm-primary-rgb);
  --bs-btn-active-color: var(--qtm-on-primary);
  --bs-btn-active-bg: var(--qtm-primary);
  --bs-btn-active-border-color: var(--qtm-primary);
  --bs-btn-disabled-color: var(--qtm-primary);
  --bs-btn-disabled-border-color: var(--qtm-primary);
}

:root .form-control:focus,
:root .form-select:focus,
:root .form-check-input:focus {
  border-color: rgba(var(--qtm-primary-rgb), 0.65);
  box-shadow: 0 0 0 0.25rem rgba(var(--qtm-primary-rgb), 0.25);
}

:root .form-check-input:checked {
  background-color: var(--qtm-primary);
  border-color: var(--qtm-primary);
}

/* Seletor de datas: azul do sistema; no escuro, cores dos campos do Bootstrap
   (:root na frente: o CSS do seletor carrega depois, junto da pagina) */
:root .dp--theme-light,
:root .dp--theme-dark {
  --dp-primary-color: var(--qtm-primary);
  --dp-primary-text-color: var(--qtm-on-primary);
  --dp-font-family: var(--qtm-font);
}

:root .dp--theme-dark {
  --dp-background-color: var(--bs-body-bg);
  --dp-text-color: var(--bs-body-color);
  --dp-border-color: var(--bs-border-color);
  --dp-menu-border-color: var(--bs-border-color);
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
  font-family: var(--qtm-font);
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

/* Cartao: superficie solida com borda fina. Conteudo alinhado a esquerda
   (formularios leem mais rapido assim); so os titulos de pagina centralizam. */
.menu-default,
.row > .menu-default {
  text-align: left;
  background: var(--qtm-surface);
  border: 1px solid var(--qtm-border);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: var(--qtm-surface-shadow);
}

.menu-default h5 {
  font-size: var(--qtm-fs-heading);
  font-weight: 600;
  margin-bottom: 12px;
}

.menu-default .form-label {
  font-size: var(--qtm-fs-small);
  font-weight: 600;
  margin-bottom: 4px;
}

.text-muted-qtm {
  color: var(--qtm-text-muted);
}

.title_page {
  display: block;
  text-align: center;
  font-size: var(--qtm-fs-title);
  font-weight: 700;
  line-height: 1.2;
  margin: 4px 0 20px;
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
