import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "../store";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
const options = {};

const app = createApp(App);
app.use(router);
app.use(store);
app.mount("#app");
app.use(Toast, options);
