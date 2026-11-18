<template>
  <!-- Pendencias do cadastro: aparece acima do formulario e trava a emissao
       ate a triagem confirmar. Tipos:
       - escolher-cpf: o CPF tem 2+ cadastros -> escolher o nome certo (ou outro)
       - escolher-nome: Sem CPF e o nome ja existe -> escolher ou "pessoa nova"
       - corrigir: CPF invalido ou nome a confirmar -> nome + CPF valido/Sem CPF -->
  <section class="pending-card" aria-labelledby="pending-title">
    <h2 id="pending-title" class="pending-title">
      <TriangleAlert :size="18" class="icon" aria-hidden="true" /> Para resolver antes da triagem
    </h2>
    <ul class="pending-reasons">
      <li v-for="motivo in pending.motivos" :key="motivo">{{ motivo }}</li>
    </ul>

    <div v-if="pending.escolhas?.length" class="list-group pending-options mb-3" role="radiogroup" aria-labelledby="pending-title">
      <label v-for="c in pending.escolhas" :key="c._id" class="list-group-item pending-option" :class="{ chosen: choice === c._id }">
        <input v-model="choice" type="radio" class="form-check-input" name="pending-choice" :value="c._id" />
        <span>
          <span class="option-title">{{ c.nome }}</span>
          <span class="option-sub">{{ optionSubtitle(c) }}</span>
        </span>
      </label>
      <label v-if="pending.tipo === 'escolher-cpf'" class="list-group-item pending-option" :class="{ chosen: choice === 'outro' }">
        <input v-model="choice" type="radio" class="form-check-input" name="pending-choice" value="outro" />
        <span class="option-title">Outro nome</span>
      </label>
      <label v-if="pending.tipo === 'escolher-nome'" class="list-group-item pending-option" :class="{ chosen: choice === 'nova' }">
        <input v-model="choice" type="radio" class="form-check-input" name="pending-choice" value="nova" />
        <span>
          <span class="option-title">Pessoa nova</span>
          <span class="option-sub">Outro cadastro com este nome</span>
        </span>
      </label>
    </div>

    <template v-if="showName">
      <label class="form-label" for="pending-name">Nome correto</label>
      <input id="pending-name" v-model="name" type="text" class="form-control text-uppercase mb-3" maxlength="50" />
    </template>

    <template v-if="pending.tipo === 'corrigir'">
      <label class="form-label" for="pending-cpf">CPF</label>
      <div class="input-group has-validation mb-3">
        <input
          id="pending-cpf"
          v-model="cpfMasked"
          v-maska
          type="text"
          class="form-control"
          :class="{ 'is-invalid': cpfError }"
          inputmode="numeric"
          data-maska="###.###.###-##"
          :disabled="noCpf"
          :placeholder="noCpf ? 'Sem CPF' : ''"
          aria-describedby="pending-cpf-error"
        />
        <button type="button" class="btn" :class="noCpf ? 'btn-secondary' : 'btn-outline-secondary'" :aria-pressed="noCpf" @click="toggleNoCpf()">
          Sem CPF
        </button>
        <div id="pending-cpf-error" class="invalid-feedback">{{ cpfError }}</div>
      </div>
    </template>

    <div class="d-flex gap-2">
      <button type="button" class="btn btn-primary" :disabled="busy" @click="confirm()">Confirmar</button>
      <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="$emit('cancel')">Cancelar</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { vMaska } from "maska/vue";
import { TriangleAlert } from "lucide-vue-next";
import { toast } from "@/services/notify.js";
import { onlyDigits, isValidCpf, formatCpf } from "@/utils/index.js";

const props = defineProps({
  // { tipo, motivos: [], escolhas?: [resumo], pessoa?: resumo }
  pending: { type: Object, required: true },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(["confirm", "cancel"]);

const choice = ref(null);
const name = ref("");
const cpfMasked = ref("");
const noCpf = ref(false);
const tried = ref(false);

// Reabre limpo a cada nova pendencia
watch(() => props.pending, (p) => {
  tried.value = false;
  noCpf.value = false;
  choice.value = p.tipo === "escolher-cpf" ? p.escolhas?.[0]?._id ?? null : null;
  name.value = p.tipo === "corrigir" ? p.pessoa?.nome || "" : "";
  cpfMasked.value = p.tipo === "corrigir" ? formatCpf(p.pessoa?.cpf || "") : "";
}, { immediate: true });

const showName = computed(() => props.pending.tipo === "corrigir" || choice.value === "outro");

const cpfError = computed(() => {
  if (props.pending.tipo !== "corrigir" || noCpf.value || !tried.value) return "";
  const digits = onlyDigits(cpfMasked.value);
  if (!digits) return "Digite o CPF ou marque “Sem CPF”";
  return isValidCpf(digits) ? "" : "CPF inválido: confira os números";
});

function toggleNoCpf() {
  noCpf.value = !noCpf.value;
  if (noCpf.value) cpfMasked.value = "";
}

function optionSubtitle(c) {
  const parts = [c.cpf ? formatCpf(c.cpf) : "Sem CPF", `${c.visitas} visita${c.visitas === 1 ? "" : "s"}`];
  if (c.ultima) parts.push(`última em ${new Date(c.ultima.data).toLocaleDateString("pt-BR")}`);
  return parts.join(" · ");
}

function confirm() {
  tried.value = true;
  if (props.pending.escolhas?.length && !choice.value) return toast.error("Escolha uma das opções");
  if (showName.value && !name.value.trim()) return toast.error("Digite o nome");
  if (cpfError.value) return toast.error(cpfError.value);
  const chosen = props.pending.escolhas?.find((c) => c._id === choice.value) || null;
  emit("confirm", {
    choice: choice.value,
    chosen,
    nome: showName.value ? name.value.trim() : chosen?.nome || "",
    cpf: noCpf.value ? "" : onlyDigits(cpfMasked.value),
    semCpf: noCpf.value,
  });
}
</script>

<style scoped>
.pending-card {
  text-align: left;
  border: 2px solid #e0a800;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background: var(--qtm-surface);
}

.pending-title {
  font-size: var(--qtm-fs-heading);
  font-weight: 700;
  margin-bottom: 8px;
}

.pending-reasons {
  padding-left: 20px;
  margin-bottom: 12px;
  font-size: var(--qtm-fs-small);
}

.pending-option {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
}

.pending-option .form-check-input {
  flex-shrink: 0;
  margin-top: 4px;
}

.pending-option.chosen {
  background: rgba(var(--qtm-primary-rgb), 0.1);
  border-color: rgba(var(--qtm-primary-rgb), 0.45);
}

.option-title {
  display: block;
  font-weight: 600;
}

.option-sub {
  display: block;
  font-size: var(--qtm-fs-small);
  color: var(--qtm-text-muted);
}
</style>
