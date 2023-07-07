import { createRouter, createWebHistory } from "vue-router";

import index from "../pages/index.vue";
import login from "../pages/login.vue";
import monitor from "../pages/monitor.vue";
import sorting from "../pages/sorting.vue";
import service from "../pages/service.vue";
import config from "../pages/config.vue";

import sidebar from "../components/sidebar";

const routes = [
  {
    path: "/",
    name: "index",
    component: index,
  },
  {
    path: "/login",
    name: "login",
    component: login,
  },
  {
    path: "/monitor",
    name: "monitor",
    component: monitor,
  },
  {
    path: "/admin",
    name: "admin",
    component: sidebar,
    children: [
      {
        path: "sorting",
        name: "sorting",
        component: sorting,
      },
      {
        path: "service",
        name: "service",
        component: service,
      },
      {
        path: "config",
        name: "config",
        component: config,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
