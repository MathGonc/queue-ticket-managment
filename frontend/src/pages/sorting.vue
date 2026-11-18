<template>
  <div class="sorting">
    <topbar></topbar>
    <span class="title_page">Painel de triagem</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto sorting-col">
              <!-- Pendencias do cadastro: resolvidas antes de emitir a senha -->
              <PendingBlock
                v-if="pending"
                :pending="pending"
                :busy="resolving"
                @confirm="onPendingConfirm"
                @cancel="clearPerson()"
              />

              <div class="menu-default sorting-card" :class="{ 'is-waiting': pending }">
                <form @submit.prevent="handleRegisterTicket()">
                  <!-- Com uma pendencia aberta, o formulario espera: so volta depois
                       de Confirmar ou Cancelar no bloco acima -->
                  <fieldset :disabled="!!pending">
                  <!-- ===== Dados da pessoa: CPF, nome e nascimento ===== -->
                  <!-- CPF primeiro: com ele a pessoa vem do cadastro -->
                  <label class="form-label" for="sort-cpf">CPF <span class="required-mark" aria-hidden="true">*</span></label>
                  <div class="suggest-wrap mb-3">
                    <!-- Obrigatorio: CPF valido ou "Sem CPF" -->
                    <div class="input-group has-validation">
                      <input
                        id="sort-cpf"
                        ref="cpfInput"
                        v-model="cpfMasked"
                        v-maska
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': cpfError }"
                        maxlength="18"
                        inputmode="numeric"
                        autocomplete="off"
                        data-maska="###.###.###-##"
                        :disabled="noCpf || (locked && !editing.cpf)"
                        :placeholder="noCpf ? 'Sem CPF' : ''"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-required="true"
                        :aria-expanded="cpfSugOpen"
                        aria-controls="cpf-suggest"
                        :aria-activedescendant="cpfSugActive >= 0 ? `cpf-suggest-${cpfSugActive}` : undefined"
                        :aria-invalid="!!cpfError"
                        aria-describedby="sort-cpf-error"
                        @keydown="cpfKeydown($event, selectPerson)"
                        @blur="onCpfBlur()"
                      />
                      <button
                        type="button"
                        class="btn"
                        :class="noCpf ? 'btn-secondary' : 'btn-outline-secondary'"
                        :aria-pressed="noCpf"
                        :disabled="locked && !editing.cpf"
                        @click="toggleNoCpf()"
                      >
                        Sem CPF
                      </button>
                      <!-- Pessoa escolhida: lapis edita o dado; "x" troca a pessoa -->
                      <template v-if="locked">
                        <button
                          type="button"
                          class="btn"
                          :class="editing.cpf ? 'btn-secondary' : 'btn-outline-secondary'"
                          :aria-pressed="editing.cpf"
                          :title="editing.cpf ? 'Desfazer a edição do CPF' : 'Editar o CPF'"
                          :aria-label="editing.cpf ? 'Desfazer a edição do CPF' : 'Editar o CPF'"
                          @click="toggleEdit('cpf')"
                        >
                          <Pencil :size="15" class="icon" />
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-secondary"
                          title="Trocar a pessoa"
                          aria-label="Trocar a pessoa"
                          @click="clearPerson()"
                        >
                          <X :size="16" class="icon" />
                        </button>
                      </template>
                      <div id="sort-cpf-error" class="invalid-feedback">{{ cpfError }}</div>
                    </div>
                    <SuggestList id="cpf-suggest" :items="cpfItems" :open="cpfSugOpen" :active="cpfSugActive" @pick="selectPerson" />
                  </div>

                  <!-- Avisos do cadastro: duplicidade no dia (amarelo) e visitas (azul) -->
                  <div v-if="sameDayNotice" class="alert alert-warning notice" role="status">
                    <TriangleAlert :size="16" class="icon" aria-hidden="true" /> {{ sameDayNotice }}
                  </div>
                  <div v-if="visitNotice" class="alert alert-info notice" role="status">
                    <Info :size="16" class="icon" aria-hidden="true" /> {{ visitNotice }}
                  </div>

                  <label class="form-label" for="sort-name">Nome <span class="required-mark" aria-hidden="true">*</span></label>
                  <div class="suggest-wrap mb-3">
                    <div class="input-group">
                      <input
                        id="sort-name"
                        ref="nameInput"
                        v-model="nome"
                        type="text"
                        class="form-control text-uppercase"
                        maxlength="50"
                        autocomplete="off"
                        :disabled="locked && !editing.nome"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-required="true"
                        :aria-expanded="nameSugOpen"
                        aria-controls="name-suggest"
                        :aria-activedescendant="nameSugActive >= 0 ? `name-suggest-${nameSugActive}` : undefined"
                        @keydown="nameKeydown($event, selectPerson)"
                        @blur="onNameBlur()"
                      />
                      <template v-if="locked">
                        <button
                          type="button"
                          class="btn"
                          :class="editing.nome ? 'btn-secondary' : 'btn-outline-secondary'"
                          :aria-pressed="editing.nome"
                          :title="editing.nome ? 'Desfazer a edição do nome' : 'Editar o nome'"
                          :aria-label="editing.nome ? 'Desfazer a edição do nome' : 'Editar o nome'"
                          @click="toggleEdit('nome')"
                        >
                          <Pencil :size="15" class="icon" />
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-secondary"
                          title="Trocar a pessoa"
                          aria-label="Trocar a pessoa"
                          @click="clearPerson()"
                        >
                          <X :size="16" class="icon" />
                        </button>
                      </template>
                    </div>
                    <SuggestList id="name-suggest" :items="nameItems" :open="nameSugOpen" :active="nameSugActive" @pick="selectPerson" />
                  </div>

                  <label class="form-label" for="sort-birth">Data de nascimento</label>
                  <div class="DatePicker mb-3">
                    <VueDatePicker
                      v-model="assistedAge"
                      :dark="isDark"
                      :text-input="{ format: DATE_FORMAT, maskFormat: DATE_MASK }"
                      :locale="ptBR"
                      :formats="{ input: DATE_FORMAT, weekDay: WEEKDAY_FORMAT }"
                      :action-row="{ selectBtnLabel: 'Selecionar', cancelBtnLabel: 'Cancelar' }"
                      :input-attrs="{ id: 'sort-birth' }"
                      :disabled="!!pending"
                    />
                  </div>

                  <!-- Cadastro ja existente com dado alterado: confirma antes de seguir -->
                  <div v-if="needsConfirm" class="confirm-data" role="status">
                    <div class="confirm-text">Dados do cadastro alterados: confirme antes de continuar.</div>
                    <div v-if="editWarning" class="confirm-warning">{{ editWarning }}</div>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-primary btn-sm" :disabled="savingData" @click="confirmData()">Confirmar dados</button>
                      <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="savingData" @click="undoEdits()">Desfazer</button>
                    </div>
                  </div>

                  <hr class="section-divider" />

                  <!-- ===== Atendimento: tipo, anotacao e emissao ===== -->
                  <fieldset class="attendance" :disabled="needsConfirm">
                  <div class="label-row">
                    <label class="form-label" for="sort-type">Tipo de atendimento</label>
                    <!-- Admin: atalho para editar a lista (a mesma janela de Configuracoes) -->
                    <button
                      v-if="isAdmin"
                      type="button"
                      class="btn btn-link btn-sm p-0 edit-types"
                      title="Editar os tipos de atendimento"
                      aria-label="Editar os tipos de atendimento"
                      @click="editingTipos = true"
                    >
                      <Pencil :size="14" class="icon" />
                    </button>
                  </div>
                  <TypeSelect id="sort-type" v-model="tipo" :options="tiposList" class="mb-3" />

                  <label class="form-label" for="sort-note">Anotações da triagem</label>
                  <textarea id="sort-note" v-model="notaTriagem" class="form-control mb-3" rows="2" maxlength="1000"></textarea>

                  <div class="form-check form-switch mb-3">
                    <input
                      id="sort-preferential"
                      v-model="preferentialBool"
                      class="form-check-input"
                      type="checkbox"
                      :disabled="calculateAge(assistedAge) >= 60"
                    />
                    <label class="form-check-label" for="sort-preferential">Preferencial</label>
                    <!-- Ordem de preferencia: 80+ >>> Preferencial (gravidas, 60+, crianças de colo, etc...) >>>> Sem preferencia -->
                    <!-- Dentro desses 3, ordenar por ordem de chegada -->
                  </div>
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="buttonDisabled || !!pending || needsConfirm"
                  >
                    Cadastrar senha {{ ticketGlobalData.nextToQueue }}
                  </button>
                  </fieldset>
                  </fieldset>
                  <div v-if="pending" class="form-text text-center mt-2">Confirme ou cancele a pendência acima para continuar</div>
                </form>
                <TiposModal :open="editingTipos" @close="editingTipos = false" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { toast } from "@/services/notify.js";
import { publicSocket, createSocket } from "@/socket.js";
import { insertTicket } from "@/controllers/ticketController.js";
import { getSugestoes, getTriagem, resolverCadastro } from "@/controllers/assistidoController.js";
import {
  getGlobalTicketData,
  updateGlobalTicketData,
} from "@/controllers/globalController.js";
import { vMaska } from "maska/vue";
import { Info, Pencil, TriangleAlert, X } from "lucide-vue-next";
import { useAuth } from "@/stores/auth.js";
import { useSuggest } from "@/composables/useSuggest.js";
import { calculateAge, onlyDigits, isValidCpf, formatCpf, toDateOnly, fromDateOnly, visitText } from "@/utils/index.js";
import { useTipos } from "@/composables/useTipos.js";
import TiposModal from "@/components/TiposModal.vue";
import topbar from "@/components/topbar.vue";
import SuggestList from "@/components/triagem/SuggestList.vue";
import PendingBlock from "@/components/triagem/PendingBlock.vue";
import TypeSelect from "@/components/triagem/TypeSelect.vue";
import config from "@/config.js";

import { VueDatePicker } from "@vuepic/vue-datepicker";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/composables/useTheme.js";
import "@vuepic/vue-datepicker/dist/main.css";

// Formato das datas no seletor (exibicao e digitacao)
const DATE_FORMAT = "dd/MM/yyyy";
// Dias da semana com 1 letra (D S T Q Q S S), como nos calendarios brasileiros
const WEEKDAY_FORMAT = "EEEEE";
// Digitando so numeros ("03031950") as barras entram sozinhas: 03/03/1950
const DATE_MASK = "DD/MM/YYYY";
const { isDark } = useTheme();

defineOptions({
  name: "page_sorting",
});

const auth = useAuth();

// Tipos de atendimento (lista do banco); admin edita pelo lapis
const { tipos: tiposList } = useTipos();
const isAdmin = computed(() => (auth.userData?.role || 0) >= 3);
const editingTipos = ref(false);

// Reactive state
const transitionFade = ref(false);
const buttonDisabled = ref(false);
const preferentialBool = ref(false);
const assistedAge = ref(null);
const ticketGlobalData = ref({});
const tipo = ref("");
const notaTriagem = ref("");
const inputTicket = reactive({ preferential: 0 });

// Nomes sempre em maiusculas (o backend tambem padroniza)
const upper = (text) => String(text || "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

// ---------- Pessoa
// person: cadastro escolhido (pela sugestao, pelo CPF ou no bloco de
// pendencias). Com ele, CPF e nome ficam travados ("x" troca a pessoa).
const cpfInput = ref(null);
const nameInput = ref(null);
const cpfMasked = ref("");
const noCpf = ref(false);
const nome = ref("");
const person = ref(null);
const locked = computed(() => !!person.value);
// Lapis: libera o CPF ou o nome da pessoa escolhida para editar
const editing = reactive({ cpf: false, nome: false });
const editWarning = ref("");
const savingData = ref(false);
let editSeq = 0;
const today = ref([]);
// CPF/nome conferidos e sem cadastro: a senha cria a pessoa
const newPerson = ref(false);
const pending = ref(null);
const resolving = ref(false);
// Descarta respostas atrasadas de uma consulta anterior
let checkSeq = 0;

// CPF obrigatorio: valido ou "Sem CPF". Com os 11 digitos o aviso aparece
// na hora; incompleto, so depois de sair do campo.
const cpfBlurred = ref(false);
const cpfMissing = ref(false);
const cpfDigits = computed(() => onlyDigits(cpfMasked.value));
const cpfError = computed(() => {
  if (noCpf.value || (locked.value && !editing.cpf)) return "";
  const digits = cpfDigits.value;
  if (!digits) return cpfMissing.value ? "Digite o CPF ou marque “Sem CPF”" : "";
  if (digits.length < 11) return cpfBlurred.value ? "CPF incompleto" : "";
  return isValidCpf(digits) ? "" : "CPF inválido: confira os números";
});

// ---------- Sugestoes enquanto digita
const {
  items: cpfSugItems, open: cpfSugOpen, active: cpfSugActive,
  search: cpfSearch, close: cpfClose, onKeydown: cpfKeydown,
} = useSuggest((q) => getSugestoes({ cpf: q }));
const {
  items: nameSugItems, open: nameSugOpen, active: nameSugActive,
  search: nameSearch, close: nameClose, onKeydown: nameKeydown,
} = useSuggest((q) => getSugestoes({ nome: q }));

const cpfItems = computed(() => cpfSugItems.value.map((s) => ({
  key: s._id, title: s.cpf ? formatCpf(s.cpf) : "Sem CPF", subtitle: s.nome, pendente: s.pendencias.length > 0, raw: s,
})));
const nameItems = computed(() => nameSugItems.value.map((s) => ({
  key: s._id, title: s.nome, subtitle: s.cpf ? formatCpf(s.cpf) : "Sem CPF", pendente: s.pendencias.length > 0, raw: s,
})));

// Digitando o CPF: sugestoes; com os 11 digitos validos, confere o cadastro
watch(cpfDigits, (digits) => {
  cpfMissing.value = false;
  // "CPF incompleto" so depois de sair do campo de novo
  cpfBlurred.value = false;
  if (locked.value) {
    // Editando o CPF da pessoa: so avisa se o novo ja e de outro cadastro
    if (editing.cpf) {
      editWarning.value = "";
      if (digits.length === 11 && isValidCpf(digits) && digits !== person.value.cpf) checkEditedCpf(digits);
    }
    return;
  }
  resetCheck();
  if (digits.length === 11) {
    cpfClose();
    if (isValidCpf(digits)) checkCpf(digits);
    return;
  }
  cpfSearch(digits);
});

watch(nome, (value) => {
  if (locked.value) return;
  if (noCpf.value) resetCheck();
  nameSearch(value.trim());
});

function onCpfBlur() {
  cpfBlurred.value = true;
  cpfClose();
}

// Sem CPF: terminou de digitar o nome -> confere se ja existe
function onNameBlur() {
  nameClose();
  if (!locked.value && noCpf.value && nome.value.trim()) checkName();
}

function resetCheck() {
  checkSeq++;
  today.value = [];
  newPerson.value = false;
  if (pending.value && pending.value.tipo !== "corrigir") pending.value = null;
}

async function checkCpf(cpf) {
  const mine = ++checkSeq;
  try {
    const data = await getTriagem({ cpf });
    if (mine !== checkSeq) return;
    if (!data.candidatos.length) {
      newPerson.value = true;
      today.value = data.hoje;
    } else if (data.candidatos.length === 1) {
      await selectPerson(data.candidatos[0]);
    } else {
      today.value = data.hoje;
      pending.value = {
        tipo: "escolher-cpf",
        motivos: [`Este CPF tem ${data.candidatos.length} cadastros: escolha o nome correto`],
        escolhas: data.candidatos,
        cpf,
      };
    }
  } catch {
    // Sem a consulta a triagem segue: o servidor confere ao emitir
  }
}

async function checkName() {
  const mine = ++checkSeq;
  try {
    const data = await getTriagem({ nome: nome.value });
    if (mine !== checkSeq) return;
    today.value = data.hoje;
    if (!data.candidatos.length) {
      newPerson.value = true;
      return;
    }
    pending.value = {
      tipo: "escolher-nome",
      motivos: ["Já existe cadastro com este nome: escolha a pessoa ou marque “Pessoa nova”"],
      escolhas: data.candidatos,
    };
  } catch {
    // idem
  }
}

// Escolheu uma pessoa (sugestao, CPF com um cadastro, seletor de pendencias)
async function selectPerson(summary) {
  cpfClose();
  nameClose();
  const mine = ++checkSeq;
  resetEdits();
  person.value = summary;
  nome.value = summary.nome;
  noCpf.value = !summary.cpf;
  cpfMasked.value = summary.cpf ? formatCpf(summary.cpf) : "";
  if (!assistedAge.value && summary.nascimento) assistedAge.value = fromDateOnly(summary.nascimento);
  pending.value = null;
  newPerson.value = false;
  try {
    const data = await getTriagem({ id: summary._id });
    if (mine !== checkSeq) return;
    const [me, ...others] = data.candidatos;
    person.value = me;
    today.value = data.hoje;
    if (!assistedAge.value && me.nascimento) assistedAge.value = fromDateOnly(me.nascimento);
    if (others.length) {
      pending.value = {
        tipo: "escolher-cpf",
        motivos: [`Este CPF tem ${data.candidatos.length} cadastros: escolha o nome correto`],
        escolhas: data.candidatos,
        cpf: me.cpf,
      };
    } else if (me.pendencias.length) {
      pending.value = { tipo: "corrigir", motivos: me.pendencias.map((p) => p.texto), pessoa: me };
    }
  } catch {
    // Fica com o resumo da sugestao
  }
}

// "x" ou "Cancelar" da pendencia: volta a digitar
function clearPerson() {
  checkSeq++;
  cpfClose();
  nameClose();
  resetEdits();
  person.value = null;
  pending.value = null;
  today.value = [];
  newPerson.value = false;
  nome.value = "";
  cpfMasked.value = "";
  noCpf.value = false;
  cpfBlurred.value = false;
  assistedAge.value = null;
  nextTick(() => cpfInput.value?.focus());
}

async function onPendingConfirm(payload) {
  const p = pending.value;
  if (p.tipo === "escolher-nome") {
    // So identifica: pessoa existente ou nova (nenhum cadastro muda)
    if (payload.choice === "nova") {
      pending.value = null;
      newPerson.value = true;
      return;
    }
    return selectPerson(payload.chosen);
  }
  // Grava a resolucao: nome certo e CPF (valido ou Sem CPF); os outros
  // cadastros do CPF viram este
  const body = p.tipo === "escolher-cpf"
    ? {
      manterId: payload.choice === "outro" ? p.escolhas[0]._id : payload.choice,
      juntarIds: p.escolhas.map((c) => c._id),
      nome: payload.nome,
      cpf: p.cpf,
    }
    : { manterId: p.pessoa._id, nome: payload.nome, ...(payload.semCpf ? { semCpf: true } : { cpf: payload.cpf }) };
  resolving.value = true;
  try {
    const { assistido, juntados } = await resolverCadastro(body);
    toast.success(juntados ? `Cadastro confirmado (${juntados} cadastro${juntados > 1 ? "s" : ""} juntado${juntados > 1 ? "s" : ""})` : "Cadastro confirmado");
    pending.value = null;
    await selectPerson(assistido);
  } catch (error) {
    toast.error(error.response?.data?.errors?.[0]?.msg || "Não foi possível confirmar o cadastro");
  } finally {
    resolving.value = false;
  }
}

// ---------- Edicao dos dados de uma pessoa ja cadastrada
// Qualquer dado alterado (CPF, nome, nascimento) pede "Confirmar dados"
// antes de seguir para o atendimento. Pessoa nova: a senha salva tudo.
const cpfChanged = computed(() => !!person.value && editing.cpf
  && (noCpf.value ? "" : cpfDigits.value) !== (person.value.cpf || ""));
const nameChanged = computed(() => !!person.value && editing.nome && upper(nome.value) !== person.value.nome);
const birthChanged = computed(() => {
  const typed = toDateOnly(assistedAge.value);
  return !!person.value && !!typed && typed !== (person.value.nascimento || null);
});
const needsConfirm = computed(() => !pending.value && (cpfChanged.value || nameChanged.value || birthChanged.value));

function resetEdits() {
  editSeq++;
  editing.cpf = false;
  editing.nome = false;
  editWarning.value = "";
}

// Lapis: liga a edicao do campo; de novo, desfaz o que foi mudado nele
function toggleEdit(field) {
  if (editing[field]) {
    if (field === "cpf") {
      editing.cpf = false;
      noCpf.value = !person.value.cpf;
      cpfMasked.value = person.value.cpf ? formatCpf(person.value.cpf) : "";
      editWarning.value = "";
    } else {
      editing.nome = false;
      nome.value = person.value.nome;
    }
    return;
  }
  editing[field] = true;
  nextTick(() => (field === "cpf" ? cpfInput : nameInput).value?.focus());
}

function undoEdits() {
  const p = person.value;
  resetEdits();
  noCpf.value = !p.cpf;
  cpfMasked.value = p.cpf ? formatCpf(p.cpf) : "";
  nome.value = p.nome;
  assistedAge.value = p.nascimento ? fromDateOnly(p.nascimento) : null;
}

// O CPF novo ja e de outro cadastro? Ao confirmar, eles sao juntados
async function checkEditedCpf(cpf) {
  const mine = ++editSeq;
  try {
    const data = await getTriagem({ cpf });
    if (mine !== editSeq) return;
    const others = data.candidatos.filter((c) => c._id !== person.value?._id);
    if (others.length) {
      editWarning.value = `Este CPF já está no cadastro de ${others.map((o) => o.nome).join(", ")}: ao confirmar, os cadastros serão juntados.`;
    }
  } catch {
    // Sem o aviso; o servidor junta do mesmo jeito
  }
}

async function confirmData() {
  const cpf = noCpf.value ? "" : cpfDigits.value;
  if (!noCpf.value && !isValidCpf(cpf)) {
    cpfBlurred.value = true;
    return toast.error(cpf ? "CPF inválido: confira os números" : "Digite o CPF ou marque “Sem CPF”");
  }
  if (!nome.value.trim()) return toast.error("Digite o nome");
  savingData.value = true;
  try {
    const { assistido, juntados } = await resolverCadastro({
      manterId: person.value._id,
      nome: upper(nome.value),
      ...(noCpf.value ? { semCpf: true } : { cpf }),
      nascimento: toDateOnly(assistedAge.value),
    });
    toast.success(juntados ? `Dados confirmados (${juntados} cadastro${juntados > 1 ? "s" : ""} juntado${juntados > 1 ? "s" : ""})` : "Dados confirmados");
    await selectPerson(assistido);
  } catch (error) {
    toast.error(error.response?.data?.errors?.[0]?.msg || "Não foi possível salvar os dados");
  } finally {
    savingData.value = false;
  }
}

function toggleNoCpf() {
  noCpf.value = !noCpf.value;
  cpfMasked.value = "";
  cpfBlurred.value = false;
  cpfMissing.value = false;
  // Editando a pessoa: so troca o campo (sem procurar cadastro)
  if (locked.value) {
    editWarning.value = "";
    if (!noCpf.value) nextTick(() => cpfInput.value?.focus());
    return;
  }
  resetCheck();
  if (noCpf.value) {
    if (nome.value.trim()) checkName();
  } else {
    // Voltando a ter CPF, o cursor ja vai para o campo
    nextTick(() => cpfInput.value?.focus());
  }
}

// ---------- Avisos
const time = (date) => new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const sameDayNotice = computed(() => {
  if (!today.value.length) return "";
  const list = today.value.map((t) => `nº ${t.number} às ${time(t.dateQueue)} (${t.status === 1 ? "aguardando" : "atendida"})`).join(", ");
  return noCpf.value && !locked.value
    ? `Alguém com este nome já tirou senha hoje: ${list}`
    : `Esta pessoa já tirou senha hoje: ${list}`;
});

const visitNotice = computed(() => {
  if (pending.value) return "";
  if (newPerson.value) return "Primeira visita: o cadastro será criado com esta senha";
  const p = person.value;
  if (!p) return "";
  if (!p.visitas) return "Primeira visita";
  // Ja veio hoje: esta senha conta na mesma visita
  const numero = today.value.length ? p.visitas : p.visitas + 1;
  return visitText({ numero, anterior: p.ultima }) + (p.ultima?.atendente ? ` · atendida por ${p.ultima.atendente}` : "");
});

// Watchers
watch(preferentialBool, (newValue) => {
  if (newValue) {
    updatePreferentialAge();
  }
});

watch(assistedAge, (newValue) => {
  if (newValue) {
    updatePreferentialAge();
  }
});

// Methods
function updatePreferentialAge() {
  if (calculateAge(assistedAge.value) >= 80) {
    inputTicket.preferential = 2;
    preferentialBool.value = true;
  } else if (calculateAge(assistedAge.value) >= 60) {
    inputTicket.preferential = 1;
    preferentialBool.value = true;
  } else if (preferentialBool.value === true) {
    inputTicket.preferential = 1;
  } else if (preferentialBool.value === false) {
    inputTicket.preferential = 0;
  }
}

function setButtonDisabled() {
  if (config.dev == 1) return 0;
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 5000);
  return 1;
}

async function handleGetGlobalTicketData() {
  const response = await getGlobalTicketData();
  ticketGlobalData.value = response.data.ticket;
}

function resetForm() {
  clearPerson();
  tipo.value = "";
  notaTriagem.value = "";
  inputTicket.preferential = 0;
  // Sem limpar, o nascimento e a preferencia passavam para a proxima pessoa
  assistedAge.value = null;
  preferentialBool.value = false;
}

async function handleRegisterTicket() {
  if (pending.value) return toast.error("Resolva a pendência antes de cadastrar a senha");
  if (needsConfirm.value) return toast.error("Confirme os dados da pessoa antes de cadastrar a senha");
  const cpf = noCpf.value ? "" : cpfDigits.value;
  if (!person.value) {
    if (!noCpf.value && !cpf) {
      cpfMissing.value = true;
      cpfInput.value?.focus();
      return toast.error("Digite o CPF ou marque “Sem CPF”");
    }
    if (cpf && !isValidCpf(cpf)) {
      cpfBlurred.value = true;
      cpfInput.value?.focus();
      return toast.error(cpfError.value);
    }
    if (!nome.value.trim()) return toast.error("Digite um nome");
  }

  if (buttonDisabled.value) return;
  setButtonDisabled();

  await handleGetGlobalTicketData();

  let insertResponse;
  try {
    insertResponse = await insertTicket({
      number: ticketGlobalData.value.nextToQueue,
      status: 1,
      type: tipo.value,
      queuedBy: auth.userData.username,
      preferential: inputTicket.preferential,
      dateQueue: Date.now(),
      notaTriagem: notaTriagem.value.trim(),
      // So o dia (AAAA-MM-DD): sem hora, nao muda de dia com o fuso
      nascimento: toDateOnly(assistedAge.value),
      // Pessoa escolhida, ou os dados da pessoa nova
      ...(person.value ? { assistidoId: person.value._id } : { cpf, nome: upper(nome.value) }),
    });
  } catch (error) {
    // CPF que ganhou outro cadastro no meio do caminho: abre a pendencia
    if (error.response?.status === 409 && cpf) checkCpf(cpf);
    buttonDisabled.value = false;
    return toast.error(error.response?.data?.errors?.[0]?.msg || "Ocorreu um erro ao cadastrar a senha");
  }

  if (insertResponse.status != 200)
    return toast.error("Ocorreu um erro ao cadastrar a senha");
  toast.success("Senha cadastrada");

  resetForm();

  // Update global next number
  ticketGlobalData.value.nextToQueue += 1;
  const updateResponse = await updateGlobalTicketData({
    ticket: ticketGlobalData.value,
  });
  if (updateResponse.status != 200)
    return toast.error("Ocorreu um erro ao atualizar a lista");
  createSocket().emit("signalUpdateValues");
}

// Lifecycle
onMounted(async () => {
  transitionFade.value = true;
  await handleGetGlobalTicketData();
  // Create authenticated socket for control events
  if (auth.token) {
    createSocket();
  }
  publicSocket.on("receiveUpdateGlobal", handleGetGlobalTicketData);
});

// Sem isso, cada visita a triagem somava mais um listener
onBeforeUnmount(() => {
  cpfClose();
  nameClose();
  publicSocket.off("receiveUpdateGlobal", handleGetGlobalTicketData);
});
</script>

<style scoped>
.sorting-col {
  width: min(420px, 92vw);
}

/* Rotulo com o lapis de editar ao lado */
.label-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.edit-types {
  color: var(--qtm-text-muted);
  line-height: 1;
}

.edit-types:hover {
  color: var(--qtm-primary);
}

/* fieldset sem moldura: so serve para travar o formulario inteiro */
.sorting-card fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

/* Esperando a pendencia acima: o formulario fica apagado e sem clique */
.sorting-card.is-waiting > form > fieldset,
.sorting-card fieldset.attendance:disabled {
  opacity: 0.55;
}

/* Entre os dados da pessoa e o atendimento */
.section-divider {
  margin: 4px 0 16px;
  border-top: 1px solid var(--qtm-border);
  opacity: 1;
}

/* "Confirmar dados": logo acima da divisoria, antes do atendimento */
.confirm-data {
  text-align: left;
  border: 1px solid rgba(var(--qtm-primary-rgb), 0.45);
  background: rgba(var(--qtm-primary-rgb), 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.confirm-text {
  font-size: var(--qtm-fs-small);
  font-weight: 600;
  margin-bottom: 8px;
}

.confirm-warning {
  font-size: var(--qtm-fs-small);
  color: #8a5300;
  margin-bottom: 8px;
}

[data-bs-theme="dark"] .confirm-warning {
  color: #f5c542;
}

/* As sugestoes abrem por cima do resto do formulario */
.suggest-wrap {
  position: relative;
}

/* Avisos do cadastro: compactos, logo abaixo do CPF */
.notice {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: -6px 0 12px;
  padding: 8px 12px;
  font-size: var(--qtm-fs-small);
  line-height: 1.4;
  text-align: left;
}

.notice .icon {
  flex-shrink: 0;
  align-self: center;
}
</style>
