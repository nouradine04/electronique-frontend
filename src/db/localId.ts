import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';

/**
 * WatermelonDB only accepts identifiers made of letters, digits, dots and
 * underscores. A UUID v4 without dashes keeps 122 bits of randomness while
 * remaining safe for every adapter (LokiJS, SQLite and SQLCipher).
 */
export function createLocalId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replace(/-/g, '');
  }

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function installLocalIdGenerator(): void {
  setGenerator(createLocalId);
}
