<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
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
                  v-model="myTable" />
              </div>
              <div class="form-check form-switch py-2">
                <label class="form-check-label" for="flexSwitchCheckDefault">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="this.callTicketByName" />Chamar pelo nome</label
                >
              </div>
              <span class="px-1"
                ><button
                  type="button"
                  @click="callNextTicket"
                  :disabled="buttonDisabled"
                  class="btn btn-outline-primary">
                  Chamar Próxima Senha
                </button></span
              >

              <span class="px-1" v-if="myCalledTicketData.number"
                ><button
                  type="button"
                  @click="callSameTicket"
                  :disabled="buttonDisabled || !myCalledTicketData.number"
                  class="btn btn-outline-primary">
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
// import { socket } from "@/socket";
import { useLocalStorage } from "@vueuse/core";
// import { getGlobalTicketData } from "../controllers/globalController";
import { loadTicketsInQueue } from "../controllers/ticketController";
import { callTicket } from "../utils";
import { useAuth } from "@/stores/auth.js";

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
      myTable: useLocalStorage("myTable", 0),
      myCalledTicketData: useLocalStorage("myCalledTicketData", {
        _id: "",
        number: 0,
      }),
      buttonDisabled: false,

      // globalTicketData: {
      //   nextToQueue: -1,
      //   currentNumber: -1,
      //   currentTable: -1,
      //   currentUser: "",
      //   lastNumber: -1,
      //   lastTable: -1,
      //   lastUser: "",
      // },
      // nextTicketData: {},
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
      await this.auth.checkToken().then((data) => {
        this.userData = data.userData;
      });
    }

    this.transitionFade = true;
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
    // async setGlobalTicketData() {
    //   await getGlobalTicketData().then((responseTicketData) => {
    //     this.globalTicketData = responseTicketData.data.ticket;
    //   });
    // },
    async callNextTicket() {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();

      const loadResponse = await loadTicketsInQueue();
      if (loadResponse.data.ticket.length < 1) return useToast().error("Nenhuma senha cadastrada");

      if (loadResponse.data.ticket[0].status == 2)
        return useToast().error("Todas as senhas já foram atendidas");

      callTicket(loadResponse.data.ticket[0]._id);
    },
    async callSameTicket() {
      if (this.buttonDisabled) return;
      this.setButtonDisabled();
      if (this.myTable < 1) return useToast().error("Selecione seu guichê");
      if (!this.myCalledTicketData.number)
        return useToast().error("Você não chamou nenhum ticket recentemente");
      callTicket(this.myCalledTicketData._id);
    },
  },
};
</script>

<style scoped></style>
