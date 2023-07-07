import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import auth from "./auth";
import globalStore from "./global";

// Create store
const store = createStore({
  modules: {
    auth,
    global: globalStore,
  },
  plugins: [createPersistedState()],
});

export default store;
