<template>
  <div class="row justify-content-center g-3">
    <div class="col-12 col-lg-auto">
      <div class="menu-default config-card">
        <h5>Novo usuário</h5>
        <form @submit.prevent="handleRegister()">
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Nome</span>
            <input v-model="register.username" type="text" maxlength="30" class="form-control" required />
          </div>
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Login</span>
            <input v-model="register.login" type="text" maxlength="30" class="form-control" placeholder="nome.sobrenome" required />
          </div>
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Senha</span>
            <input v-model="register.pass" type="password" autocomplete="new-password" class="form-control" required />
          </div>
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text">Função</span>
            <select v-model="register.role" class="form-select" required>
              <option v-for="(name, value) in ROLES" :key="value" :value="value">{{ name }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-outline-primary btn-sm">Cadastrar</button>
        </form>
      </div>
    </div>

    <div class="col-12 col-lg">
      <div class="menu-default config-card">
        <h5>Usuários ({{ users.length }})</h5>
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
              <tr v-for="user in users" :key="user._id" :class="{ 'table-active': editingUser?._id === user._id }">
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
            </tbody>
          </table>
        </div>

        <form v-if="editingUser" class="edit-form mt-3" @submit.prevent="handleUpdateUser()">
          <h6>Editar {{ editingUser.login }}</h6>
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Nome</span>
            <input v-model="editingUser.username" type="text" maxlength="30" class="form-control" required />
          </div>
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Login</span>
            <input v-model="editingUser.login" type="text" maxlength="30" class="form-control" required />
          </div>
          <div class="input-group input-group-sm mb-1">
            <span class="input-group-text">Nova senha</span>
            <input v-model="editingUser.newPassword" type="password" autocomplete="new-password" class="form-control" placeholder="Deixe vazio para manter" />
          </div>
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text">Função</span>
            <select v-model="editingUser.role" class="form-select" required>
              <option v-for="(name, value) in ROLES" :key="value" :value="value">{{ name }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-outline-primary btn-sm me-1">Salvar</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="editingUser = null">Cancelar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { toast } from "@/services/notify.js";
import { useAuth } from "@/stores/auth.js";
import { registerUser, getUsers, updateUser, deleteUser } from "@/controllers/userController.js";

const ROLES = { 1: "Monitor", 2: "Atendente", 3: "Administrador" };

const auth = useAuth();
const users = ref([]);
const editingUser = ref(null);
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
  editingUser.value = { _id: user._id, username: user.username, login: user.login, role: String(user.role), newPassword: "" };
}

async function handleUpdateUser() {
  if (!editingUser.value) return;
  const userData = {
    username: editingUser.value.username,
    login: editingUser.value.login,
    role: editingUser.value.role,
  };
  if (editingUser.value.newPassword) userData.password = editingUser.value.newPassword;

  const response = await updateUser(editingUser.value._id, userData);
  if (response?.status === 200) {
    toast.success("Usuário atualizado com sucesso");
    editingUser.value = null;
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
.users-table {
  max-height: 420px;
  overflow-y: auto;
}

.users-table thead th {
  position: sticky;
  top: 0;
  background: #f1f1f1;
}

.edit-form {
  text-align: left;
}
</style>
