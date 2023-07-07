<template>
  <div class="topbar">
    <nav>
      <img src="../assets/logo.png" alt="Logo" class="logo" />
    </nav>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "component_topbar",
  computed: {
    ...mapState({
      loggedIn: (state) => state.auth.loggedIn,
      // outras propriedades do estado de autenticação que você precisa
    }),
  },
};
</script>

<style></style>
