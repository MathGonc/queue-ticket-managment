<template>
  <!-- Editar os tipos de atendimento (Configuracoes e lapis da triagem) -->
  <Teleport to="body">
    <Transition name="modal-fade" @after-enter="focusFirst">
      <div v-if="open" class="tipos-modal" @keydown.esc="close()">
        <div class="modal-backdrop show"></div>
        <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="tipos-title" @mousedown.self="close()">
          <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form ref="dialogEl" class="modal-content" @submit.prevent="save()">
              <div class="modal-header">
                <div>
                  <h5 id="tipos-title" class="modal-title">Tipos de atendimento</h5>
                  <small class="text-body-secondary">Renomear troca o tipo também nas senhas antigas</small>
                </div>
                <button type="button" class="btn-close" aria-label="Fechar" @click="close()"></button>
              </div>
              <div class="modal-body">
                <ol class="tipos-list">
                  <li v-for="(row, i) in rows" :key="row.key" class="tipos-row">
                    <span class="tipos-pos" aria-hidden="true">{{ i + 1 }}</span>
                    <input
                      v-model="row.value"
                      type="text"
                      class="form-control form-control-sm text-uppercase"
                      maxlength="60"
                      :aria-label="`Tipo ${i + 1}`"
                    />
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="i === 0" :aria-label="`Subir ${row.value}`" @click="move(i, -1)">
                      <ArrowUp :size="14" />
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="i === rows.length - 1" :aria-label="`Descer ${row.value}`" @click="move(i, 1)">
                      <ArrowDown :size="14" />
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" :disabled="rows.length === 1" :aria-label="`Remover ${row.value}`" @click="rows.splice(i, 1)">
                      <Trash2 :size="14" />
                    </button>
                  </li>
                </ol>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="add()">
                  <Plus :size="14" class="icon" /> Novo tipo
                </button>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="close()">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-vue-next";
import { toast } from "@/services/notify.js";
import { saveTiposAtendimento } from "@/controllers/globalController.js";
import { useTipos } from "@/composables/useTipos.js";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close", "saved"]);

const { tipos } = useTipos();
const rows = ref([]);
const saving = ref(false);
const dialogEl = ref(null);
let seq = 0;

const clean = (text) => String(text || "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

// Cada linha lembra o nome original: mudar o texto = renomear
watch(() => props.open, (isOpen) => {
  if (isOpen) rows.value = tipos.value.map((t) => ({ key: ++seq, original: t, value: t }));
});

function focusFirst() {
  dialogEl.value?.querySelector("input")?.focus();
}

function move(i, delta) {
  const list = rows.value;
  [list[i], list[i + delta]] = [list[i + delta], list[i]];
}

function add() {
  rows.value.push({ key: ++seq, original: null, value: "" });
  nextTick(() => {
    const inputs = dialogEl.value?.querySelectorAll(".tipos-row input");
    inputs?.[inputs.length - 1]?.focus();
  });
}

function close() {
  if (!saving.value) emit("close");
}

async function save() {
  const list = rows.value.map((r) => ({ ...r, value: clean(r.value) })).filter((r) => r.value);
  if (!list.length) return toast.error("Deixe pelo menos um tipo");
  if (new Set(list.map((r) => r.value)).size !== list.length) return toast.error("Há tipos repetidos");
  const renomear = list.filter((r) => r.original && r.original !== r.value).map((r) => ({ de: r.original, para: r.value }));
  saving.value = true;
  try {
    tipos.value = await saveTiposAtendimento(list.map((r) => r.value), renomear);
    toast.success("Tipos de atendimento salvos");
    emit("saved");
    emit("close");
  } catch (error) {
    toast.error(error.response?.data?.errors?.[0]?.msg || "Não foi possível salvar os tipos");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.tipos-modal {
  position: relative;
  z-index: 2100;
  text-align: left;
}

.tipos-modal .modal-content {
  font-family: var(--qtm-font);
  color: var(--qtm-text);
  background: var(--qtm-surface);
  border-color: var(--qtm-border);
}

.tipos-list {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
}

.tipos-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.tipos-pos {
  width: 22px;
  flex-shrink: 0;
  text-align: right;
  font-size: var(--qtm-fs-small);
  color: var(--qtm-text-muted);
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
