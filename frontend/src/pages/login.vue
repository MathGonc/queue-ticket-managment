<template>
  <topbar></topbar>
  <div class="login">
    <span class="title_page">Autenticação</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container">
          <div class="row justify-content-md-center">
            <div class="col-md-auto menu-default">
              <form @submit.prevent="handleLogin">
                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text" id="inputGroup-sizing-sm">Login:</span>
                  <input
                    type="text"
                    class="form-control"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="login"
                    required />
                </div>

                <div class="input-group input-group-sm mb-3">
                  <span class="input-group-text" id="inputGroup-sizing-sm">Senha:</span>
                  <input
                    type="password"
                    class="form-control"
                    aria-label="Small"
                    aria-describedby="inputGroup-sizing-sm"
                    v-model="password"
                    required />
                </div>

                <button type="submit" class="btn btn-outline-primary">Login</button>
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
import { useToast } from "vue-toastification";
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
  const toast = useToast();
  const response = await loginUser({ login: login.value, password: password.value });
  if (!response) return toast.error("Erro de conexão com o servidor");
  if (response.status === 401) return toast.error("Conta não encontrada");
  if (response.status !== 200) return toast.error("Ocorreu um erro interno");
  auth.setToken(response.data.token);
  auth.setUserData(response.data.user);
  router.push({ name: "index" });
}

onMounted(() => {
  transitionFade.value = true;
});
</script>
