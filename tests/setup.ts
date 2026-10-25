import { webcrypto } from 'node:crypto';

// Polyfill SubtleCrypto para o ambiente JSDOM do Vitest
if (typeof window !== 'undefined' && !window.crypto?.subtle) {
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}
