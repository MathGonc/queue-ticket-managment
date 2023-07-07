<template>
  <div class="index">
    <topbar></topbar>
    <span class="title_page">Sistema de atendimento</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="buttons">
          <button type="button" class="btn btn-outline-primary" @click="goToService">
            <b>Atendimento</b>
          </button>
          <button type="button" class="btn btn-outline-primary" @click="goToSorting">
            <b>Triagem</b>
          </button>
          <button type="button" class="btn btn-outline-primary" @click="goToMonitor">
            <b>Monitor</b>
          </button>
          <button type="button" class="btn btn-outline-primary" @click="goToConfig">
            <b>Configurações</b>
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
  methods: {
    goToMonitor() {
      this.$router.push({ name: "monitor" });
    },
    goToService() {
      this.$router.push({ name: "service" });
    },
    goToSorting() {
      this.$router.push({ name: "sorting" });
    },
    goToConfig() {
      this.$router.push({ name: "config" });
    },
  },
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
  display: block;
  width: 200px;
  height: 50px;
  margin-bottom: 10px;
}
</style>
