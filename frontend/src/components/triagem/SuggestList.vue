<template>
  <!-- Lista de sugestoes abaixo do campo (CPF ou nome). mousedown.prevent:
       escolhe antes de o campo perder o foco. -->
  <ul v-if="open" :id="id" class="list-group suggest-list" role="listbox">
    <li
      v-for="(item, i) in items"
      :id="`${id}-${i}`"
      :key="item.key"
      class="list-group-item list-group-item-action suggest-item"
      :class="{ active: i === active }"
      role="option"
      :aria-selected="i === active"
      @mousedown.prevent="$emit('pick', item.raw)"
    >
      <div class="suggest-title">
        <span>{{ item.title }}</span>
        <span v-if="item.pendente" class="badge suggest-tag">pendência a resolver</span>
      </div>
      <div class="suggest-subtitle">{{ item.subtitle }}</div>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  // [{ key, title, subtitle, pendente, raw }]
  items: { type: Array, required: true },
  open: { type: Boolean, default: false },
  active: { type: Number, default: -1 },
});
defineEmits(["pick"]);
</script>

<style scoped>
.suggest-list {
  position: absolute;
  z-index: 1050;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  text-align: left;
}

.suggest-item {
  cursor: pointer;
  padding: 6px 12px;
}

.suggest-title {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.suggest-subtitle {
  font-size: var(--qtm-fs-small);
  color: var(--qtm-text-muted);
}

.suggest-item.active .suggest-subtitle {
  color: inherit;
}

.suggest-tag {
  flex-shrink: 0;
  background: #f5c542;
  color: #3d2e00;
  font-weight: 600;
}
</style>
