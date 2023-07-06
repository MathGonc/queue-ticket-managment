<template>
  <div class="admin">
    <topbar></topbar>
    <span class="title_page">Painel de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-50 p-3">
          <div class="row">
            <div class="col">
              <h5 v-if="currentTicket != -1">
                Senha atual: {{ currentTicket }} ({{ currentUser }}) (Guichê: {{ currentTable }})
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
import { mapState } from "vuex";
import { useToast } from "vue-toastification";
import topbar from "../topbar";
import { socket } from "@/socket";

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
    };
  },
  mounted() {
    socket.connect();
    socket.on("receiveUpdateGlobal", () => {
      this.$store.dispatch("getGlobalVariablesAPI");
    });

    this.transitionFade = true;
  },
  watch: {
    myTable(newValue) {
      localStorage.setItem("myTable", newValue);
    },
  },
  computed: {
    ...mapState([
      "currentTicket",
      "currentTable",
      "currentUser",
      "lastTicket",
      "lastTable",
      "ticketInQueue",
      "ticketPreferential",
      "ticketName",
    ]),
  },
  methods: {
    callNextTicket() {
      if (this.myTable < 1) return useToast().error("Selecione seu guichê");
      let ticketIndex = -1;
      for (let i = 0; i < this.ticketInQueue.length; i++) {
        if (this.ticketInQueue[i] === 1 && this.ticketPreferential[i] === 1) {
          ticketIndex = i;
          break;
        }
      }

      // Se não houver ticket preferencial, procurar por tickets não preferenciais (ticketInQueue == 1)
      if (ticketIndex === -1) {
        for (let i = 0; i < this.ticketInQueue.length; i++) {
          if (this.ticketInQueue[i] === 1) {
            ticketIndex = i;
            break;
          }
        }
      }

      if (ticketIndex == -1) return useToast().error("Nenhuma senha cadastrada");
      let data = {
        newTicket: parseInt(ticketIndex),
        newTable: parseInt(this.myTable),
        newUser: this.ticketName[ticketIndex],
      };
      this.$store.dispatch("updatedGlobalCurrentTicket", data);

      this.currentTicket = ticketIndex.toString().padStart(3, "0");
      this.ticketInQueue[ticketIndex] = 2;
      this.ticketPreferential[ticketIndex] = 0;

      this.$store.dispatch("updateVariablesInAPI");

      socket.emit("signalUpdateValues");
      socket.emit("signalUpdateMonitor", ticketIndex);

      this.myCalledTicket = parseInt(ticketIndex);
      if (process.env.VUE_APP_DEV == 1) {
        this.buttonDisabled = true;
        setTimeout(() => {
          this.buttonDisabled = false;
        }, 10000);
      }
    },
    async callSameTicket() {
      if (this.myCalledTicket == -1)
        return useToast().error("Você não chamou nenhum ticket recentemente");

      if (this.myCalledTicket != this.currentTicket) {
        await this.$store.dispatch("updatedGlobalCurrentTicket", {
          newTicket: parseInt(this.myCalledTicket),
          newTable: parseInt(this.myTable),
          newUser: this.ticketName[this.myCalledTicket],
        });
        await this.$store.dispatch("updateVariablesInAPI");
      }

      await socket.emit("signalUpdateValues");
      await socket.emit("signalUpdateMonitor", this.myCalledTicket);
    },
  },
};
</script>

<style scoped></style>
