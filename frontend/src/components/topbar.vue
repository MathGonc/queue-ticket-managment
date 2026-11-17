<template>
  <!-- Logo importado em Configuracoes > Empresa (sem logo, o topo fica vazio) -->
  <div v-if="logoUrl" class="topbar">
    <nav>
      <img :src="logoUrl" :alt="companyName || 'Logo'" class="logo" :class="{ 'logo-large': large }" />
    </nav>
  </div>
</template>

<script setup>
import { useBranding } from "@/composables/useBranding.js";

defineOptions({
  name: "component_topbar",
});

// Grande so no login e no painel da TV; nas telas de trabalho o logo fica
// compacto para sobrar altura (notebooks de 768px)
defineProps({ large: { type: Boolean, default: false } });

const { companyName, logoUrl } = useBranding();
</script>

<style scoped>
/* Antes vinha de uma regra global "nav { padding: 5px }" no App.vue */
nav {
  padding: 5px;
}

/* Qualquer logo importado cabe no topo sem empurrar a tela */
.logo {
  max-height: 56px;
  max-width: min(200px, 50vw);
  object-fit: contain;
}

.logo-large {
  max-height: 140px;
  max-width: min(320px, 70vw);
}

/* Tema escuro: logos costumam ter texto escuro em fundo transparente;
   uma placa clara mantem o logo legivel sem recolorir a marca */
[data-bs-theme="dark"] .logo {
  background: #eef0f2;
  padding: 3px 8px;
  border-radius: 6px;
}

[data-bs-theme="dark"] .logo-large {
  padding: 6px 14px;
  border-radius: 10px;
}
</style>
