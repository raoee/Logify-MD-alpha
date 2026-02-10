/**
 * Encryption Service (Web Crypto API)
 * Implements AES-GCM 256-bit encryption with PBKDF2 key derivation.
 * This ensures data is mathematically secure at rest.
 */

import { EncryptedData } from '../types';

export const encryptionService = {
  /**
   * Generates a cryptographic key from the user's password.
   * This key is never stored; it is re-derived every time the user logs in.
   */
  deriveKey: async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000, // High iteration count to prevent brute-force
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false, // Key is non-extractable (cannot be exported to verify)
      ["encrypt", "decrypt"]
    );
  },

  /**
   * Generates a random salt for new key derivation
   */
  generateSalt: (): Uint8Array => {
    return window.crypto.getRandomValues(new Uint8Array(16));
  },

  /**
   * Encrypts an object using AES-GCM
   */
  encrypt: async (data: any, key: CryptoKey): Promise<EncryptedData> => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const jsonString = JSON.stringify(data);
    const encodedData = enc.encode(jsonString);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    return {
      cipherText: arrayBufferToBase64(cipherBuffer),
      iv: arrayBufferToBase64(iv.buffer),
      salt: '' // Salt is usually handled at the vault level, but kept in type for flexibility
    };
  },

  /**
   * Decrypts ciphertext using AES-GCM
   */
  decrypt: async (encryptedData: EncryptedData, key: CryptoKey): Promise<any> => {
    try {
      const iv = base64ToArrayBuffer(encryptedData.iv);
      const cipherBuffer = base64ToArrayBuffer(encryptedData.cipherText);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        cipherBuffer
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decryptedBuffer));
    } catch (e) {
      console.error("Decryption failed - Integrity check or key mismatch", e);
      throw new Error("Decryption failed");
    }
  }
};

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}