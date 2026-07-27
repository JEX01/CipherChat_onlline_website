/**
 * Cryptographic utility functions for CipherChat.
 * Uses only the Browser WebCrypto API for secure client-side cryptographic operations.
 * 
 * PROTOTYPE DESIGN CHOICE NOTE:
 * For this educational prototype, we derive a symmetric AES-256-GCM key directly from 
 * a shared room password and the Room ID. The Room ID is used as the PBKDF2 salt. 
 * Since the salt is deterministic and predictable, this design is NOT secure for production.
 * A production-grade implementation would use an authenticated key agreement protocol (like DH/ECDH)
 * with random salts, identity keys, signature checks, and a key-ratcheting mechanism.
 */

// Helper: Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a password and a room ID.
 * @param {string} password - The user-entered encryption password.
 * @param {string} roomId - The room ID (used as a deterministic salt).
 * @returns {Promise<CryptoKey>} - The derived CryptoKey.
 */
export async function deriveKey(password, roomId) {
  if (!password || !roomId) {
    throw new Error('Password and Room ID are required for key derivation.');
  }

  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  // Deterministic salt derived from room ID
  const saltBytes = encoder.encode(`salt_${roomId.toLowerCase().trim()}`);

  // Import raw password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key using PBKDF2
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000, // Balanced for responsiveness and security in demo
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Key is not extractable for security
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypts a plaintext message using AES-GCM with the derived key.
 * Generates a new random 12-byte IV for every encryption to avoid replay and key stream reuse.
 * @param {string} plaintext - The plaintext message.
 * @param {CryptoKey} key - The derived AES-GCM key.
 * @returns {Promise<{ ciphertext: string, iv: string }>} - Base64 encoded ciphertext and IV.
 */
export async function encryptMessage(plaintext, key) {
  if (!key) {
    throw new Error('Encryption key is required.');
  }

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate a cryptographically secure random 12-byte IV (96 bits is standard and optimal for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the plaintext bytes
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypts a ciphertext message using AES-GCM and the derived key.
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext.
 * @param {string} ivBase64 - Base64 encoded 12-byte IV.
 * @param {CryptoKey} key - The derived AES-GCM key.
 * @returns {Promise<string>} - The decrypted plaintext message.
 * @throws {Error} - If decryption fails (e.g. key mismatch, corrupted payload).
 */
export async function decryptMessage(ciphertextBase64, ivBase64, key) {
  if (!key) {
    throw new Error('Decryption key is required.');
  }

  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
    const ivBytes = new Uint8Array(base64ToArrayBuffer(ivBase64));

    // Decrypt the ciphertext bytes
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      ciphertextBuffer
    );

    // Decode decrypted bytes to plaintext string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    // Propagate standard error or signal key mismatch to the UI
    console.error('Decryption failed:', error);
    throw new Error('Unable to decrypt message — encryption key mismatch.');
  }
}
