<template>
  <topbar></topbar>
  <div class="config">
    <span class="title_page">Painel de configuração</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <h5>Monitor</h5>
              <div
                class="input-group input-group-sm mb-3 justify-content-center"
              >
                <span class="input-group-text" id="basic-addon1">Idioma:</span>
                <select
                  class="form-select"
                  aria-label="Default select example"
                  v-model="displayLanguage"
                  disabled
                >
                  <option value="0">Português</option>
                  <option value="1">English</option>
                </select>
              </div>

              <div
                class="input-group input-group-sm mb-3 justify-content-center"
              >
                <span class="input-group-text" id="basic-addon1"
                  >Modo do monitor:</span
                >
                <select
                  class="form-select"
                  aria-label="Default select example"
                  v-model="monitorConfig.monitorMode"
                  disabled
                >
                  <option value="0">Horizontal</option>
                  <option value="1">Vertical</option>
                </select>
              </div>

              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckDefault"
                  ><input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="monitorConfig.showTicketNumber"
                    :disabled="buttonDisabled"
                  />
                  Mostrar numero da senha no painel</label
                >
              </div>

              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckDefault"
                  ><input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="monitorConfig.soundNotification"
                    :disabled="buttonDisabled"
                  />
                  Notificação ao chamar senha</label
                >
              </div>

              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckDefault"
                  ><input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="monitorConfig.soundCallTicket"
                    :disabled="buttonDisabled"
                  />
                  Voz ao chamar senha</label
                >
              </div>

              <div v-if="monitorConfig.soundCallTicket">
                <div
                  class="input-group input-group-sm mb-3 justify-content-center"
                >
                  <span class="input-group-text" id="basic-addon1"
                    >Tipo de voz:</span
                  ><select
                    class="selectpicker"
                    v-model="monitorConfig.soundCallTicketVoice"
                    :disabled="buttonDisabled"
                  >
                    <option v-for="value in 21" :key="value - 1">
                      {{ value - 1 }}
                    </option>
                  </select>
                </div>
              </div>

              <span>
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  @click="saveConfigs"
                  :disabled="buttonDisabled"
                >
                  Salvar
                </button>
              </span>
            </div>
          </div>
          <br />
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <h5>Registro de usuario</h5>
              <form @submit.prevent="handleRegister()">
                <div class="input-group input-group-sm mb-1">
                  <span class="input-group-text" id="inputGroup-sizing-sm"
                    >Nome:</span
                  >
                  <input
                    type="text"
                    maxlength="30"
                    class="form-control"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="register.username"
                    required
                  />
                </div>
                <div class="input-group input-group-sm mb-1">
                  <span class="input-group-text" id="inputGroup-sizing-sm"
                    >Login:</span
                  >
                  <input
                    type="text"
                    maxlength="30"
                    class="form-control"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="register.login"
                    required
                  />
                </div>
                <div class="input-group input-group-sm mb-1">
                  <span class="input-group-text" id="inputGroup-sizing-sm"
                    >Senha:</span
                  >
                  <input
                    type="new-password"
                    class="form-control"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="register.pass"
                    required
                  />
                </div>
                <div class="input-group input-group-sm mb-2">
                  <span class="input-group-text" for="inputGroupSelect01"
                    >Função</span
                  >
                  <select
                    class="custom-select"
                    id="inputGroupSelect01"
                    v-model="register.role"
                    required
                  >
                    <option value="1">Monitor</option>
                    <option value="2">Atendente</option>
                    <option value="3">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="buttonDisabled"
                >
                  Cadastrar
                </button>
              </form>
            </div>
          </div>
          <br />
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <h5>Gerenciamento de usuários</h5>

              <!-- Tabela de usuários -->
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Login</th>
                    <th>Função</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user._id">
                    <td>{{ user.username }}</td>
                    <td>{{ user.login }}</td>
                    <td>{{ getRoleName(user.role) }}</td>
                    <td>
                      <button class="btn btn-outline-primary btn-sm" @click="editUser(user)">Editar</button>
                      <button class="btn btn-outline-danger btn-sm" @click="handleDeleteUser(user._id)">Excluir</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Formulário de edição — mesmo padrão input-group do "Registro de usuario" -->
              <div v-if="editingUser">
                <h6>Editar usuário</h6>
                <form @submit.prevent="handleUpdateUser()">
                  <div class="input-group input-group-sm mb-1">
                    <span class="input-group-text" id="inputGroup-sizing-sm">Nome:</span>
                    <input type="text" maxlength="30" class="form-control" v-model="editingUser.username" required />
                  </div>
                  <div class="input-group input-group-sm mb-1">
                    <span class="input-group-text" id="inputGroup-sizing-sm">Login:</span>
                    <input type="text" maxlength="30" class="form-control" v-model="editingUser.login" required />
                  </div>
                  <div class="input-group input-group-sm mb-1">
                    <span class="input-group-text" id="inputGroup-sizing-sm">Nova senha:</span>
                    <input type="password" class="form-control" v-model="editingUser.newPassword" placeholder="Deixe vazio para manter" />
                  </div>
                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text">Função</span>
                    <select class="custom-select" v-model="editingUser.role" required>
                      <option value="1">Monitor</option>
                      <option value="2">Atendente</option>
                      <option value="3">Administrador</option>
                    </select>
                  </div>
                  <button type="submit" class="btn btn-outline-primary btn-sm">Salvar</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="editingUser = null">Cancelar</button>
                </form>
              </div>
            </div>
          </div>
          <br />
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <h5>Registro de atividades</h5>
              <form class="activity-filters" @submit.prevent="loadActivity(1)">
                <div class="input-group input-group-sm">
                  <span class="input-group-text">Atividade</span>
                  <select v-model="activityFilter.type" class="form-select form-select-sm">
                    <option value="">Todas</option>
                    <option v-for="(label, key) in ACTIVITY_LABELS" :key="key" :value="key">{{ label }}</option>
                  </select>
                </div>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">Usuário</span>
                  <input v-model="activityFilter.user" type="text" class="form-control" placeholder="nome ou login" />
                </div>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">De</span>
                  <input v-model="activityFilter.from" type="date" class="form-control" />
                  <span class="input-group-text">até</span>
                  <input v-model="activityFilter.to" type="date" class="form-control" />
                </div>
                <button type="submit" class="btn btn-outline-primary btn-sm">Filtrar</button>
              </form>

              <table class="table table-sm activity-table">
                <thead>
                  <tr>
                    <th>Data/hora</th>
                    <th>Atividade</th>
                    <th>Usuário</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in activity.items" :key="item._id">
                    <td class="text-nowrap">{{ convertDate(item.date) }}</td>
                    <td class="text-nowrap">{{ activityLabel(item.type) }}</td>
                    <td>{{ item.user || item.login }}</td>
                    <td>{{ describeActivity(item) }}</td>
                  </tr>
                  <tr v-if="!activity.items.length">
                    <td colspan="4">Nenhuma atividade encontrada</td>
                  </tr>
                </tbody>
              </table>
              <div class="activity-pages">
                <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="activity.pagination.page <= 1" @click="loadActivity(activity.pagination.page - 1)">Anterior</button>
                <span class="small">Página {{ activity.pagination.page }} de {{ activity.pagination.pages }} ({{ activity.pagination.total }} registros)</span>
                <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="activity.pagination.page >= activity.pagination.pages" @click="loadActivity(activity.pagination.page + 1)">Próxima</button>
              </div>
            </div>
          </div>
          <br />
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <button
                type="button"
                class="btn btn-outline-danger"
                @click="handleResetGlobalTicketData"
                :disabled="buttonDisabled"
              >
                Resetar painel de senhas
              </button>
            </div>
          </div>
          <br />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { createSocket } from "@/socket.js";
import {
  loadMonitorConfigs,
  saveMonitorConfigs,
  resetGlobalTicketData,
} from "@/controllers/globalController.js";
import {
  registerUser,
  getUsers,
  updateUser,
  deleteUser,
  getActivity,
} from "@/controllers/userController.js";
import { useAuth } from "@/stores/auth.js";
import { convertDate } from "@/utils/index.js";
import { ACTIVITY_LABELS, activityLabel, describeActivity } from "@/utils/activity.js";

import topbar from "@/components/topbar.vue";

const toast = useToast();
const auth = useAuth();

const transitionFade = ref(false);
const buttonDisabled = ref(false);
const displayLanguage = ref(0);
const monitorConfig = ref({});
const register = ref({
  username: null,
  login: null,
  pass: null,
  role: null,
});
const users = ref([]);
const editingUser = ref(null);

// Registro de atividades
const activityFilter = ref({ type: "", user: "", from: "", to: "" });
const activity = ref({ items: [], pagination: { page: 1, pages: 1, total: 0 } });

async function loadActivity(page = 1) {
  const f = activityFilter.value;
  const params = { page, limit: 50 };
  if (f.type) params.type = f.type;
  if (f.user) params.user = f.user;
  // Datas do filtro no fuso local: "de" no inicio do dia, "ate" no fim
  if (f.from) params.from = new Date(`${f.from}T00:00:00`).toISOString();
  if (f.to) params.to = new Date(`${f.to}T23:59:59.999`).toISOString();
  const response = await getActivity(params);
  if (response?.status === 200) {
    activity.value = response.data;
  } else {
    toast.error("Erro ao carregar o registro de atividades");
  }
}

function setButtonDisabled() {
  buttonDisabled.value = true;
  setTimeout(() => {
    buttonDisabled.value = false;
  }, 10000);
}

// Primeira mensagem de validacao devolvida pelo backend (express-validator)
function validationMessage(response) {
  return response?.data?.errors?.[0]?.msg || null;
}

function getRoleName(role) {
  switch (Number(role)) {
    case 1:
      return "Monitor";
    case 2:
      return "Atendente";
    case 3:
      return "Administrador";
    default:
      return "Desconhecido";
  }
}

async function loadUsers() {
  const response = await getUsers();
  if (response && response.data && response.data.users) {
    users.value = response.data.users;
  }
}

function editUser(user) {
  editingUser.value = {
    _id: user._id,
    username: user.username,
    login: user.login,
    role: user.role,
    newPassword: "",
  };
}

async function handleUpdateUser() {
  if (!editingUser.value) return;

  const userData = {
    username: editingUser.value.username,
    login: editingUser.value.login,
    role: editingUser.value.role,
  };

  if (editingUser.value.newPassword) {
    userData.password = editingUser.value.newPassword;
  }

  const response = await updateUser(editingUser.value._id, userData);
  if (response && response.status === 200) {
    toast.success("Usuário atualizado com sucesso");
    editingUser.value = null;
    await loadUsers();
  } else {
    toast.error(validationMessage(response) || "Erro ao atualizar usuário");
  }
}

async function handleDeleteUser(userId) {
  if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

  const response = await deleteUser(userId);
  if (response && response.status === 200) {
    toast.success("Usuário removido com sucesso");
    await loadUsers();
  } else if (response && response.status === 400) {
    toast.error(response.data.error || "Não é possível excluir este usuário");
  } else {
    toast.error("Erro ao excluir usuário");
  }
}

function handleRegister() {
  const loginPattern = /^[a-zA-Z0-9]+[.][a-zA-Z0-9]+$/;

  if (!loginPattern.test(register.value.login)) {
    return toast.error("O login deve seguir o padrão 'nome.sobrenome'.");
  }

  const userData = {
    username: register.value.username,
    login: register.value.login,
    password: register.value.pass,
    role: register.value.role,
  };

  registerUser(userData)
    .then((response) => {
      register.value.username = "";
      register.value.login = "";
      register.value.pass = "";
      register.value.role = null;

      if (!response || !response.status) {
        return toast.error("Ocorreu um erro interno no servidor.");
      }

      switch (response.status) {
        case 400:
          // 400 = login repetido OU erro de validacao (ex.: funcao nao selecionada)
          return toast.error(validationMessage(response) || "Este usuario já existe");
        case 401:
        case 403:
          return toast.error("Sem permissão");
        case 500:
          return toast.error("Ocorreu um erro interno no servidor.");
        default:
          toast.success("Usuario criado com sucesso");
          loadUsers();
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

async function handleResetGlobalTicketData() {
  if (buttonDisabled.value) return;
  setButtonDisabled();
  const response = await resetGlobalTicketData();
  if (response.status !== 200) {
    return toast.error("Erro ao resetar as senhas");
  }
  createSocket().emit("signalUpdateValues");
  toast.success("Senhas resetadas");
}

function saveConfigs() {
  saveMonitorConfigs(monitorConfig.value)
    .then(() => {
      toast.success("Configurações salvas");
      createSocket().emit("signalUpdateMonitorConfigs");
      setButtonDisabled();
    })
    .catch(() => {
      toast.error("Erro ao salvar as configurações");
    });
}

onMounted(async () => {
  transitionFade.value = true;
  const configResponse = await loadMonitorConfigs();
  monitorConfig.value = configResponse;
  await loadUsers();
  await loadActivity(1);
  // Create authenticated socket for control events
  if (auth.token) {
    createSocket();
  }
});
</script>

<style scoped>
.activity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.activity-filters .input-group {
  width: auto;
}

.activity-table td,
.activity-table th {
  font-size: 0.85em;
  text-align: left;
}

.activity-pages {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
