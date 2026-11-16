<template>
  <!-- VITE_SHOW_LOGO=false oculta o logo (o conteudo da tela sobe) -->
  <div v-if="showLogo" class="topbar">
    <nav>
      <img src="../assets/logo.png" alt="Logo" class="logo" />
    </nav>
  </div>
</template>

<script setup>
import config from "@/config.js";

defineOptions({
  name: "component_topbar",
});

const showLogo = config.showLogo;
</script>

<style></style>
