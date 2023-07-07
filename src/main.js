import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import Toast from "vue-toastification";
import config from "../config";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "vue-toastification/dist/index.css";
const options = {};

axios.defaults.withCredentials = true;
axios.defaults.baseURL = config.url;
console.log(axios.defaults.baseURL);

const app = createApp(App);
app.use(router);
app.use(store);
app.use(Toast, options);

app.mount("#app");
