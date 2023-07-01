import { createRouter, createWebHistory } from "vue-router";
import index from "../components/pages/index.vue";
import monitor from "../components/pages/monitor.vue";
import sorting from "../components/pages/sorting.vue";
import service from "../components/pages/service.vue";
import config from "../components/pages/config.vue";

import sidebar_admin from "../components/sidebar_admin.vue";

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
        component: sidebar_admin,
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
