<template>
  <div class="monitor">
    <h2>Monitor de Senhas</h2>
    <h1>Senha Atual: {{ currentTicket }}</h1>
    <h3>Guichê: {{ currentTable }}</h3>

    <h4>Última Senha: {{ lastTicket }} - Guichê: {{ lastTable }}</h4>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "monitor_page",
  data() {
    return {};
  },
  mounted() {
    this.$store.dispatch("fetchVariables");
    window.addEventListener("keydown", this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  },
  methods: {
    updatelastTicket() {
      this.lastTicket = this.currentTicket;
      this.lastTable = this.currentTable;
    },
    handleKeyPress(event) {
      if (event.key === "n" || event.key === "N") {
        this.callNextPassword();
      }
    },
    callNextPassword() {
      this.$store.dispatch("updateCurrentTicket");
      this.$store.dispatch("updateVariables");
    },
  },
  computed: {
    ...mapState(["currentTicket", "currentTable", "lastTicket", "lastTable"]),
  },
};
</script>

<style scoped>
.monitor {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
