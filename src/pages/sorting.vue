<template>
  <div class="sorting">
    <topbar></topbar>
    <span class="title_page">Painel de triagem</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <form @submit.prevent="handleRegisterTicket()">
                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text" id="inputGroup-sizing-sm">*Nome:</span>
                  <input
                    type="text"
                    class="form-control"
                    maxlength="50"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="inputTicket.name" />
                </div>

                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text" id="inputGroup-sizing-sm">CPF:</span>
                  <input
                    type="text"
                    class="form-control"
                    maxlength="18"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-maska="inputTicket.docNumber"
                    v-model="inputTicket.docNumber.masked"
                    data-maska="###.###.###-##" />
                </div>

                <div class="input-group input-group-sm mb-3">
                  <button
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false">
                    Tipo:
                  </button>
                  <ul class="dropdown-menu">
                    <li v-for="item in dropdownTicketTypes" :key="item.name">
                      <a class="dropdown-item" href="#" @click="inputTicket.type = item.name">{{
                        item.name
                      }}</a>
                    </li>
                  </ul>
                  <input
                    type="text"
                    class="form-control"
                    maxlength="50"
                    aria-label="Text input with dropdown button"
                    v-model="inputTicket.type" />
                </div>

                <div class="form-check form-switch">
                  <label class="form-check-label" for="flexSwitchCheckDefault">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="flexSwitchCheckDefault"
                      v-model="inputTicket.preferential" />
                    Preferencial</label
                  >
                </div>
                <button type="submit" class="btn btn-outline-primary" :disabled="buttonDisabled">
                  Cadastrar Senha {{ ticketGlobalData.nextToQueue }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { insertTicket } from "../controllers/ticketController";
import { getGlobalTicketData, updateGlobalTicketData } from "../controllers/globalController";
import { vMaska } from "maska";

import { useAuth } from "../stores/auth.js";
import { checkToken } from "../controllers/userController";
import topbar from "../components/topbar";

export default defineComponent({
  name: "page_sorting",
  components: {
    topbar,
  },
  directives: { maska: vMaska },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      userData: {},
      inputTicket: {
        name: "",
        docNumber: {
          masked: "",
          unmasked: "",
        },
        type: "",
        preferential: false,
      },
      ticketGlobalData: {},
      dropdownTicketTypes: [
        { name: "INICIAL" },
        { name: "AGENDAMENTO" },
        { name: "RETORNO" },
        { name: "INFORMAÇÕES" },
        { name: "JUNTADA DE DOCUMENTOS" },
      ],
    };
  },
  setup() {
    const auth = useAuth();
    return {
      auth,
    };
  },
  async mounted() {
    if (this.auth.isAuth) {
      await checkToken().then((response) => {
        this.userData = response.data.userData;
      });
    }
    this.transitionFade = true;
    await this.handleGetGlobalTicketData();
    socket.on("receiveUpdateGlobal", () => {
      this.handleGetGlobalTicketData();
    });
  },
  methods: {
    formatValue(value) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    },
    unformatValue(value) {
      return value.replace(/[.-]/g, "");
    },
    setButtonDisabled() {
      if (process.env.VUE_APP_DEV == 1) return 0;
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 5000);
      return 1;
    },
    async handleGetGlobalTicketData() {
      await getGlobalTicketData().then((response) => {
        this.ticketGlobalData = response.data.ticket;
      });
    },
    async handleRegisterTicket() {
      if (this.inputTicket.name.length < 1) return useToast().error("Digite um nome");
      //if (!this.inputTicket.docNumber.masked.length) return useToast().error("Digite um CPF");
      // if (this.inputTicket.type.length < 1) return useToast().error("Digite ou selecione um tipo");

      if (this.buttonDisabled) return;
      this.setButtonDisabled();

      const getDataResponse = this.handleGetGlobalTicketData();
      console.log(getDataResponse);

      const insertResponse = await insertTicket({
        number: this.ticketGlobalData.nextToQueue,
        status: 1,
        type: this.inputTicket.type,
        queuedBy: this.userData.username,
        preferential: this.inputTicket.preferential,
        name: this.inputTicket.name,
        docNumber: this.inputTicket.docNumber.unmasked,
        dateQueue: Date.now(),
      });
      if (insertResponse.status != 200)
        return useToast().error("Ocorreu um erro ao cadastrar a senha");
      useToast().success("Usuario cadastrado com sucesso");
      this.nextTicketToQueue += 1;

      this.inputTicket.name = "";
      this.inputTicket.docNumber.masked = "";
      this.inputTicket.type = "";
      this.inputTicket.preferential = false;

      this.ticketGlobalData.nextToQueue += 1;
      const updateResponse = await updateGlobalTicketData({
        ticket: this.ticketGlobalData,
      });
      if (updateResponse.status != 200)
        return useToast().error("Ocorreu um erro ao atualizar a lista");
      socket.emit("signalUpdateValues");
    },
  },
});
</script>

<style scoped></style>
