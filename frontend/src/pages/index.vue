<template>
  <div class="index">
    <topbar></topbar>
    <span class="title_page">Sistema de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="buttons">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="router.push({ name: 'service' })">
            Atendimento
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="router.push({ name: 'sorting' })">
            Triagem
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="router.push({ name: 'monitor' })">
            Monitor
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="router.push({ name: 'history' })">
            Histórico de atendimentos
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="router.push({ name: 'config' })">
            Configurações
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import topbar from '../components/topbar.vue'

const router = useRouter()
const transitionFade = ref(false)

onMounted(() => {
  transitionFade.value = true
})
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

.btn {
  font-weight: bold;
  display: block;
  min-width: 300px;
  min-height: 50px;
  margin: 10px;
}
</style>
