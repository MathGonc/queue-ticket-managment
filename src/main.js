import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "../store";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

const app = createApp(App);

const options = {
    // You can set your default options here
};

app.use(router);
app.use(store);
app.mount("#app");
app.use(Toast, options);
