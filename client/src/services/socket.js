import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import { tokenManager } from "../utils/tokenManager";

let _socket = null;

export function getSocket() {
  if (_socket) return _socket;
  _socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    withCredentials: true,
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

