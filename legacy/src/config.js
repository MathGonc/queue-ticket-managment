const config = {
  port_server: process.env.VUE_APP_PORT_SERVER,
  port_client: process.env.VUE_APP_PORT_CLIENT,
  url: process.env.VUE_APP_URL,
  url_server: process.env.VUE_APP_URL + ":" + process.env.VUE_APP_PORT_SERVER,
  url_server_api: process.env.VUE_APP_URL + ":" + process.env.VUE_APP_PORT_SERVER + "/api",
  url_client: process.env.VUE_APP_URL + ":" + process.env.VUE_APP_PORT_CLIENT,
  userRoleToDeleteTickets: 3,
};

export default config;
