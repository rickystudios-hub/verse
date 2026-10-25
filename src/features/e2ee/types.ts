export interface DeviceKeyPair {
  deviceId: string;
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
  createdAt: string;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64 (12 bytes para AES-GCM)
  senderPublicKeyJwk: JsonWebKey;
  senderDeviceId: string;
  algorithm: 'AES-GCM-256';
  curve: 'P-256';
}

export interface DecryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  plaintext: string;
  createdAt: string;
  isEncrypted: boolean;
  algorithm: string;
  rawCiphertext?: string;
  iv?: string;
}

export interface SafetyNumberInfo {
  code: string; // Sequência formatada de verificação (ex: "48201 92834 10294 88392")
  fingerprintAlice: string;
  fingerprintBob: string;
}
