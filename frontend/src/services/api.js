import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://app.gitakshmilabs.com/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Global 401 handler — clears session and redirects to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.replace("/");
    }
    return Promise.reject(err);
  }
);

export default API;