import { useAuth } from "@/stores/auth";

/**
 * Configura o navigation guard global (beforeEach) no router.
 * Verifica autenticação e role antes de permitir navegação.
 * Importante: verifica existência do token ANTES de qualquer chamada à API.
 *
 * @param {import('vue-router').Router} router
 */
export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const auth = useAuth();

    // Rotas que não requerem autenticação (login, rotas com auth: false)
    if (to.meta.auth === false || to.name === "login") {
      return next();
    }

    // Verificar se a rota ou algum parent requer auth
    const requiresAuth = to.matched.some(
      (record) => record.meta.auth === true
    );

    if (!requiresAuth) {
      return next();
    }

    // Verificar existência do token ANTES de chamar qualquer API
    if (!auth.token) {
      return next({ name: "login" });
    }

    // Verificar role: pegar o role mais restritivo da rota (próprio ou parent)
    const requiredRole = to.meta.role
      || to.matched.reduce((maxRole, record) => {
        return record.meta.role > maxRole ? record.meta.role : maxRole;
      }, 0);

    if (requiredRole && auth.userData?.role < requiredRole) {
      return next({ name: "login" });
    }

    next();
  });
}
