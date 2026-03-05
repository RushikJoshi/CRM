import axios from "axios";

const API = axios.create({
  baseURL: "https://app.gitakshmilabs.com/api",
  // baseURL: "http://localhost:5000/api",
});

// Automatically attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;