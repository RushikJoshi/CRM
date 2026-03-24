import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </BrowserRouter>
);
