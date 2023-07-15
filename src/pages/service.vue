<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-50 p-3">
          <div class="row">
            <div class="col">
              <h5 v-if="ticketData.currentNumber != -1">
                Senha atual: {{ ticketData.currentNumber }} ({{ ticketData.currentUser }}) (Guichê:
                {{ ticketData.currentTable }})
              </h5>
              <br />
              <div class="input-group mb-3 justify-content-center">
                <span class="input-group-text" id="basic-addon1"
                  >Digite o número do seu guichê:</span
                ><input
                  type="number"
                  id="counter"
                  min="00"
                  max="99"
                  maxlength="2"
                  v-model="myTable" />
              </div>
              <br />
              <span
                ><button
                  type="button"
                  @click="callNextTicket"
                  :disabled="buttonDisabled"
                  class="btn btn-outline-primary">
                  Chamar Próxima Senha
                </button></span
              >

              <span v-if="myCalledTicket != -1"
                ><button
                  type="button"
                  @click="callSameTicket"
                  :disabled="myCalledTicket == -1"
                  class="btn btn-outline-primary">
                  Chamar senha {{ myCalledTicket }} novamente
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
//import { computed } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { getGlobalTicketData, updateGlobalTicketData } from "../controllers/globalController";
import { loadTicketsInQueue, updateTicketCalled } from "../controllers/ticketController";

import topbar from "../components/topbar";

export default {
  name: "page_admin",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
      myTable: localStorage.getItem("myTable") || null,
      myCalledTicket: -1,
      buttonDisabled: false,

      ticketData: {
        currentNumber: -1,
        currentTable: -1,
        currentUser: "",
        lastNumber: -1,
        lastTable: -1,
        lastUser: "",
      },
      nextTicketData: {},
    };
  },
  mounted() {
    this.handleGetGlobalTicketData();
    this.getNextTicketToCall();
    this.transitionFade = true;

    socket.on("receiveUpdateGlobal", () => {
      this.handleGetGlobalTicketData();
    });
  },
  watch: {
    myTable(newValue) {
      localStorage.setItem("myTable", newValue);
    },
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
        this.ticketData = response.data.ticket;
      });
    },
    async getNextTicketToCall() {
      await loadTicketsInQueue().then((response) => {
        response.data.ticket.length > 0
          ? (this.nextTicketToCall = response.data.ticket[0].number)
          : (this.nextTicketToCall = -1);
      });
    },
    async callNextTicket() {
      try {
        this.setButtonDisabled();
        if (this.myTable < 1) return useToast().error("Selecione seu guichê");

        const loadResponse = await loadTicketsInQueue();
        if (loadResponse.data.ticket.length < 1)
          return useToast().error("Nenhuma senha cadastrada");
        if (loadResponse.data.ticket[0].status == 2)
          return useToast().error("Todas as senhas já foram atendidas");
        this.nextTicketData = loadResponse.data.ticket[0];

        const loadGlobalResponse = await this.handleGetGlobalTicketData();
        console.log(loadGlobalResponse);

        const updateGlobalResponse = await updateGlobalTicketData({
          ticket: {
            nextToQueue: this.ticketData.nextToQueue,
            lastNumber: this.ticketData.currentNumber,
            lastTable: this.ticketData.currentTable,
            lastUser: this.ticketData.currentUser,
            currentNumber: this.nextTicketData.number,
            currentTable: this.myTable,
            currentUser: this.nextTicketData.name,
          },
        });
        if (updateGlobalResponse.status != 200) return useToast().error("Ocorreu um erro");

        const updateTicketResponse = await updateTicketCalled(this.nextTicketData._id);
        if (updateTicketResponse.status != 200) return useToast().error("Ocorreu um erro");

        await socket.emit("signalUpdateValues");
        await socket.emit("signalUpdateMonitor");
        this.myCalledTicket = parseInt(this.nextTicketToCall);
      } catch (error) {
        console.error(error);
      }
    },
    async callSameTicket() {
      if (this.myCalledTicket == -1)
        return useToast().error("Você não chamou nenhum ticket recentemente");

      // if (this.myCalledTicket != this.currentTicket) {
      //   await this.globalStore.updatedGlobalCurrentTicket({
      //     newTicket: parseInt(this.myCalledTicket),
      //     newTable: parseInt(this.myTable),
      //     newUser: this.ticketName[this.myCalledTicket],
      //   });
      //   await this.globalStore.updateVariablesAPI();
      // }

      await socket.emit("signalUpdateValues");
      await socket.emit("signalUpdateMonitor");
    },
  },
};
</script>

<style scoped></style>
