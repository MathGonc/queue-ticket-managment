const config = {
  port_server: import.meta.env.VITE_PORT_SERVER,
  port_client: import.meta.env.VITE_PORT_CLIENT,
  url: import.meta.env.VITE_URL,
  url_server: import.meta.env.VITE_URL + ":" + import.meta.env.VITE_PORT_SERVER,
  url_server_api: import.meta.env.VITE_URL + ":" + import.meta.env.VITE_PORT_SERVER + "/api",
  url_client: import.meta.env.VITE_URL + ":" + import.meta.env.VITE_PORT_CLIENT,
  dev: import.meta.env.VITE_DEV,
  systemAuth: import.meta.env.VITE_SYSTEM_AUTH,
  userRoleToDeleteTickets: 3,
};

export default config;
