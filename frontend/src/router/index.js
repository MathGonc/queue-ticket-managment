import { createRouter, createWebHistory } from "vue-router";
import { setupGuards } from "./guards";
import { bindRouter } from "@/services/api.js";

// Static imports (layout wrapper and first page users see)
import sidebar from "@/components/sidebar.vue";
import login from "@/pages/login.vue";

// Lazy-loaded page components
const config = () => import("@/pages/config.vue");
const history = () => import("@/pages/history.vue");
const index = () => import("@/pages/index.vue");
const monitor = () => import("@/pages/monitor.vue");
const service = () => import("@/pages/service.vue");
const sorting = () => import("@/pages/sorting.vue");

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: login,
      meta: { auth: false, role: 0 },
    },
    {
      path: "/monitor",
      name: "monitor",
      component: monitor,
      meta: { auth: true, role: 1 },
    },
    {
      path: "/",
      name: "",
      component: sidebar,
      meta: { auth: true },
      children: [
        {
          path: "",
          name: "index",
          component: index,
          meta: { role: 1 },
        },
        {
          path: "sorting",
          name: "sorting",
          component: sorting,
          meta: { role: 2 },
        },
        {
          path: "service",
          name: "service",
          component: service,
          meta: { role: 2 },
        },
        {
          path: "history",
          name: "history",
          component: history,
          meta: { role: 2 },
        },
        {
          path: "config",
          name: "config",
          component: config,
          meta: { role: 3 },
        },
      ],
    },
    // URL inexistente: volta ao inicio (antes ficava tela em branco)
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "index" },
    },
  ],
});

setupGuards(router);
bindRouter(router);

export default router;
