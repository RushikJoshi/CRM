import { createContext, useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import tokenManager from "../utils/tokenManager";

export const AuthContext = createContext();

export const ROLE_HOME = {
  super_admin: "/superadmin/dashboard",
  company_admin: "/company/dashboard",
  branch_manager: "/branch/dashboard",
  sales: "/sales/dashboard",
  support: "/sales/dashboard",
  marketing: "/sales/dashboard",
};

export const USER_DATA_KEYS = {
  super_admin: "superAdminUser",
  company_admin: "companyUser",
  branch_manager: "branchUser",
  sales: "salesUser",
  support: "salesUser",
  marketing: "salesUser"
};

export const getSessionKeyForPath = (path = window.location.pathname) => {
  if (path.startsWith("/superadmin")) return "super_admin";
  if (path.startsWith("/company")) return "company_admin";
  if (path.startsWith("/branch")) return "branch_manager";
  if (path.startsWith("/sales")) return "sales";
  return null;
};

// ── Safe single-session reader ────────────────────────────────────────────────
export const readSession = (role) => {
  if (!role) return null;
  try {
    const userRaw = sessionStorage.getItem(USER_DATA_KEYS[role]);
    const token = tokenManager.getTokenByRole(role);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
};

// ── Get current user safely (reads from path-derived key) ────────────────────
export const getCurrentUser = () => {
  const role = getSessionKeyForPath();
  return readSession(role)?.user || null;
};

import API from "../services/api";
import { 
  generateE2EEKeys, 
  exportPublicKey, 
  storePrivateKey, 
  getStoredPrivateKey,
  encryptPrivateKeyWithPassword,
  decryptPrivateKeyFromPassword
} from "../services/encryptionService";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  // ── Sync E2EE Keys (with Cloud Recovery / Option B) ────────────────────────
  const syncE2EEKeys = useCallback(async (userData, password) => {
    try {
      if (!userData?._id) return;
      
      const localPrivateKey = await getStoredPrivateKey(userData._id);
      
      // CASE 1: NO KEYS AT ALL (First time setup)
      if (!userData.publicKey) {
        console.log("🔐 Initializing E2EE Security...");
        const keyPair = await generateE2EEKeys();
        const publicKeyStr = await exportPublicKey(keyPair.publicKey);
        
        // Encrypt private key with password before uploading (Option B recovery)
        const { encryptedKey, iv } = await encryptPrivateKeyWithPassword(keyPair.privateKey, password);
        
        // 1. Store private key locally
        await storePrivateKey(userData._id, keyPair.privateKey);
        
        // 2. Sync with cloud
        const res = await API.put("/users/me/public-key", { 
          publicKey: publicKeyStr,
          encryptedPrivateKey: encryptedKey,
          privateKeyIv: iv
        });

        // 3. Update local state to include the fields for the current session
        const updatedUser = { 
          ...userData, 
          publicKey: publicKeyStr, 
          encryptedPrivateKey: encryptedKey, 
          privateKeyIv: iv 
        };
        setUser(updatedUser);
        const role = updatedUser.role;
        const userKey = USER_DATA_KEYS[role];
        if (userKey) {
          sessionStorage.setItem(userKey, JSON.stringify(updatedUser));
        }
        
        console.log("✅ E2EE established and backed up to cloud.");
      } 
      // CASE 2: KEYS ON SERVER BUT NOT LOCALLY (New device / browser)
      else if (!localPrivateKey && userData.encryptedPrivateKey && password) {
        console.log("🔄 Restoring E2EE keys from cloud...");
        const decryptedKey = await decryptPrivateKeyFromPassword(
          userData.encryptedPrivateKey,
          userData.privateKeyIv,
          password
        );
        
        await storePrivateKey(userData._id, decryptedKey);
        console.log("✅ E2EE keys restored successfully.");
      }
      else if (!localPrivateKey) {
        console.warn("⚠️ Device Change: Encryption key missing. Please ensure your session is fresh.");
      } else {
        console.log("🛡️ E2EE Security active.");
      }
    } catch (err) {
      console.error("❌ E2EE Key Sync Error:", err);
    }
  }, []);

  // Sync user state with current panel on path change
  useEffect(() => {
    const role = getSessionKeyForPath(location.pathname);
    if (role) {
      const savedUser = sessionStorage.getItem(USER_DATA_KEYS[role]);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Note: Password-based sync happens primarily on login; 
        // local key check happens on app load.
        syncE2EEKeys(userData, null); 
      } else {
        setUser(null);
      }
    }
  }, [location.pathname, syncE2EEKeys]);

  const login = useCallback(async (token, userData, password) => {
    const role = userData?.role;
    if (!role) return;

    // Store token using tokenManager
    tokenManager.setToken(role, token);

    // Store user data in panel-specific key
    const userKey = USER_DATA_KEYS[role];
    if (userKey) {
      sessionStorage.setItem(userKey, JSON.stringify(userData));
    }

    setUser(userData);
    await syncE2EEKeys(userData, password);
  }, [syncE2EEKeys]);

  const logout = useCallback(() => {
    const role = getSessionKeyForPath(window.location.pathname);

    if (role) {
      tokenManager.clearToken(role);
      sessionStorage.removeItem(USER_DATA_KEYS[role]);
    }

    setUser(null);
    window.location.replace("/login");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
