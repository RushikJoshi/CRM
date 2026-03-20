import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import { tokenManager } from "../utils/tokenManager";

function getSocketBaseUrl() {
  // API_BASE_URL default: http://localhost:5000/api → socket should be http://localhost:5000
  return String(API_BASE_URL).replace(/\/api\/?$/, "");
}

let _socket = null;

export function getSocket() {
  if (_socket) return _socket;
  _socket = io(getSocketBaseUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: {
      token: (() => {
        const path = window.location.pathname;
        const t = tokenManager.getTokenByPath(path);
        return t ? `Bearer ${t}` : "";
      })()
    }
  });
  return _socket;
}

