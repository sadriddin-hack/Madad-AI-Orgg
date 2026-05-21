import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("madad_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic retry on transient network drops (e.g. dev server restarts)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Check if network error (no response) and not yet retried
    if (!error.response && config && !config.__isRetryRequest) {
      config.__isRetryRequest = true;
      // Wait for 2 seconds to allow the server to reconnect/boot up
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export default api;
