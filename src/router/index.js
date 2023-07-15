import { createRouter, createWebHistory } from "vue-router";
import routes from "@/router/routes.js";

import index from "../pages/index.vue";
import login from "../pages/login.vue";
import monitor from "../pages/monitor.vue";
import sorting from "../pages/sorting.vue";
import service from "../pages/service.vue";
import config from "../pages/config.vue";
import sidebar from "../components/sidebar.vue";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: login,
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
      preserveState: true,
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
          path: "config",
          name: "config",
          component: config,
          meta: { role: 3 },
        },
      ],
    },
  ],
});

router.beforeEach(routes);

export default router;
