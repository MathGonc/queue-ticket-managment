import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import Toast from "vue-toastification";
import router from "./router";
import { useAuth } from "@/stores/auth.js";
import { vMaska } from "maska";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "vue-toastification/dist/index.css";
const options = {};

//axios.defaults.withCredentials = true;
//axios.defaults.baseURL = config.url;

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use("maska", vMaska);
app.use(router);
app.use(Toast, options);

if (localStorage.getItem("token")) {
  (async () => {
    const auth = useAuth();
    try {
      auth.setIsAuth(true);
      await auth.checkToken();
    } catch (error) {
      auth.clearToken();
    }
  })();
}

app.mount("#app");
