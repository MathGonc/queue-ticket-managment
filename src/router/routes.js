import { useAuth } from "@/stores/auth.js";
import { useToast } from "vue-toastification";

export default async function routes(to, from, next) {
  const auth = useAuth();

  if (process.env.VUE_APP_SYSTEM_AUTH == 0) return next();

  if (to.name === "login") {
    auth.isAuth ? next({ name: "index" }) : next();
    return;
  }

  if (to.meta?.auth) {
    if (auth.isAuth) {
      if (to.meta.role) {
        await auth.checkToken().then((data) => {
          const requiredRole = to.meta.role;
          requiredRole <= data.userData.role
            ? next()
            : (next({ name: "index" }), useToast().error("Sem permissão"));
        });
      }
    } else {
      if (to.name != "index") useToast().error("Faça login primeiro");
      next({ name: "login" });
    }
  }
}
