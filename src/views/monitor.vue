<template>
  <div class="index">
    <h1>{{ msg }}</h1>
    <div class="buttons">
      <button @click="goToMonitor" class="btn">Ir para Monitor</button>
      <button @click="goToAdmin" class="btn">Ir para Admin</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "monitor_page",
  props: {
    msg: String,
  },
};
</script>

<style scoped></style>
