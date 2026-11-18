<template>
  <div class="row justify-content-center g-3">
    <div class="col-12 col-lg-auto">
      <div class="menu-default config-card">
        <h5>Novo usuário</h5>
        <form class="new-user-form" @submit.prevent="handleRegister()">
          <label class="form-label" for="new-username">Nome</label>
          <input id="new-username" v-model="register.username" type="text" maxlength="30" class="form-control mb-3" required />

          <label class="form-label" for="new-login">Login</label>
          <input id="new-login" v-model="register.login" type="text" maxlength="30" class="form-control mb-3" placeholder="nome.sobrenome" required />

          <label class="form-label" for="new-password">Senha</label>
          <input id="new-password" v-model="register.pass" type="password" autocomplete="new-password" class="form-control mb-3" required />

          <label class="form-label" for="new-role">Função</label>
          <select id="new-role" v-model="register.role" class="form-select mb-3" required>
            <option value="" disabled>Escolha a função</option>
            <option v-for="(name, value) in ROLES" :key="value" :value="value">{{ name }}</option>
          </select>
          <button type="submit" class="btn btn-primary w-100">Cadastrar usuário</button>
        </form>
      </div>
    </div>

    <div class="col-12 col-lg">
      <div class="menu-default config-card">
        <h5>Usuários ({{ search.trim() ? `${shownUsers.length} de ${users.length}` : users.length }})</h5>
        <SearchField id="users-search" v-model="search" class="mb-2" placeholder="Pesquisar por nome, login ou função" />
        <div class="table-responsive users-table">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Login</th>
                <th>Função</th>
                <th class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in shownUsers" :key="user._id" :class="{ 'table-active': editingUser?._id === user._id }">
                <td>{{ user.username }}</td>
                <td>{{ user.login }}</td>
                <td>{{ ROLES[user.role] || "Desconhecido" }}</td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-outline-primary btn-sm me-1" @click="editUser(user)">Editar</button>
                  <button
                    class="btn btn-outline-danger btn-sm"
                    :disabled="user._id === auth.userData?._id"
                    :title="user._id === auth.userData?._id ? 'Não é possível excluir o próprio usuário' : ''"
                    @click="handleDeleteUser(user)">
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="search.trim() && !shownUsers.length">
                <td colspan="4" class="text-muted-qtm">Nenhum usuário encontrado</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>

  <!-- Editar usuario: janela sobre a tela (Esc ou clique fora fecham) -->
  <Teleport to="body">
    <Transition name="modal-fade" @after-enter="focusFirstField">
      <div v-if="editingUser" class="user-modal" @keydown.esc="closeEdit" @keydown.tab="trapFocus">
        <div class="modal-backdrop show"></div>
        <div
          class="modal d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          @mousedown.self="closeEdit">
          <div class="modal-dialog modal-dialog-centered">
            <form ref="dialogEl" class="modal-content" @submit.prevent="handleUpdateUser()">
              <div class="modal-header">
                <div>
                  <h5 id="edit-user-title" class="modal-title">Editar usuário</h5>
                  <small class="text-body-secondary">{{ editingUser.originalLogin }}</small>
                </div>
                <button type="button" class="btn-close" aria-label="Fechar" @click="closeEdit"></button>
              </div>
              <div class="modal-body">
                <label class="form-label" for="edit-username">Nome</label>
                <input id="edit-username" v-model="editingUser.username" type="text" maxlength="30" class="form-control mb-3" required />

                <label class="form-label" for="edit-login">Login</label>
                <input id="edit-login" v-model="editingUser.login" type="text" maxlength="30" class="form-control mb-3" required />

                <label class="form-label" for="edit-password">Nova senha</label>
                <input
                  id="edit-password"
                  v-model="editingUser.newPassword"
                  type="password"
                  autocomplete="new-password"
                  class="form-control mb-3"
                  placeholder="Deixe vazio para manter a atual" />

                <label class="form-label" for="edit-role">Função</label>
                <select id="edit-role" v-model="editingUser.role" class="form-select" required>
                  <option v-for="(name, value) in ROLES" :key="value" :value="value">{{ name }}</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeEdit">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">Salvar alterações</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onDeactivated } from "vue";
import { useScrollLock } from "@vueuse/core";
import { toast } from "@/services/notify.js";
import { useAuth } from "@/stores/auth.js";
import { registerUser, getUsers, updateUser, deleteUser } from "@/controllers/userController.js";
import { matchesSearch } from "@/utils/index.js";
import SearchField from "@/components/SearchField.vue";

const ROLES = { 1: "Monitor", 2: "Atendente", 3: "Administrador" };

const auth = useAuth();
const users = ref([]);
// Busca que filtra enquanto digita (nome, login e funcao)
const search = ref("");
const shownUsers = computed(() => users.value.filter((u) => matchesSearch([u.username, u.login, ROLES[u.role]], search.value)));
const editingUser = ref(null);
const saving = ref(false);
const dialogEl = ref(null);
const pageScrollLocked = useScrollLock(typeof document !== "undefined" ? document.body : null);
// Botao "Editar" que abriu a janela: recebe o foco de volta ao fechar
let openerEl = null;
const register = ref({ username: "", login: "", pass: "", role: "" });

// Primeira mensagem de validacao devolvida pelo backend (express-validator)
function validationMessage(response) {
  return response?.data?.errors?.[0]?.msg || null;
}

async function loadUsers() {
  const response = await getUsers();
  if (response?.data?.users) users.value = response.data.users;
}

function editUser(user) {
  openerEl = document.activeElement;
  editingUser.value = {
    _id: user._id,
    originalLogin: user.login,
    username: user.username,
    login: user.login,
    role: String(user.role),
    newPassword: "",
  };
}

function closeEdit() {
  editingUser.value = null;
  openerEl?.focus?.();
  openerEl = null;
}

function focusableIn(el) {
  return [...el.querySelectorAll("button, input, select, textarea, [href]")].filter((e) => !e.disabled);
}

function focusFirstField() {
  dialogEl.value?.querySelector("input")?.focus();
}

// Tab nao sai da janela enquanto ela estiver aberta
function trapFocus(event) {
  if (!dialogEl.value) return;
  const items = focusableIn(dialogEl.value);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!dialogEl.value.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  }
}

watch(editingUser, (user) => { pageScrollLocked.value = !!user; });
// As abas ficam em KeepAlive: a janela (fora da aba, no body) nao pode sobrar aberta
onDeactivated(() => { if (editingUser.value) closeEdit(); });

async function handleUpdateUser() {
  if (!editingUser.value) return;
  const userData = {
    username: editingUser.value.username,
    login: editingUser.value.login,
    role: editingUser.value.role,
  };
  if (editingUser.value.newPassword) userData.password = editingUser.value.newPassword;

  saving.value = true;
  const response = await updateUser(editingUser.value._id, userData).finally(() => { saving.value = false; });
  if (response?.status === 200) {
    toast.success("Usuário atualizado com sucesso");
    closeEdit();
    await loadUsers();
  } else {
    toast.error(validationMessage(response) || "Erro ao atualizar usuário");
  }
}

async function handleDeleteUser(user) {
  if (!confirm(`Excluir o usuário ${user.login}?`)) return;
  const response = await deleteUser(user._id);
  if (response?.status === 200) {
    toast.success("Usuário removido com sucesso");
    if (editingUser.value?._id === user._id) editingUser.value = null;
    await loadUsers();
  } else if (response?.status === 400) {
    toast.error(response.data.error || "Não é possível excluir este usuário");
  } else {
    toast.error("Erro ao excluir usuário");
  }
}

async function handleRegister() {
  const loginPattern = /^[a-zA-Z0-9]+[.][a-zA-Z0-9]+$/;
  if (!loginPattern.test(register.value.login)) {
    return toast.error("O login deve seguir o padrão 'nome.sobrenome'.");
  }

  const response = await registerUser({
    username: register.value.username,
    login: register.value.login,
    password: register.value.pass,
    role: register.value.role,
  });

  switch (response?.status) {
    case 201:
      toast.success("Usuário criado com sucesso");
      register.value = { username: "", login: "", pass: "", role: "" };
      return loadUsers();
    case 400:
      // login repetido OU erro de validacao (ex.: funcao nao selecionada)
      return toast.error(validationMessage(response) || "Este usuário já existe");
    case 401:
    case 403:
      return toast.error("Sem permissão");
    default:
      return toast.error("Ocorreu um erro interno no servidor.");
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.new-user-form {
  width: min(280px, 80vw);
}

.users-table {
  max-height: 420px;
  overflow-y: auto;
}

.users-table thead th {
  position: sticky;
  top: 0;
  background: var(--qtm-table-head);
}

.user-modal .modal-content {
  text-align: left;
}

/* Escuro: a janela usa o tom dos cartoes, um degrau acima da pagina */
[data-bs-theme="dark"] .user-modal .modal-content {
  background-color: var(--qtm-surface);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-active .modal-dialog,
.modal-fade-leave-active .modal-dialog {
  transition: transform 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-dialog,
.modal-fade-leave-to .modal-dialog {
  transform: translateY(-12px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .modal-dialog,
  .modal-fade-leave-active .modal-dialog {
    transition: none;
  }
}
</style>
