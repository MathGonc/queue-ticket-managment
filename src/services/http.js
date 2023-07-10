import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.VUE_APP_URL + ":" + process.env.VUE_APP_PORT_SERVER,
  headers: {
    "Content-type": "application/json",
  },
});

export default axiosInstance;
