import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import Toast from "vue-toastification";
import router from "./router";
import { useAuth } from "@/stores/auth.js";
import { checkToken } from "./controllers/userController";
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

const auth = useAuth();
if (auth.token) {
  (async () => {
    try {
      auth.setIsAuth(true);
      await checkToken().then((response) => {
        auth.setUserData(response.data.userData);
      });
    } catch (error) {
      auth.clearToken();
    }
  })();
}

app.mount("#app");
