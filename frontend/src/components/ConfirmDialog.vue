<template>
  <!-- Janela de confirmacao (ex.: chamar de novo uma senha ja atendida) -->
  <Teleport to="body">
    <Transition name="modal-fade" @after-enter="confirmBtn?.focus()">
      <div v-if="open" class="confirm-dialog" @keydown.esc="$emit('cancel')">
        <div class="modal-backdrop show"></div>
        <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.self="$emit('cancel')">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 :id="titleId" class="modal-title">{{ title }}</h5>
                <button type="button" class="btn-close" aria-label="Fechar" @click="$emit('cancel')"></button>
              </div>
              <div class="modal-body">{{ message }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="$emit('cancel')">Cancelar</button>
                <button ref="confirmBtn" type="button" class="btn btn-primary" @click="$emit('confirm')">{{ confirmText }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, useId } from "vue";

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  confirmText: { type: String, default: "Confirmar" },
});
defineEmits(["confirm", "cancel"]);

const titleId = useId();
const confirmBtn = ref(null);
</script>

<style scoped>
.confirm-dialog {
  position: relative;
  z-index: 2100;
  text-align: left;
}

.confirm-dialog .modal-content {
  font-family: var(--qtm-font);
  color: var(--qtm-text);
  background: var(--qtm-surface);
  border-color: var(--qtm-border);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
