<template>
  <div class="admin">
    <h2>Painel de Administração - Guichê: {{ adminTable }}</h2>
    <label for="counter">Digite o número do guichê:</label>
    <input type="text" id="counter" v-model="adminTable" />
    <button @click="callNextPassword" class="btn">Chamar Próxima Senha</button>
  </div>
</template>

<script>
export default {
  name: "admin_page",
  data() {
    return {
      adminTable: "00",
    };
  },
  methods: {
    callNextPassword() {
      this.$store.dispatch("fetchVariables");
    },
  },
};
</script>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn {
  display: block;
  width: 200px;
  height: 50px;
  margin-top: 20px;
}
</style>
