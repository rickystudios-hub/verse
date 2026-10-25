import { DeviceKeyPair, EncryptedPayload, SafetyNumberInfo } from './types';

// Helpers para conversão de Base64 em ambiente Web e Node/Vitest
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64').toString('binary')
    : atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Obtém o objeto Web Crypto SubtleCrypto do ambiente (Browser ou Node 18+)
 */
function getSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Ambiente de execução não suporta Web Crypto API (SubtleCrypto)');
}

/**
 * Gera um par de chaves de identidade de dispositivo usando ECDH curva NIST P-256
 */
export async function generateDeviceKeyPair(): Promise<DeviceKeyPair> {
  const subtle = getSubtle();
  const keyPair = (await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // Chave pública e privada exportáveis para persistência segura
    ['deriveKey', 'deriveBits']
  )) as CryptoKeyPair;

  const publicKeyJwk = await subtle.exportKey('jwk', keyPair.publicKey);
  const deviceId = `dev_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

  return {
    deviceId,
    publicKeyJwk,
    privateKey: keyPair.privateKey,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Importa uma chave pública recebida no formato JWK
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/**
 * Deriva uma chave simétrica AES-GCM-256 usando troca de chaves Diffie-Hellman na curva elíptica
 */
export async function deriveSharedSecretKey(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false, // Chave de sessão nunca exportável
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra uma mensagem em texto puro usando AES-GCM-256 com IV aleatório de 12 bytes
 */
export async function encryptE2EEMessage(
  plaintext: string,
  myPrivateKey: CryptoKey,
  peerPublicKeyJwk: JsonWebKey,
  myPublicJwk: JsonWebKey,
  myDeviceId: string
): Promise<EncryptedPayload> {
  const subtle = getSubtle();
  const peerPublicKey = await importPublicKey(peerPublicKeyJwk);
  const sharedKey = await deriveSharedSecretKey(myPrivateKey, peerPublicKey);

  // Vetor de Inicialização único de 96 bits (12 bytes) para AES-GCM
  const iv = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
  }

  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encodedPlaintext
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    senderPublicKeyJwk: myPublicJwk,
    senderDeviceId: myDeviceId,
    algorithm: 'AES-GCM-256',
    curve: 'P-256',
  };
}

/**
 * Descriptografa um payload cifrado recebido utilizando a chave privada local do dispositivo
 */
export async function decryptE2EEMessage(
  payload: EncryptedPayload,
  myPrivateKey: CryptoKey
): Promise<string> {
  const subtle = getSubtle();
  const senderPublicKey = await importPublicKey(payload.senderPublicKeyJwk);
  const sharedKey = await deriveSharedSecretKey(myPrivateKey, senderPublicKey);

  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sharedKey,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Calcula o Safety Number (Fingerprint de verificação de chaves) para proteção contra MITM
 */
export async function computeSafetyNumber(
  jwkA: JsonWebKey,
  jwkB: JsonWebKey
): Promise<SafetyNumberInfo> {
  const subtle = getSubtle();

  // Ordena deterministicamente por coordenadas para ser idêntico em ambos os dispositivos
  const strA = `${jwkA.x || ''}:${jwkA.y || ''}`;
  const strB = `${jwkB.x || ''}:${jwkB.y || ''}`;
  const [first, second] = strA < strB ? [strA, strB] : [strB, strA];

  const rawBytes = new TextEncoder().encode(`verse_safety_v1:${first}|${second}`);
  const hashBuffer = await subtle.digest('SHA-256', rawBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Converte os primeiros 16 bytes em blocos numéricos fáceis de conferir visualmente
  const chunks: string[] = [];
  for (let i = 0; i < 4; i++) {
    const val = (hashArray[i * 4] << 24) | (hashArray[i * 4 + 1] << 16) | (hashArray[i * 4 + 2] << 8) | hashArray[i * 4 + 3];
    const positiveVal = Math.abs(val) % 100000;
    chunks.push(positiveVal.toString().padStart(5, '0'));
  }

  const hexHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    code: chunks.join(' '),
    fingerprintAlice: hexHash.slice(0, 16),
    fingerprintBob: hexHash.slice(16, 32),
  };
}
