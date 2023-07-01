const config = {
    port_server: "3030",
    port_client: "8080",
    url: `http://localhost`,
    url_server: ``,
    url_server_api: ``,
    url_client: ``,
};

config.url_server = `${config.url}:${config.port_server}`;
config.url_server_api = `${config.url}:${config.port_server}/api`;
config.url_client = `${config.url}:${config.port_client}`;

export default config;
