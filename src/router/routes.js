import { useAuth } from "@/stores/auth.js";
import { checkToken } from "../controllers/userController";
import { useToast } from "vue-toastification";

export default async function routes(to, from, next) {
  const auth = useAuth();

  if (process.env.VUE_APP_SYSTEM_AUTH == 0) return next();

  if (to.name === "login") {
    auth.isAuth ? next({ name: "index" }) : next();
    return;
  }

  if (to.meta?.auth) {
    if (to.meta.role) {
      if (!auth.isAuth) return next({ name: "login" }), useToast().error("Faça login primeiro");
      const requiredRole = to.meta.role;
      await checkToken().then((response) => {
        console.log("🚀 ~ file: routes.js:20 ~ awaitcheckToken ~ response:", response);
        if (response.status !== 200)
          return next({ name: "login" }), useToast().error("Faça login novamente");

        if (requiredRole > response.data.userData.role)
          return next({ name: "index" }), useToast().error("Sem permissão");

        next();
      });
    }
  }
}
