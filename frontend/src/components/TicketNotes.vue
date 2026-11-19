<template>
  <!-- Observacoes da senha no cartao da barra lateral: azul para a triagem,
       verde para o atendimento (o mesmo aviso da tela de triagem). Com as
       duas, o seletor a direita alterna entre elas; so aparece a que existe. -->
  <div
    v-if="current"
    class="alert ticket-notes"
    :class="current.alert"
    data-bs-theme="dark"
  >
    <div class="ticket-notes-head">
      <span class="ticket-notes-title">Observações</span>
      <div v-if="notes.length > 1" class="ticket-notes-switch" role="group" aria-label="Observação exibida">
        <button
          v-for="note in notes"
          :key="note.key"
          type="button"
          :class="{ active: note.key === current.key }"
          :aria-pressed="note.key === current.key"
          @click="selected = note.key"
        >
          {{ note.label }}
        </button>
      </div>
      <span v-else class="ticket-notes-single">{{ current.label }}</span>
    </div>
    <div class="ticket-notes-text">{{ current.text }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  ticket: { type: Object, required: true },
});

const notes = computed(() => [
  { key: "triagem", label: "Triagem", alert: "alert-info", text: props.ticket.notaTriagem },
  { key: "atendimento", label: "Atendimento", alert: "alert-success", text: props.ticket.notaAtendimento },
].filter((note) => note.text?.trim()));

// Comeca na triagem; se a escolhida sumir (anotacao apagada), cai na que sobrou
const selected = ref("triagem");
const current = computed(() => notes.value.find((n) => n.key === selected.value) || notes.value[0]);
</script>

<style>
.sidebar .ticket-notes {
  margin: 8px 0 0;
  padding: 6px 10px 8px;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
}

.sidebar .ticket-notes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.sidebar .ticket-notes-title {
  font-weight: 700;
}

/* Seletor Triagem / Atendimento: contorno na cor do aviso, ativo preenchido */
.sidebar .ticket-notes-switch {
  display: inline-flex;
  border: 1px solid currentColor;
  border-radius: 4px;
  overflow: hidden;
}

.sidebar .ticket-notes-switch button {
  padding: 0 7px;
  border: 0;
  background: none;
  color: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  cursor: pointer;
}

.sidebar .ticket-notes-switch button + button {
  border-left: 1px solid currentColor;
}

.sidebar .ticket-notes-switch button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar .ticket-notes-switch button.active {
  background: var(--bs-alert-color);
  color: var(--bs-alert-bg);
}

.sidebar .ticket-notes-switch button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}

.sidebar .ticket-notes-single {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
}

.sidebar .ticket-notes-text {
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
