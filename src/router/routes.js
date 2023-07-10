import { useAuth } from "@/stores/auth.js";
import { useToast } from "vue-toastification";

export default async function routes(to, from, next) {
  const auth = useAuth();

  if (to.name === "login") next();
  else if (to.meta?.auth) {
    if (auth.isAuth) {
      if (to.meta.role) {
        await auth.checkPermission().then((data) => {
          const requiredRole = to.meta.role;
          requiredRole <= data.role
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
