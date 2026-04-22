import axios from "axios";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export const api = axios.create({
  baseURL: `${API_ROOT}/api/chamber`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_ROOT };

export function photoUrl(filename) {
  if (!filename) return "";
  return `${API_ROOT}/uploads/${encodeURIComponent(filename)}`;
}

