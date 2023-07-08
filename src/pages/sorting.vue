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
                  v-model="inputName" />
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
                  v-model="inputTypeTicket" />
              </div>

              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckDefault">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="flexSwitchCheckDefault"
                    v-model="preferential" />
                  Preferencial</label
                >
              </div>
              <button
                type="button"
                @click="cadastrarSenha()"
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
import { defineComponent, computed } from "vue";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import topbar from "../components/topbar";
import { useGlobalStore } from "@/stores/global";

export default defineComponent({
  name: "page_sorting",
  components: {
    topbar,
  },
  setup() {
    const globalStore = useGlobalStore();
    const ticketInQueue = computed(() => globalStore.ticketInQueue);
    const ticketType = computed(() => globalStore.ticketType);
    const ticketPreferential = computed(() => globalStore.ticketPreferential);
    const ticketName = computed(() => globalStore.ticketName);

    return {
      globalStore,
      ticketInQueue,
      ticketType,
      ticketPreferential,
      ticketName,
    };
  },
  data() {
    return {
      transitionFade: false,
      buttonDisabled: false,
      nextNumberTicket: -1,
      inputName: "",
      inputTypeTicket: "",
      preferential: false,
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
    cadastrarSenha() {
      if (this.inputName.length < 1) {
        return useToast().error("Digite um nome");
      }
      if (this.inputTypeTicket.length < 1) {
        return useToast().error("Digite ou selecione um tipo");
      }
      // Procurar a primeira posição vaga na array ticketInQueue
      const index = this.globalStore.nextTicketEnterInQueue;

      if (index == -1) return useToast().error("Sem espaço disponivel para novas senhas");
      this.ticketInQueue[index] = 1;
      this.ticketType[index] = this.inputTypeTicket;
      this.ticketPreferential[index] = this.preferential ? 1 : 0;
      this.ticketName[index] = this.inputName;
      this.globalStore.setTicketData({
        index,
        ticketInQueue: this.ticketInQueue[index],
        ticketPreferential: this.ticketPreferential[index],
        ticketName: this.ticketName[index],

        ticketType: this.inputTypeTicket,
      });

      this.globalStore.updateVariablesInAPI();
      socket.emit("signalUpdateValues");

      this.inputName = "";
      this.inputTypeTicket = "";
      this.preferential = false;

      useToast().success("Usuario cadastrado com sucesso");

      this.setButtonDisabled();
    },
  },
});
</script>

<style scoped></style>
