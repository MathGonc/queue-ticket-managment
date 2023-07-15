<template>
  <div class="sorting">
    <topbar></topbar>
    <span class="title_page">Painel de triagem</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-25 p-3">
          <div class="row">
            <div class="col">
              <div class="input-group input-group-sm mb-3">
                <span class="input-group-text" id="inputGroup-sizing-sm">Nome:</span>
                <input
                  type="text"
                  class="form-control"
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  v-model="inputTicket.name" />
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
              <button
                type="button"
                @click="handleRegisterTicket()"
                class="btn btn-outline-primary"
                :disabled="buttonDisabled">
                Cadastrar Senha {{ ticketGlobalData.nextToQueue }}
              </button>
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
//import { useGlobalStore } from "@/stores/global";
import { insertTicket } from "../controllers/ticketController";
import { getGlobalTicketData, updateGlobalTicketData } from "../controllers/globalController";

import topbar from "../components/topbar";

export default defineComponent({
  name: "page_sorting",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      inputTicket: {
        name: "",
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
  async mounted() {
    this.transitionFade = true;
    await this.handleGetGlobalTicketData();
    socket.on("receiveUpdateGlobal", () => {
      this.handleGetGlobalTicketData();
    });
  },
  methods: {
    setButtonDisabled() {
      if (process.env.VUE_APP_DEV == 1) return;
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 5000);
    },
    async handleGetGlobalTicketData() {
      await getGlobalTicketData().then((response) => {
        this.ticketGlobalData = response.data.ticket;
      });
    },
    async handleRegisterTicket() {
      if (this.inputTicket.name.length < 1) return useToast().error("Digite um nome");
      if (this.inputTicket.type.length < 1) return useToast().error("Digite ou selecione um tipo");

      await this.setButtonDisabled();

      const getDataResponse = this.handleGetGlobalTicketData();
      console.log(getDataResponse);

      const insertResponse = await insertTicket({
        number: this.ticketGlobalData.nextToQueue,
        status: 1,
        type: this.inputTicket.type,
        preferential: this.inputTicket.preferential,
        name: this.inputTicket.name,
        dateQueue: Date.now(),
      });
      if (insertResponse.status != 200)
        return useToast().error("Ocorreu um erro ao cadastrar a senha");
      useToast().success("Usuario cadastrado com sucesso");
      this.nextTicketToQueue += 1;

      this.inputTicket.name = "";
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
