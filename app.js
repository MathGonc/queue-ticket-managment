const app = new Vue({
  el: "#app",
  methods: {
    goToMonitor() {
      window.location.href = "pages/monitor.html";
    },
    goToAdmin() {
      window.location.href = "pages/admin.html";
    },
  },
});
