<template>
  <div id="app">
    <router-view></router-view>
  </div>
  <div class="navbar">
    <nav class="navbar small p-1 fixed-bottom">
      <span class="col small pt-auto px-2"
        >© 2025 - Matheus Gonçalves - Todos os direitos reservados.</span
      >
    </nav>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/stores/auth.js'
import { createSocket } from './socket.js'
import { refreshToken } from '@/controllers/userController.js'

const auth = useAuth()
let refreshInterval = null

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
html,
body {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  opacity: 1;
  background-attachment: fixed;
  background-image: repeating-radial-gradient(
      circle at 0 0,
      transparent 0,
      #ffffff 10px
    ),
    repeating-linear-gradient(#eaeaea55, #eaeaea);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.navbar.fixed-bottom {
  background: #242424;
  color: #838383c7;
  text-align: right;
}

nav {
  /*background-color: #f1f1f1;*/
  padding: 5px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

.menu-default {
  text-align: center;
  background: #e0e0e067;
  border-radius: 10px;
  padding: 20px;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

/*.col > *:not(:last-child) {
    padding-right: 10px;
    padding-block: 10px;
}*/

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

.debug {
  border: 1px solid rgba(247, 1, 1, 0.781);
}
</style>
