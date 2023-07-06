<template>
  <div class="config">
    <topbar></topbar>
    <span class="title_page">Painel de configuração</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-25 p-3">
          <div class="row">
            <div class="col">
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
                  v-model="SetMonitorMode"
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
                    v-model="SetSoundNotification"
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
                    v-model="SetSoundCallTicket"
                    :disabled="buttonDisabled"
                  />
                  Voz ao chamar senha</label
                >
              </div>

              <div v-if="SetSoundCallTicket">
                <div
                  class="input-group input-group-sm mb-3 justify-content-center"
                >
                  <span class="input-group-text" id="basic-addon1"
                    >Tipo de voz:</span
                  ><select
                    class="selectpicker"
                    v-model="SetSoundCallTicketVoice"
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
              <span>
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  @click="resetAllTickets"
                  :disabled="buttonDisabled"
                >
                  Resetar senhas
                </button></span
              >
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import topbar from "../topbar";
import { mapState } from "vuex";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";

export default {
  name: "page_config",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      displayLanguage: 0,

      SetMonitorMode: null,
      SetSoundNotification: null,
      SetSoundCallTicket: null,
      SetSoundCallTicketVoice: null,
    };
  },
  async mounted() {
    this.transitionFade = true;

    this.SetMonitorMode = this.monitorMode;
    this.SetSoundNotification = this.soundNotification;
    this.SetSoundCallTicket = this.soundCallTicket;
    this.SetSoundCallTicketVoice = this.soundCallTicketVoice;
    console.log(this.soundCallTicketVoice);
  },
  computed: {
    ...mapState([
      "monitorMode",
      "soundNotification",
      "soundCallTicket",
      "soundCallTicketVoice",
    ]),
  },
  methods: {
    toggleSoundNotification() {
      this.soundNotification = 1;
    },
    setButtonDisabled() {
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 10000);
    },
    resetAllTickets() {
      this.$store
        .dispatch("resetStoreAllTickets")
        .then(() => {
          this.$store.dispatch("updateVariablesInAPI");
          socket.emit("signalUpdateValues");
          useToast().success("Senhas resetadas");
          this.setButtonDisabled();
        })
        .catch(() => {
          useToast().error("Erro ao resetar as senhas");
        });
    },
    saveConfigs() {
      const updatedData = {
        monitorMode: this.SetMonitorMode,
        soundNotification: this.SetSoundNotification,
        soundCallTicket: this.SetSoundCallTicket,
        soundCallTicketVoice: this.SetSoundCallTicketVoice,
      };

      this.$store
        .dispatch("updateGlobalConfigs", updatedData)
        .then(() => {
          useToast().success("Configurações salvas");
          this.setButtonDisabled();
        })
        .catch(() => {
          useToast().error("Erro ao salvar as configurações");
        });
    },
  },
};
</script>

<style scoped></style>
