/**
 * 🔒 END-TO-END ENCRYPTION SERVICE (E2EE)
 * Uses native Web Crypto API for secure messaging.
 * RSA-OAEP for key exchange, AES-GCM for content encryption.
 */

const RSA_ALGO = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGO = {
  name: "AES-GCM",
  length: 256,
};

// ── KEY GENERATION ──────────────────────────────────────────────────────────

export const generateE2EEKeys = async () => {
  if (!window.isSecureContext) {
    throw new Error("E2EE requires a secure context (HTTPS or localhost)");
  }

  const keyPair = await window.crypto.subtle.generateKey(
    RSA_ALGO,
    true, // Extractable
    ["encrypt", "decrypt"]
  );

  return keyPair;
};

// ── EXPORT / IMPORT ─────────────────────────────────────────────────────────

export const exportPublicKey = async (publicKey) => {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importPublicKey = async (publicKeyStr) => {
  const binaryDerString = window.atob(publicKeyStr);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    RSA_ALGO,
    true,
    ["encrypt"]
  );
};

export const exportPrivateKey = async (privateKey) => {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importPrivateKey = async (privateKeyStr) => {
  const binaryDerString = window.atob(privateKeyStr);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    RSA_ALGO,
    true,
    ["decrypt"]
  );
};

// ── AES OPERATIONS ──────────────────────────────────────────────────────────

export const generateAESKey = async () => {
  return await window.crypto.subtle.generateKey(AES_ALGO, true, [
    "encrypt",
    "decrypt",
  ]);
};

export const encryptContent = async (text, aesKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // GCM IV is 12 bytes
  const encoded = new TextEncoder().encode(text);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export const decryptContent = async (cipherText, aesKey, ivStr) => {
  const iv = new Uint8Array(
    atob(ivStr)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const data = new Uint8Array(
    atob(cipherText)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  return new TextDecoder().decode(decrypted);
};

// ── RSA OPERATIONS (For Session Key Exchange) ────────────────────────────────

export const encryptAESKeyWithRSA = async (aesKey, publicKey) => {
  // If publicKey is a string, import it first
  const keyToUse = typeof publicKey === "string" ? await importPublicKey(publicKey) : publicKey;
  
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encrypted = await window.crypto.subtle.encrypt(RSA_ALGO, keyToUse, rawAesKey);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const decryptAESKeyWithRSA = async (encryptedAESKey, privateKey) => {
  const data = new Uint8Array(
    atob(encryptedAESKey)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const decryptedRaw = await window.crypto.subtle.decrypt(
    RSA_ALGO,
    privateKey,
    data
  );

  return await window.crypto.subtle.importKey(
    "raw",
    decryptedRaw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

// ── PASSWORD-BASED KEY PROTECTION (PBKDF2 + AES-GCM) ───────────────────────

export const deriveKeyFromPassword = async (password, saltBase64 = "EduPathCRMDefaultSalt") => {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltArr = encoder.encode(saltBase64);

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArr,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptPrivateKeyWithPassword = async (privateKey, password) => {
  const derivedKey = await deriveKeyFromPassword(password);
  const exportedPrivateKey = await exportPrivateKey(privateKey);
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(exportedPrivateKey);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    encodedData
  );

  return {
    encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export const decryptPrivateKeyFromPassword = async (encryptedKeyStr, ivStr, password) => {
  try {
    const derivedKey = await deriveKeyFromPassword(password);
    
    const iv = new Uint8Array(atob(ivStr).split("").map((c) => c.charCodeAt(0)));
    const data = new Uint8Array(atob(encryptedKeyStr).split("").map((c) => c.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      data
    );

    const privateKeyStr = new TextDecoder().decode(decrypted);
    return await importPrivateKey(privateKeyStr);
  } catch (err) {
    throw new Error("Invalid decryption password or corrupted key data.");
  }
};

// ── PERSISTENCE HELPERS ──────────────────────────────────────────────────────

export const getStoredPrivateKey = async (userId) => {
  const key = localStorage.getItem(`e2ee_pv_${userId}`);
  if (!key) return null;
  return await importPrivateKey(key);
};

export const storePrivateKey = async (userId, privateKey) => {
  const keyStr = await exportPrivateKey(privateKey);
  localStorage.setItem(`e2ee_pv_${userId}`, keyStr);
};
