<template>
  <topbar></topbar>
  <div class="config">
    <span class="title_page">Painel de configuração</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-25 p-3">
          <div class="row">
            <div class="col">
              <div class="input-group input-group-sm mb-3 justify-content-center">
                <span class="input-group-text" id="basic-addon1">Idioma:</span>
                <select
                  class="form-select"
                  aria-label="Default select example"
                  v-model="displayLanguage"
                  disabled>
                  <option value="0">Português</option>
                  <option value="1">English</option>
                </select>
              </div>

              <div class="input-group input-group-sm mb-3 justify-content-center">
                <span class="input-group-text" id="basic-addon1">Modo do monitor:</span>
                <select
                  class="form-select"
                  aria-label="Default select example"
                  v-model="globalStore.monitorMode"
                  disabled>
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
                    v-model="globalStore.soundNotification"
                    :disabled="buttonDisabled" />
                  Notificação ao chamar senha</label
                >
              </div>

              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckDefault"
                  ><input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="globalStore.soundCallTicket"
                    :disabled="buttonDisabled" />
                  Voz ao chamar senha</label
                >
              </div>

              <div v-if="soundCallTicket">
                <div class="input-group input-group-sm mb-3 justify-content-center">
                  <span class="input-group-text" id="basic-addon1">Tipo de voz:</span
                  ><select
                    class="selectpicker"
                    v-model="globalStore.soundCallTicketVoice"
                    :disabled="buttonDisabled">
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
                  :disabled="buttonDisabled">
                  Salvar
                </button>
              </span>
              <span>
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  @click="resetAllTickets"
                  :disabled="buttonDisabled">
                  Resetar senhas
                </button></span
              >
            </div>
          </div>
        </div>
        <br />
        <div class="container w-25 p-3">
          <div class="row">
            <div class="col">
              <div class="input-group input-group-sm mb-1">
                <span class="input-group-text" id="inputGroup-sizing-sm">Nome:</span>
                <input
                  type="text"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="register.username" />
              </div>
              <div class="input-group input-group-sm mb-1">
                <span class="input-group-text" id="inputGroup-sizing-sm">Login:</span>
                <input
                  type="text"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="register.login" />
              </div>
              <div class="input-group input-group-sm mb-1">
                <span class="input-group-text" id="inputGroup-sizing-sm">Senha:</span>
                <input
                  type="password"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="register.pass" />
              </div>
              <div class="input-group input-group-sm mb-2">
                <span class="input-group-text" for="inputGroupSelect01">Função</span>
                <select class="custom-select" id="inputGroupSelect01" v-model="register.role">
                  <option value="1">Monitor</option>
                  <option value="2">Atendente</option>
                  <option value="3">Administrador</option>
                </select>
              </div>
              <button
                type="button"
                @click="handleRegister()"
                class="btn btn-outline-primary btn-sm"
                :disabled="buttonDisabled">
                Cadastrar usuario
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref, defineComponent } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { useGlobalStore } from "@/stores/global";
import { useAuth } from "@/stores/auth.js";
import topbar from "../components/topbar";

export default defineComponent({
  name: "page_config",
  components: {
    topbar,
  },
  setup() {
    const globalStore = useGlobalStore();
    const monitorMode = ref(() => globalStore.monitorMode);
    const soundNotification = ref(() => globalStore.soundNotification);
    const soundCallTicket = ref(() => globalStore.soundCallTicket);
    const soundCallTicketVoice = ref(() => globalStore.soundCallTicketVoice);

    const auth = useAuth();
    function handleRegister() {
      const userData = {
        username: this.register.username,
        login: this.register.login,
        password: this.register.pass,
        role: this.register.role,
      };
      auth.register(userData);
    }

    return {
      globalStore,
      monitorMode,
      soundNotification,
      soundCallTicket,
      soundCallTicketVoice,
      handleRegister,
    };
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      displayLanguage: 0,
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

    await this.globalStore.getGlobalVariablesAPI().then(() => {});
  },
  methods: {
    setButtonDisabled() {
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 10000);
    },
    resetAllTickets() {
      this.globalStore.resetStoreAllTickets();
      this.globalStore.updateVariablesInAPI();
      socket.emit("signalUpdateValues");
      useToast().success("Senhas resetadas");
      this.setButtonDisabled();
      //useToast().error("Erro ao resetar as senhas");
    },
    saveConfigs() {
      const updatedData = {
        monitorMode: this.globalStore.monitorMode,
        soundNotification: this.globalStore.soundNotification,
        soundCallTicket: this.globalStore.soundCallTicket,
        soundCallTicketVoice: this.globalStore.soundCallTicketVoice,
      };

      this.globalStore
        .updateGlobalConfigs(updatedData)
        .then(() => {
          useToast().success("Configurações salvas");
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
