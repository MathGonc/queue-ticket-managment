import { createRouter, createWebHistory } from "vue-router";
import index from "../components/index.vue";
import monitor from "../views/monitor.vue";
import admin from "../views/admin.vue";

const routes = [
  {
    path: "/",
    name: "index",
    component: index,
  },
  {
    path: "/",
    name: "monitor",
    component: monitor,
  },
  {
    path: "/",
    name: "admin",
    component: admin,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
