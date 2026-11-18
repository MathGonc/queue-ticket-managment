<template>
  <div class="row justify-content-center">
    <div class="col-12 col-lg-8">
      <div class="menu-default config-card">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Tipos de atendimento ({{ tipos.length }})</h5>
          <button type="button" class="btn btn-primary btn-sm" @click="editing = true">
            <Pencil :size="14" class="icon" /> Editar tipos
          </button>
        </div>
        <p class="text-muted-qtm small mb-3">
          A lista que aparece na triagem, nesta ordem. Texto que não for de nenhum tipo vai para OUTROS, com o detalhe na anotação.
        </p>
        <ol class="tipos-view">
          <li v-for="t in tipos" :key="t">{{ t }}</li>
        </ol>
      </div>
    </div>
  </div>
  <TiposModal :open="editing" @close="editing = false" />
</template>

<script setup>
import { ref } from "vue";
import { Pencil } from "lucide-vue-next";
import { useTipos } from "@/composables/useTipos.js";
import TiposModal from "@/components/TiposModal.vue";

const { tipos } = useTipos();
const editing = ref(false);
</script>

<style scoped>
.tipos-view {
  columns: 2;
  margin: 0;
  padding-left: 22px;
  text-align: left;
}

.tipos-view li {
  margin-bottom: 4px;
  break-inside: avoid;
}

@media (max-width: 576px) {
  .tipos-view {
    columns: 1;
  }
}
</style>
