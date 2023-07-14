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
                    <a class="dropdown-item" href="#" @click="inputTypeTicket = item.name">{{
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
                Cadastrar Senha {{ globalStore.nextTicketEnterInQueue }}
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
import { useGlobalStore } from "@/stores/global";
import { insertTicket } from "../controllers/ticketController";
import {
  getCurrentTicketRegistred,
  updateCurrentTicketRegistred,
} from "../controllers/globalController";

import topbar from "../components/topbar";

export default defineComponent({
  name: "page_sorting",
  components: {
    topbar,
  },
  setup() {
    const globalStore = useGlobalStore();
    // const ticketInQueue = computed(() => globalStore.ticketInQueue);
    // const ticketType = computed(() => globalStore.ticketType);
    // const ticketPreferential = computed(() => globalStore.ticketPreferential);
    // const ticketName = computed(() => globalStore.ticketName);

    return {
      globalStore,
      // ticketInQueue,
      // ticketType,
      // ticketPreferential,
      // ticketName,
    };
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      currentTicketRegistred: -1,
      inputTicket: {
        name: "",
        type: "",
        preferential: false,
      },
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
    await this.handleGetNextNumRegister();
    await this.globalStore.getGlobalVariablesAPI();
    socket.on("receiveUpdateGlobal", () => {
      this.globalStore.getGlobalVariablesAPI().then(() => {
        //this.getNextTicketEnterInQueue();
      });
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
    async handleGetNextNumRegister() {
      await getCurrentTicketRegistred().then((response) => {
        this.currentTicketRegistred = response.currentTicketRegistred;
      });
    },
    async handleRegisterTicket() {
      if (this.inputTicket.name.length < 1) return useToast().error("Digite um nome");
      if (this.inputTicket.type.length < 1) return useToast().error("Digite ou selecione um tipo");

      this.setButtonDisabled();

      await this.handleGetNextNumRegister();
      const inputTicketData = {
        number: this.currentTicketRegistred,
        status: 1,
        type: this.inputTicket.type,
        preferential: this.inputTicket.preferential,
        name: this.inputTicket.name,
        dateQueue: Date.now(),
      };
      await insertTicket(inputTicketData).then((response) => {
        if (response.status == 200) {
          useToast().success("Usuario cadastrado com sucesso");
          this.globalStore.updateVariablesInAPI();
          socket.emit("signalUpdateValues");
          this.currentTicketRegistred += 1;

          const updatedData = {
            currentTicketRegistred: this.currentTicketRegistred,
          };
          updateCurrentTicketRegistred(updatedData);
        }
      });
    },
  },
});
</script>

<style scoped></style>
