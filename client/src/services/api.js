import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { tokenManager } from "../utils/tokenManager";

const API = axios.create({
  baseURL: API_BASE_URL,
});

axios.defaults.baseURL = API_BASE_URL; // Consistent with user request
console.log("🌐 SERVICE BASE URL:", API_BASE_URL);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (err) => {
  const status = err.response?.status;
  if (!status) return true; // network / timeout
  return status >= 500 && status <= 599;
};

// Global error handler (per user request)
axios.interceptors.response.use(
  res => res,
  err => {
    console.error("API ERROR:", err);
    return Promise.reject(err);
  }
);
API.interceptors.response.use(
  res => res,
  err => {
    console.error("API ERROR (Scoped):", err);
    return Promise.reject(err);
  }
);

// ── Prevent Stale Cache ───────────────────────────────────────────────────────
API.defaults.headers.common["Cache-Control"] = "no-cache";
API.defaults.headers.common["Pragma"] = "no-cache";
API.defaults.headers.common["Expires"] = "0";

// ── Attach JWT from panel-isolated storage ────────────────────────────────────
API.interceptors.request.use((req) => {
  const path = window.location.pathname;
  const token = tokenManager.getTokenByPath(path);

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ── Global 401 handler — clears only the current panel's token ──────────────
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Simple retry with backoff for transient failures
    const cfg = err.config || {};
    const isIdempotent = ["get", "head", "options"].includes((cfg.method || "").toLowerCase());
    const maxRetries = cfg._retryMax ?? 2;
    cfg._retryCount = cfg._retryCount ?? 0;

    if (isIdempotent && cfg._retryCount < maxRetries && isRetryable(err)) {
      cfg._retryCount += 1;
      const delay = 350 * Math.pow(2, cfg._retryCount - 1);
      await sleep(delay);
      return API(cfg);
    }

    if (err.response?.status === 401) {
      const isLoginRequest = err.config?.url?.includes("/auth/login") || err.config?.url?.includes("/auth/sso");
      const path = window.location.pathname;
      const isPublicPath = path === "/" || path === "/login" || path.startsWith("/assessment/");

      if (!isLoginRequest && !isPublicPath) {
        // Aggressively clear session and redirect on 401 (session expired)
        console.warn("🔐 Session expired (401), redirecting to login...");
        tokenManager.clearTokenByPath(path);
        // Also clear from sessionStorage directly to be safe
        sessionStorage.removeItem("superAdminUser");
        sessionStorage.removeItem("companyUser");
        sessionStorage.removeItem("branchUser");
        sessionStorage.removeItem("salesUser");
        
        // 🔥 CLEAR SSO FALLBACK (Prevents redirection loop on 401)
        localStorage.removeItem("crm_user");
        
        window.location.replace("/login?session=expired");
      }
    }

    if (err.response?.status === 403 && err.response?.data?.isExpired) {
        window.location.replace("/subscription-expired");
    }

    return Promise.reject(err);
  }
);

API.getCurrentUser = () => {
  const path = window.location.pathname;
  let role = null;
  if (path.startsWith("/superadmin")) role = "super_admin";
  else if (path.startsWith("/company")) role = "company_admin";
  else if (path.startsWith("/branch")) role = "branch_manager";
  else if (path.startsWith("/sales")) role = "sales";

  if (!role) return JSON.parse(localStorage.getItem("user") || "{}");

  const keys = {
    super_admin: "superAdminUser",
    company_admin: "companyUser",
    branch_manager: "branchUser",
    sales: "salesUser"
  };

  try {
    return JSON.parse(sessionStorage.getItem(keys[role]) || "{}");
  } catch {
    return {};
  }
};

export default API;