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

<script>
import { defineComponent } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import {
  loadMonitorConfigs,
  saveMonitorConfigs,
  resetGlobalTicketData,
} from "../controllers/globalController.js";
import { registerUser } from "../controllers/userController";

import topbar from "../components/topbar";

export default defineComponent({
  name: "page_config",
  components: {
    topbar,
  },
  setup() {
    // const globalStore = useGlobalStore();

    function handleRegister() {
      const loginPattern = /^[a-zA-Z0-9]+[.][a-zA-Z0-9]+$/;

      if (!loginPattern.test(this.register.login))
        return useToast().error(
          "O login deve seguir o padrão 'nome.sobrenome'."
        );

      const userData = {
        username: this.register.username,
        login: this.register.login,
        password: this.register.pass,
        role: this.register.role,
      };
      registerUser(userData)
        .then((response) => {
          this.register.username = "";
          this.register.login = "";
          this.register.pass = "";
          this.register.role = 0;
          switch (response) {
            case 400:
              return useToast().error("Este usuario já existe");
            case 500:
              return useToast().error("Ocorreu um erro interno no servidor.");
            default:
              return useToast().success("Usuario criado com sucesso");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    return {
      // globalStore,
      handleRegister,
    };
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      displayLanguage: 0,
      monitorConfig: {},
      register: {
        username: null,
        login: null,
        pass: null,
        role: null,
      },
    };
  },
  async mounted() {
    this.transitionFade = true;

    // await this.globalStore.getGlobalVariablesAPI().then(() => {});
    await loadMonitorConfigs().then((response) => {
      this.monitorConfig = response;
    });
  },
  methods: {
    setButtonDisabled() {
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 10000);
    },
    async handleResetGlobalTicketData() {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();
      await resetGlobalTicketData().then((response) => {
        if (response.status != 200)
          return useToast().error("Erro ao resetar as senhas");
        socket.emit("signalUpdateValues");
        useToast().success("Senhas resetadas");
      });
    },
    saveConfigs() {
      saveMonitorConfigs(this.monitorConfig)
        .then(() => {
          useToast().success("Configurações salvas");
          socket.emit("signalUpdateMonitorConfigs");
          this.setButtonDisabled();
        })
        .catch(() => {
          useToast().error("Erro ao salvar as configurações");
        });
    },
  },
});
</script>

<style scoped></style>
