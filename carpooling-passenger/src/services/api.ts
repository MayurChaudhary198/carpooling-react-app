import axios from "axios";
import {
  clearAuthStorage,
  getRefreshToken,
  setRefreshToken,
} from "@/lib/authStorage";
import type { RefreshTokenResponse } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
      try {
        const response = await axios.post<
          RefreshTokenResponse | { data?: RefreshTokenResponse }
        >(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );
        const refreshData =
          "accessToken" in response.data ? response.data : response.data.data;
        if (!refreshData) {
          throw new Error("Failed to refresh session");
        }
        const newAccessToken = refreshData.accessToken;
        localStorage.setItem("token", newAccessToken);
        if (refreshData.refreshToken) {
          setRefreshToken(refreshData.refreshToken);
        }
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return api(originalRequest);
      } catch {
        clearAuthStorage();
        if (!isOnAuthPage) {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
