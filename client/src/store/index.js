// store/index.js
import { createStore } from "vuex";

export default createStore({
  state() {
    return {
      currentTicket: 0,
    };
  },
  mutations: {
    incrementCurrentTicket(state) {
      state.currentTicket++;
    },
  },
  actions: {
    updateCurrentTicket({ commit }) {
      commit("incrementCurrentTicket");
    },
  },
});
