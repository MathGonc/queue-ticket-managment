<template>
  <topbar></topbar>
  <div class="login">
    <span class="title_page">Autenticação</span>
    <transition-group>
      <div v-if="transitionFade">
        <div class="container w-25 p-3">
          <div class="row">
            <div class="col">
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
import { useAuth } from "@/stores/auth.js";
import { ref } from "vue";
import topbar from "../components/topbar";

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
    const auth = useAuth();
    const login = ref("");
    const password = ref("");

    function handleLogin() {
      const loginData = { login: login.value, password: password.value };
      auth.login(loginData);
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
