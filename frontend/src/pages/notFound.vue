<template>
  <div class="not-found">
    <topbar></topbar>
    <span class="title_page">Página não encontrada</span>
    <transition-group>
      <div v-if="transitionFade" class="content">
        <p class="message">
          O endereço <code>{{ route.fullPath }}</code> não existe no sistema.
        </p>
        <button
          type="button"
          class="btn btn-outline-primary"
          @click="router.push({ name: 'index' })">
          Voltar ao início
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import topbar from "@/components/topbar.vue";

defineOptions({
  name: "page_not_found",
});

const router = useRouter();
const route = useRoute();
const transitionFade = ref(false);

onMounted(() => {
  transitionFade.value = true;
});
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.message {
  margin: 10px;
}

.btn {
  font-weight: bold;
  min-width: 300px;
  min-height: 50px;
  margin: 10px;
}
</style>
