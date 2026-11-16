<!-- Mesma marcacao do campo CPF de pages/sorting.vue -->
<template>
  <input
    v-maska
    v-model="docNumber.masked"
    type="text"
    data-maska="###.###.###-##"
  />
</template>

<script setup>
import { reactive } from "vue";
import { vMaska } from "maska/vue";

const docNumber = reactive({ masked: "" });

defineExpose({ docNumber });
</script>
