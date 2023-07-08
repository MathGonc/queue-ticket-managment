import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import Toast from "vue-toastification";
//import axios from "axios";
//import config from "../config";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "vue-toastification/dist/index.css";
const options = {};

//axios.defaults.withCredentials = true;
//axios.defaults.baseURL = config.url;

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(Toast, options);

app.mount("#app");
