const app = new Vue({
  el: "#app",
  methods: {
    goToMonitor() {
      window.location.href = "pages/monitor.vue";
    },
    goToAdmin() {
      window.location.href = "pages/admin.html";
    },
  },
});
