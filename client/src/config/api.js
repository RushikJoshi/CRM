const BASE = import.meta.env.VITE_API_URL || "http://localhost:5003";

export const API_URL = BASE;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BASE;
export const APP_NAME = import.meta.env.VITE_APP_NAME || "Gitakshmi CRM";

export const API_BASE_URL = `${API_URL}/api`;
