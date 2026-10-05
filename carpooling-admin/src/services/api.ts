import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS, ROUTES, STORAGE_KEYS } from "@/constants";
import { clearAuthStorage, getRefreshToken, setRefreshToken } from "@/lib/authStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest =
      typeof originalRequest?.url === "string" &&
      originalRequest.url.includes("/auth/");
    const isOnAuthPage = window.location.pathname.startsWith("/auth");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthStorage();
        if (!isOnAuthPage) {
          window.location.href = ROUTES.auth.login;
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.auth.refreshToken}`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        localStorage.setItem(STORAGE_KEYS.token, newAccessToken);
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken);
        }

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        if (!isOnAuthPage) {
          window.location.href = ROUTES.auth.login;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
