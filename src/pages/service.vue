<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-50 p-3">
          <div class="row">
            <div class="col">
              <!-- <h5 v-if="globalTicketData.currentNumber != -1">
                Senha atual: {{ globalTicketData.currentNumber }} ({{
                  globalTicketData.currentUser
                }}) (Guichê: {{ globalTicketData.currentTable }})
              </h5>
              <br /> -->
              <div class="input-group mb-1 justify-content-center">
                <span class="input-group-text" id="basic-addon1">Guichê:</span
                ><input
                  type="number"
                  id="counter"
                  min="00"
                  max="99"
                  maxlength="2"
                  v-model="myTable"
                />
              </div>
              <div class="form-check form-switch py-2">
                <label class="form-check-label" for="flexSwitchCheckDefault">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="this.callTicketByName"
                  />Chamar pelo nome</label
                >
              </div>
              <span class="px-1"
                ><button
                  type="button"
                  @click="callNextTicket"
                  :disabled="buttonDisabled"
                  class="btn btn-outline-primary"
                >
                  Chamar Próxima Senha
                </button></span
              >

              <span class="px-1" v-if="myCalledTicketData.number"
                ><button
                  type="button"
                  @click="callSameTicket"
                  :disabled="buttonDisabled || !myCalledTicketData.number"
                  class="btn btn-outline-primary"
                >
                  Chamar senha {{ myCalledTicketData.number }} novamente
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
import { useLocalStorage } from "@vueuse/core";
import {
  getGlobalTicketData,
  updateGlobalTicketData,
} from "../controllers/globalController";
import {
  loadTicketsInQueue,
  updateTicketCalled,
} from "../controllers/ticketController";

import topbar from "../components/topbar";

export default {
  name: "page_admin",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
      callTicketByName: useLocalStorage("callTicketByName", true) || null,
      myTable: localStorage.getItem("myTable") || null,
      myCalledTicketData:
        useLocalStorage("myCalledTicketData", {
          _id: "",
          name: "",
          number: 0,
        }) || null,
      buttonDisabled: false,

      globalTicketData: {
        nextToQueue: -1,
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
  setup() {
    const userData = useLocalStorage("userData", { username: "" });
    return { userData };
  },
  async mounted() {
    this.setGlobalTicketData();

    this.transitionFade = true;

    socket.on("receiveUpdateGlobal", () => {
      this.setGlobalTicketData();
    });
  },
  watch: {
    myTable(newValue) {
      localStorage.setItem("myTable", newValue);
    },
  },
  methods: {
    setButtonDisabled() {
      if (process.env.VUE_APP_DEV == 1) return 0;
      this.buttonDisabled = true;
      setTimeout(() => {
        this.buttonDisabled = false;
      }, 5000);
      return 1;
    },
    async setGlobalTicketData() {
      await getGlobalTicketData().then((responseTicketData) => {
        this.globalTicketData = responseTicketData.data.ticket;
      });
    },
    async callNextTicket() {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();
      if (this.myTable < 1) return useToast().error("Selecione seu guichê");

      const loadResponse = await loadTicketsInQueue();
      if (loadResponse.data.ticket.length < 1)
        return useToast().error("Nenhuma senha cadastrada");
      if (loadResponse.data.ticket[0].status == 2)
        return useToast().error("Todas as senhas já foram atendidas");
      this.nextTicketData = loadResponse.data.ticket[0];

      await this.setGlobalTicketData();

      const updateGlobalResponse = await updateGlobalTicketData({
        ticket: {
          nextToQueue: this.globalTicketData.nextToQueue,
          currentNumber: this.nextTicketData.number,
          currentTable: this.myTable,
          currentUser: this.nextTicketData.name,
          lastNumber: this.globalTicketData.currentNumber,
          lastTable: this.globalTicketData.currentTable,
          lastUser: this.globalTicketData.currentUser,
        },
      });
      if (updateGlobalResponse.status != 200)
        return useToast().error("Ocorreu um erro");

      this.nextTicketData.status = 2;
      this.nextTicketData.servicedBy = this.userData.username;
      this.nextTicketData.dateServiced = new Date();
      const updateTicketResponse = await updateTicketCalled(
        this.nextTicketData._id,
        {
          ...this.nextTicketData,
        }
      );
      if (updateTicketResponse.status != 200)
        return useToast().error("Ocorreu um erro");

      await socket.emit("signalUpdateValues");
      await socket.emit("signalUpdateMonitor", this.callTicketByName);

      this.myCalledTicketData = this.nextTicketData;
    },
    async callSameTicket() {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();
      if (!this.myCalledTicketData.number)
        return useToast().error("Você não chamou nenhum ticket recentemente");

      await this.setGlobalTicketData();

      if (
        this.myCalledTicketData.number != this.globalTicketData.currentNumber
      ) {
        const updateGlobalResponse = await updateGlobalTicketData({
          ticket: {
            nextToQueue: this.globalTicketData.nextToQueue,
            currentNumber: this.myCalledTicketData.number,
            currentTable: this.myTable,
            currentUser: this.myCalledTicketData.name,
            lastNumber: this.globalTicketData.currentNumber,
            lastTable: this.globalTicketData.currentTable,
            lastUser: this.globalTicketData.currentUser,
          },
        });
        if (updateGlobalResponse.status != 200)
          return useToast().error("Ocorreu um erro");
      }

      await socket.emit("signalUpdateValues");
      await socket.emit("signalUpdateMonitor", this.callTicketByName);
    },
  },
};
</script>

<style scoped></style>
