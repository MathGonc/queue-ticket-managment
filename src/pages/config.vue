<template>
  <div class="config">
    <topbar></topbar>
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
        <div class="container w-50 p-3">
          <div class="row">
            <div class="col">
              <div class="input-group input-group-sm mb-3">
                <span class="input-group-text" id="inputGroup-sizing-sm">Nome:</span>
                <input
                  type="text"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="registerUsername" />
                <span class="input-group-text" id="inputGroup-sizing-sm">Senha:</span>
                <input
                  type="password"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="registerPass" />
                <button
                  type="button"
                  @click="register()"
                  class="btn btn-outline-primary"
                  :disabled="buttonDisabled">
                  Cadastrar usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref, defineComponent } from "vue";
import topbar from "../components/topbar";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import axios from "axios";
import config from "../../config.js";
import { useGlobalStore } from "@/stores/global";

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

    return {
      globalStore,
      monitorMode,
      soundNotification,
      soundCallTicket,
      soundCallTicketVoice,
    };
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      displayLanguage: 0,
      registerUsername: null,
      registerPass: null,
    };
  },
  async mounted() {
    this.transitionFade = true;

    await this.globalStore.getGlobalVariablesAPI().then(() => {});
  },
  methods: {
    register() {
      axios
        .post(`${config.url_server}/register`, {
          login: this.registerUsername,
          password: this.registerPass,
        })
        .then((response) => {
          console.log(response.data.message);
        })
        .catch((error) => {
          console.error(error.response.data.error);
        });
    },
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
