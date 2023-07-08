import { createPinia } from "pinia";
import { useGlobalStore } from "./global";

const pinia = createPinia();

pinia.use(useGlobalStore);

export default pinia;
