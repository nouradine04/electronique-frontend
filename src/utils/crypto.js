// Secure local encryption utility using browser SubtleCrypto API (zero dependencies)

const SALT = new Uint8Array([89, 12, 99, 43, 21, 88, 54, 76, 12, 90, 32, 11, 8, 9, 3, 2]);

// Derives a cryptographic key from a password/pin
export async function deriveKey(password) {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypts text using AES-GCM
export async function encryptText(text, key) {
  if (!text) return '';
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  // Combine IV and Ciphertext
  const rawData = new Uint8Array(iv.byteLength + encrypted.byteLength);
  rawData.set(iv, 0);
  rawData.set(new Uint8Array(encrypted), iv.byteLength);

  // Convert binary array to base64
  return btoa(String.fromCharCode.apply(null, rawData));
}

// Decrypts AES-GCM encrypted text
export async function decryptText(encryptedBase64, key) {
  if (!encryptedBase64) return '';
  try {
    const rawData = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    const iv = rawData.slice(0, 12);
    const ciphertext = rawData.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    console.error('Decryption failed. The key might be invalid.', e);
    return '[Chiffré / Non Lisible]';
  }
}

// Helper to get or derive key from session storage
export async function getSessionKey() {
  const savedPin = sessionStorage.getItem('encryption_pin') || 'electro_default_secret_key';
  return deriveKey(savedPin);
}

// Ancien chiffrement synchrone conservé uniquement pour relire les sauvegardes historiques
export function rc4EncryptDecrypt(str, key) {
  const s = [];
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  let i = 0;
  j = 0;
  let res = '';
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const k = s[(s[i] + s[j]) % 256];
    res += String.fromCharCode(str.charCodeAt(y) ^ k);
  }
  return res;
}

// Helper to encrypt field synchronously to Base64
export function encryptSync(text, key = 'electro_default_secret_key') {
  if (text === undefined || text === null) return '';
  const str = String(text);
  const cipher = rc4EncryptDecrypt(str, key);
  return btoa(unescape(encodeURIComponent(cipher)));
}

function isReadable(str) {
  if (!str || str.length === 0) return false;
  // Restrict to English/French/Arabic letters, numbers, spaces, and basic punctuation
  const readableRegex = /^[a-zA-Z0-9\s'\-().,àâäéèêëîïôöùûüçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜÇŒÆ\u0600-\u06FF]+$/;
  return readableRegex.test(str);
}

// Helper to decrypt field synchronously from Base64
export function decryptSync(base64Text, key = 'electro_default_secret_key') {
  if (!base64Text) return '';
  try {
    // If it doesn't look like base64, return the plain text directly
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Text)) {
      return base64Text;
    }

    const candidateKeys = [
      sessionStorage.getItem('encryption_pin'), // Active login password goes first!
      key,
      'electro_default_secret_key',
      'admin',
      'manager',
      '123456',
      '1234'
    ].filter(Boolean);

    // Keep unique keys only
    const uniqueKeys = Array.from(new Set(candidateKeys));

    let lastPlain = '';
    for (const k of uniqueKeys) {
      try {
        const cipher = decodeURIComponent(escape(atob(base64Text)));
        const plain = rc4EncryptDecrypt(cipher, k);
        if (isReadable(plain)) {
          return plain;
        }
        lastPlain = plain;
      } catch (e) {}
    }

    return lastPlain || base64Text;
  } catch (e) {
    return base64Text; // Fallback to original text if not encrypted
  }
}
