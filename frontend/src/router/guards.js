import { useAuth } from "@/stores/auth";
import { useToast } from "vue-toastification";
import { checkToken } from "@/controllers/userController";
import config from "@/config";

/**
 * Guard global de navegacao. Mesmo comportamento do guard original
 * (legacy src/router/routes.js):
 *  - VITE_SYSTEM_AUTH=0 pula a verificacao das telas
 *  - logado tentando abrir /login vai para o inicio
 *  - rota protegida: confere o token NO SERVIDOR a cada navegacao (isso
 *    tambem recarrega userData, entao o cargo esta certo mesmo apos F5)
 *  - cargo insuficiente: volta para o inicio com "Sem permissao"
 *
 * @param {import('vue-router').Router} router
 */
export function setupGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuth();

    if (config.systemAuth == 0) return true;

    if (to.name === "login") {
      return auth.isAuth ? { name: "index" } : true;
    }

    // to.meta ja vem mesclado com o meta das rotas pai
    if (!to.meta?.auth) return true;

    if (!auth.isAuth || !auth.token) {
      useToast().error("Faça login primeiro");
      return { name: "login" };
    }

    const response = await checkToken();
    if (response?.status !== 200) {
      useToast().error("Faça login novamente");
      return { name: "login" };
    }

    const requiredRole = to.meta.role || 0;
    if (requiredRole > (auth.userData?.role || 0)) {
      useToast().error("Sem permissão");
      // Sem acesso nem ao inicio: encerra a sessao para nao entrar em loop
      if (to.name === "index") {
        auth.clearToken();
        return { name: "login" };
      }
      return { name: "index" };
    }

    return true;
  });
}
