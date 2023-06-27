<template>
  <div class="monitor">
    <h1>Monitor de Senhas</h1>
    <div class="current-ticket">
      <h2>Tamanho Maior: {{ currentTicket + 1 }}</h2>
    </div>
    <div class="previous-ticket">
      <h2>Tamanho Menor: {{ previousTicket }}</h2>
    </div>
    <button @click="callNextTicket">Chamar Próxima Senha</button>
  </div>
</template>

<script>
export default {
  name: "monitor_page",
  data() {
    return {
      currentTicket: 0,
      previousTicket: null,
    };
  },
  methods: {
    callNextTicket() {
      this.previousTicket = this.currentTicket;
      this.currentTicket++;
    },
  },
};
</script>

<style scoped>
.monitor {
  text-align: center;
}

.current-ticket,
.previous-ticket {
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
