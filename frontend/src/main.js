import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuth } from "@/stores/auth.js";
import { vMaska } from "maska/vue";
import { setAppReady } from "@/socket.js";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "vue-sonner/style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Token salvo = sessao presumida. A validacao no servidor (e o carregamento
// de userData/cargo) e feita pelo guard antes de abrir qualquer tela
// protegida, entao precisa vir antes do app.use(router).
const auth = useAuth();
if (auth.token) auth.setIsAuth(true);

app.directive("maska", vMaska);
app.use(router);

app.mount("#app");

// Signal that the app is ready for toast notifications
setAppReady();
