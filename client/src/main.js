import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "../store";

const app = createApp(App);
app.use(router);
app.use(store);
app.mount("#app");

export const API_BASE_URL = "http://localhost:3030/api";
export const SERVER_URL = "http://localhost:3030";
