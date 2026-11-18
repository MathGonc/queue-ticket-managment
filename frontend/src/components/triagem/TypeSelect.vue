<template>
  <!-- Tipo de atendimento: digita para buscar ou abre a lista inteira (seta).
       So aceita um tipo da lista oficial. -->
  <div class="type-select">
    <div class="input-group">
      <input
        :id="id"
        ref="input"
        v-model="query"
        type="text"
        class="form-control"
        placeholder="Selecione ou digite para buscar"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="`${id}-list`"
        :aria-activedescendant="open && active >= 0 ? `${id}-opt-${active}` : undefined"
        @focus="openList(false)"
        @click="openList(false)"
        @input="openList(true)"
        @keydown="onKeydown"
        @blur="onBlur"
      />
      <button
        type="button"
        class="btn btn-outline-secondary"
        tabindex="-1"
        aria-label="Abrir a lista de tipos"
        @mousedown.prevent="toggle()"
      >
        <ChevronDown :size="16" class="icon" />
      </button>
    </div>
    <ul v-if="open" :id="`${id}-list`" class="list-group type-list" role="listbox">
      <li
        v-for="(t, i) in filtered"
        :id="`${id}-opt-${i}`"
        :key="t"
        class="list-group-item list-group-item-action"
        :class="{ active: i === active, chosen: t === modelValue }"
        role="option"
        :aria-selected="t === modelValue"
        @mousedown.prevent="pick(t)"
      >
        {{ t }}
      </li>
      <li v-if="!filtered.length" class="list-group-item text-muted-qtm">Nenhum tipo encontrado</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";

const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, required: true },
  id: { type: String, required: true },
});
const emit = defineEmits(["update:modelValue"]);

const input = ref(null);
const query = ref(props.modelValue);
const open = ref(false);
const active = ref(-1);
// So filtra depois que a pessoa digita (ao abrir, mostra a lista inteira)
const typing = ref(false);

const plain = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const filtered = computed(() => {
  if (!typing.value || !plain(query.value)) return props.options;
  const words = plain(query.value).split(/\s+/);
  return props.options.filter((t) => words.every((w) => plain(t).includes(w)));
});

watch(() => props.modelValue, (v) => {
  query.value = v;
  typing.value = false;
});
watch(filtered, (list) => {
  active.value = list.length === 1 ? 0 : -1;
});

function openList(fromTyping) {
  typing.value = fromTyping;
  open.value = true;
}

function toggle() {
  if (open.value) open.value = false;
  else {
    input.value?.focus();
    openList(false);
  }
}

function pick(t) {
  emit("update:modelValue", t);
  query.value = t;
  typing.value = false;
  open.value = false;
}

// Saindo do campo: texto igual a um tipo vale; vazio limpa; o resto volta ao anterior
function onBlur() {
  open.value = false;
  if (!typing.value) return;
  const text = plain(query.value);
  if (!text) return pick("");
  const exact = props.options.find((t) => plain(t) === text);
  if (exact) return pick(exact);
  if (filtered.value.length === 1) return pick(filtered.value[0]);
  query.value = props.modelValue;
  typing.value = false;
}

function onKeydown(event) {
  const n = filtered.value.length;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!open.value) return openList(false);
    if (n) active.value = (active.value + 1) % n;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (n) active.value = (active.value - 1 + n) % n;
  } else if (event.key === "Enter" && open.value) {
    // Enter escolhe o tipo destacado (nao envia o formulario)
    event.preventDefault();
    if (active.value >= 0) pick(filtered.value[active.value]);
  } else if (event.key === "Escape") {
    open.value = false;
  }
}
</script>

<style scoped>
.type-select {
  position: relative;
}

.type-list {
  position: absolute;
  z-index: 1050;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  text-align: left;
}

.type-list .list-group-item {
  cursor: pointer;
  padding: 6px 12px;
}

.type-list .list-group-item.chosen:not(.active) {
  font-weight: 600;
}
</style>
