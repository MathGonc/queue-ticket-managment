import { createRouter, createWebHistory } from "vue-router";
import Index from "./components/index.vue";
import Monitor from "./components/monitor.vue";

const routes = [
  {
    path: "/",
    name: "Index",
    component: Index,
  },
  {
    path: "/monitor",
    name: "Monitor",
    component: Monitor,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
