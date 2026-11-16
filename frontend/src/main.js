import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import Toast from "vue-toastification";
import router from "./router";
import { useAuth } from "@/stores/auth.js";
import { checkToken } from "./controllers/userController";
import { vMaska } from "maska/vue";
import { setAppReady } from "@/socket.js";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "vue-toastification/dist/index.css";

const toastOptions = {};

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.directive("maska", vMaska);
app.use(router);
app.use(Toast, toastOptions);

// Guard: only verify token on startup if one exists in localStorage
const auth = useAuth();
if (auth.token) {
  (async () => {
    try {
      auth.setIsAuth(true);
      const response = await checkToken();
      if (response?.data?.userData) {
        auth.setUserData(response.data.userData);
      }
    } catch (error) {
      auth.clearToken();
    }
  })();
}

app.mount("#app");

// Signal that the app is ready for toast notifications
setAppReady();
