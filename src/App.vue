<template>
  <div id="app">
    <router-view></router-view>
    <nav v-if="this.showInterface" class="position-absolute top-0 end-0">
      <template v-if="auth.isAuth">
        <vue-feather type="user" size="16" class="icon" />
        {{ this.username }}
        <button class="btn btn-outline-dark btn-sm" @click="logout()">
          <vue-feather type="log-out" size="16" class="icon" />
        </button>
      </template>
    </nav>
  </div>
  <div class="navbar">
    <nav class="navbar small p-1 fixed-bottom">
      <span class="col small pt-auto px-2"
        >© 2025 - Matheus Gonçalves - Todos os direitos reservados.</span
      >
    </nav>
  </div>
</template>

<script>
import { socket } from "./socket";
import { useAuth } from "@/stores/auth.js";
import VueFeather from "vue-feather";
import { checkToken } from "./controllers/userController";

export default {
  name: "page_index",
  components: {
    "vue-feather": VueFeather,
  },
  data() {
    return {
      username: "",
      showInterface: true,
    };
  },
  watch: {
    $route() {
      this.$route.name == "monitor"
        ? (this.showInterface = false)
        : this.showInterface == false
        ? (this.showInterface = true)
        : false;
    },
  },
  setup() {
    const auth = useAuth();
    return {
      auth,
    };
  },
  computed: {},
  async mounted() {
    await checkToken().then((response) => {
      if (response.data.userData) this.username = this.auth.userData.username;
    });
    this.transitionFade = true;
    socket.connect();
  },
  methods: {
    async logout() {
      await this.auth.clearToken();
      await this.auth.setIsAuth(false);
      await this.$router.push({ name: "login" });
    },
  },
};
</script>

<style>
html,
body {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  opacity: 1;
  background-attachment: fixed;
  background-image: repeating-radial-gradient(
      circle at 0 0,
      transparent 0,
      #ffffff 10px
    ),
    repeating-linear-gradient(#eaeaea55, #eaeaea);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.navbar.fixed-bottom {
  background: #242424;
  color: #838383c7;
  text-align: right;
}

nav {
  /*background-color: #f1f1f1;*/
  padding: 5px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

.menu-default {
  text-align: center;
  background: #e0e0e067;
  border-radius: 10px;
  padding: 20px;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

/*.col > *:not(:last-child) {
    padding-right: 10px;
    padding-block: 10px;
}*/

.title_page {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
}

/* fade effect! */
.v-enter-active,
.v-leave-active {
  transition: opacity 1.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.icon {
  vertical-align: sub;
}

.debug {
  border: 1px solid rgba(247, 1, 1, 0.781);
}
</style>
