import { reactive } from "vue";
import { io } from "socket.io-client";
import config from "../config.js";

export const state = reactive({
  connected: false,
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === "production" ? undefined : config.url_server;

export const socket = io(URL);

socket.on("connect", () => {
  state.connected = true;
  console.log(socket.id);
});

socket.on("disconnect", () => {
  state.connected = false;
  console.log(socket.id);
});
