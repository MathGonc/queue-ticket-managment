import { createRouter, createWebHistory } from "vue-router";
import index from "../components/index.vue";
import monitor from "../components/monitor.vue";
import admin from "../components/admin.vue";

const routes = [
  {
    path: "/",
    name: "index",
    component: index,
  },
  {
    path: "/monitor",
    name: "monitor",
    component: monitor,
  },
  {
    path: "/admin",
    name: "admin",
    component: admin,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
