<template>
  <div class="index">
    <topbar></topbar>
    <span class="title_page">Sistema de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="buttons">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="this.$router.push({ name: 'service' })">
            Atendimento
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="this.$router.push({ name: 'sorting' })">
            Triagem
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="this.$router.push({ name: 'monitor' })">
            Monitor
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="this.$router.push({ name: 'history' })">
            Histórico de atendimentos
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="this.$router.push({ name: 'config' })">
            Configurações
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import topbar from "../components/topbar";
export default {
  name: "page_index",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
    };
  },
  mounted() {
    this.transitionFade = true;
  },
  methods: {},
};
</script>

<style scoped>
.index {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons {
  margin-top: 20px;
}

.btn {
  font-weight: bold;
  display: block;
  min-width: 300px;
  min-height: 50px;
  margin: 10px;
}
</style>
