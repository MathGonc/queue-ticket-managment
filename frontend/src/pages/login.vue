<template>
  <topbar large></topbar>
  <div class="login">
    <span class="title_page">Autenticação</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default login-card">
              <form @submit.prevent="handleLogin">
                <label class="form-label" for="login-user">Login</label>
                <input
                  id="login-user"
                  v-model="login"
                  type="text"
                  class="form-control mb-3"
                  autocomplete="username"
                  placeholder="nome.sobrenome"
                  required />

                <label class="form-label" for="login-pass">Senha</label>
                <input
                  id="login-pass"
                  v-model="password"
                  type="password"
                  class="form-control mb-4"
                  autocomplete="current-password"
                  required />

                <button type="submit" class="btn btn-primary w-100">Entrar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { toast } from "@/services/notify.js";
import { useRouter } from "vue-router";
import topbar from "@/components/topbar.vue";
import { loginUser } from "@/controllers/userController.js";
import { useAuth } from "@/stores/auth.js";

defineOptions({
  name: "page_login",
});

const router = useRouter();
const auth = useAuth();

const login = ref("");
const password = ref("");
const transitionFade = ref(false);

async function handleLogin() {
  const response = await loginUser({ login: login.value, password: password.value });
  if (!response) return toast.error("Erro de conexão com o servidor");
  if (response.status === 401) return toast.error("Conta não encontrada");
  if (response.status === 429) return toast.error(response.data?.error || "Muitas tentativas. Aguarde 1 minuto.");
  if (response.status === 400) return toast.error(response.data?.errors?.[0]?.msg || "Preencha login e senha");
  if (response.status !== 200) return toast.error("Ocorreu um erro interno");
  auth.setToken(response.data.token);
  auth.setUserData(response.data.user);
  router.push({ name: "index" });
}

onMounted(() => {
  transitionFade.value = true;
});
</script>

<style scoped>
.login-card {
  width: min(340px, 90vw);
}
</style>
