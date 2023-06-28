<template>
  <div class="index">
    <img src="../assets/logo.png" alt="Logo" class="logo" />
    <h1>{{ msg }}</h1>
    <div class="buttons">
      <button @click="goToMonitor" class="btn">Monitor</button>
      <button @click="goToAdmin" class="btn">Admin</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "index_page",
  props: {
    msg: String,
  },
  methods: {
    goToMonitor() {
      this.$router.push("/monitor");
    },
    goToAdmin() {
      this.$router.push("/admin");
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
