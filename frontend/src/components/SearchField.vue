<template>
  <!-- Busca que filtra enquanto digita: lupa a esquerda, campo no resto -->
  <div class="input-group input-group-sm search-field" :class="{ 'search-field-dark': dark }">
    <span class="input-group-text" aria-hidden="true"><Search :size="15" /></span>
    <input
      :id="id"
      :value="modelValue"
      type="search"
      class="form-control"
      :placeholder="placeholder"
      :aria-label="label || placeholder"
      autocomplete="off"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown.esc="$emit('update:modelValue', '')"
    />
  </div>
</template>

<script setup>
import { Search } from "lucide-vue-next";

defineProps({
  modelValue: { type: String, default: "" },
  id: { type: String, default: undefined },
  placeholder: { type: String, default: "Pesquisar" },
  label: { type: String, default: "" },
  // Na barra lateral (fundo escuro)
  dark: { type: Boolean, default: false },
});
defineEmits(["update:modelValue"]);
</script>

<style scoped>
.search-field .input-group-text {
  background: transparent;
  color: var(--qtm-text-muted);
}

.search-field-dark .input-group-text,
.search-field-dark .form-control {
  background: rgba(255, 255, 255, 0.06);
  border-color: #4a5563;
  color: #e6ebf0;
}

.search-field-dark .input-group-text {
  color: #a7b1bb;
}

.search-field-dark .form-control::placeholder {
  color: #8d97a3;
}

.search-field-dark .form-control:focus {
  background: rgba(255, 255, 255, 0.1);
}
</style>
