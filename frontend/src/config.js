// Endereco do backend. Com VITE_URL vazio, usa o mesmo host pelo qual o
// navegador abriu o frontend: o mesmo build funciona em qualquer IP/maquina
// sem precisar recompilar (ex.: http://172.30.24.32:8080 -> backend em :3030).
const serverHost =
  import.meta.env.VITE_URL || `${window.location.protocol}//${window.location.hostname}`;
const portServer = import.meta.env.VITE_PORT_SERVER || "3030";

const config = {
  port_server: portServer,
  url_server: `${serverHost}:${portServer}`,
  dev: import.meta.env.VITE_DEV,
  systemAuth: import.meta.env.VITE_SYSTEM_AUTH,
  userRoleToDeleteTickets: 3,
};

export default config;
