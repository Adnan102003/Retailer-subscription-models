import api from "./axios";

export const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api$/, "");

export const chamberApi = {
  get: (url, config) => api.get(`/chamber${url}`, config),
  post: (url, data, config) => api.post(`/chamber${url}`, data, config),
  patch: (url, data, config) => api.patch(`/chamber${url}`, data, config),
  delete: (url, config) => api.delete(`/chamber${url}`, config)
};

export function photoUrl(filename) {
  if (!filename) return "";
  return `${API_ROOT}/uploads/${encodeURIComponent(filename)}`;
}
