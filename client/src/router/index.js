import { createRouter, createWebHistory } from "vue-router";
import index from "../components/index.vue";
import monitor from "../components/monitor.vue";
import sorting from "../components/sorting.vue";
import admin from "../components/admin.vue";
import config from "../components/config.vue";

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
        path: "/sorting",
        name: "sorting",
        component: sorting,
    },
    {
        path: "/admin",
        name: "admin",
        component: admin,
    },
    {
        path: "/config",
        name: "config",
        component: config,
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;
