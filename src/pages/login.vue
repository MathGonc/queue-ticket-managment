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

<script>
import { ref } from "vue";
import { useToast } from "vue-toastification";
import topbar from "../components/topbar";
import { loginUser } from "../controllers/userController";
import { useAuth } from "../stores/auth";
import router from "../router";

export default {
  name: "page_login",
  components: {
    topbar,
  },
  data() {
    return {
      transitionFade: false,
    };
  },
  setup() {
    const login = ref("");
    const password = ref("");
    const auth = useAuth();
    async function handleLogin() {
      try {
        await loginUser({ login: login.value, password: password.value }).then((response) => {
          auth.setToken(response.data.token);
          router.push({ name: "index" });
        });
      } catch (error) {
        if (error.response.status == 401) useToast().error("Conta não encontrada");
      }
    }

    return {
      login,
      password,
      handleLogin,
    };
  },
  mounted() {
    this.transitionFade = true;
  },
};
</script>
