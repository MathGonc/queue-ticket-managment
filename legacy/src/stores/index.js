import { createPinia } from "pinia";

import { useAuth } from "./auth";
// import { useGlobalStore } from "./global";

createPinia().use(useAuth);
// createPinia().use(useGlobalStore);

export default pinia;
