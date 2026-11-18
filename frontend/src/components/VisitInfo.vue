<template>
  <!-- (i) com as visitas da pessoa: abre ao passar o mouse, no foco do
       teclado ou no clique (o clique fixa aberto ate clicar fora ou Esc) -->
  <span class="visit-info" @mouseenter="show()" @mouseleave="hide()">
    <button
      ref="button"
      type="button"
      class="visit-info-btn"
      :aria-label="label"
      :aria-expanded="open"
      :aria-describedby="open ? id : undefined"
      @click.stop="toggle()"
      @focus="show()"
      @blur="hide()"
      @keydown.esc="close()"
    >
      <Info :size="size" aria-hidden="true" />
    </button>
    <Teleport to="body">
      <div v-if="open" :id="id" ref="box" class="visit-info-box" role="tooltip" :style="position">
        {{ text }}
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, nextTick, useId, onBeforeUnmount } from "vue";
import { Info } from "lucide-vue-next";

defineProps({
  text: { type: String, required: true },
  label: { type: String, default: "Visitas e anotações" },
  size: { type: Number, default: 16 },
});

const id = useId();
const button = ref(null);
const box = ref(null);
const open = ref(false);
const pinned = ref(false);
const position = ref({});

// Ouvintes da janela so enquanto aberto (o historico pode ter milhares de (i))
function listen(on) {
  const method = on ? "addEventListener" : "removeEventListener";
  document[method]("click", onOutside);
  window[method]("scroll", close, true);
}

// Fixo na janela: a barra lateral corta o que passa da borda (overflow)
async function place() {
  if (!open.value) listen(true);
  open.value = true;
  await nextTick();
  if (!button.value || !box.value) return;
  const r = button.value.getBoundingClientRect();
  const w = box.value.offsetWidth;
  const h = box.value.offsetHeight;
  const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
  const below = r.bottom + 6;
  const top = below + h > window.innerHeight - 8 ? r.top - h - 6 : below;
  position.value = { left: `${left}px`, top: `${top}px` };
}

function show() {
  if (!open.value) place();
}

function close() {
  pinned.value = false;
  if (open.value) listen(false);
  open.value = false;
}

function hide() {
  if (!pinned.value) close();
}

function toggle() {
  if (pinned.value) return close();
  pinned.value = true;
  place();
}

function onOutside() {
  if (pinned.value) close();
}

onBeforeUnmount(close);
</script>

<style>
.visit-info {
  display: inline-flex;
  vertical-align: middle;
}

.visit-info-btn {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  opacity: 0.75;
  cursor: pointer;
}

.visit-info-btn:hover,
.visit-info-btn:focus-visible,
.visit-info-btn[aria-expanded="true"] {
  opacity: 1;
}

.visit-info-btn:focus-visible {
  outline: 2px solid var(--qtm-primary);
  outline-offset: 1px;
}

/* No <body> (Teleport): mesmo visual nos dois temas */
.visit-info-box {
  position: fixed;
  z-index: 2000;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #1b2a3a;
  color: #fff;
  font-family: var(--qtm-font);
  font-size: var(--qtm-fs-small);
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  /* Uma linha por informacao (visitas, anotacao da triagem, do atendimento) */
  white-space: pre-line;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

[data-bs-theme="dark"] .visit-info-box {
  background: #e6ebf0;
  color: #1b2a3a;
}
</style>
