import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  config.headers["Content-Type"] = "application/json";
  config.headers["Accept"] = "application/json";

  return config;
});

// Response interceptor (auto-refresh token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "token_not_valid"
    ) {
      console.warn("ACCESS TOKEN EXPIRED → refreshing…");

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        console.warn("NO REFRESH TOKEN");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/auth/refresh/",
          {
            refresh,
          },
        );

        // Save new access token
        localStorage.setItem("access", res.data.access);

        // Retry the original request
        error.config.headers.Authorization = `Bearer ${res.data.access}`;
        return api(error.config);
      } catch (refreshErr) {
        console.error("REFRESH FAILED → Logging out");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
