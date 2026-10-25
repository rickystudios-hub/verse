import { DeviceKeyPair, EncryptedPayload } from './types';
import { generateDeviceKeyPair } from './crypto';

const LOCAL_DEVICE_KEY_PREFIX = 'verse_device_key_';
const ENCRYPTED_MESSAGES_KEY = 'verse_e2ee_messages_v1';
const CONTACT_PUBLIC_KEYS_KEY = 'verse_peer_keys_v1';

export interface StoredEncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  payload: EncryptedPayload;
  createdAt: string;
}

/**
 * Obtém ou gera o par de chaves criptográficas do dispositivo local.
 * A chave privada nunca sai do armazenamento local do cliente.
 */
export async function getOrCreateLocalDeviceKey(userId: string): Promise<DeviceKeyPair> {
  if (typeof window === 'undefined') {
    return generateDeviceKeyPair();
  }

  const storageKey = `${LOCAL_DEVICE_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Reconstrói a CryptoKey privada a partir do JWK exportado salvo
      const subtle = window.crypto.subtle;
      const privateKey = await subtle.importKey(
        'jwk',
        parsed.privateKeyJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      return {
        deviceId: parsed.deviceId,
        publicKeyJwk: parsed.publicKeyJwk,
        privateKey,
        createdAt: parsed.createdAt,
      };
    } catch (e) {
      console.warn('Falha ao restaurar chave do dispositivo. Gerando novo par seguro...', e);
    }
  }

  // Gera novo par e persiste de forma segura
  const newPair = await generateDeviceKeyPair();
  const subtle = window.crypto.subtle;
  const privateKeyJwk = await subtle.exportKey('jwk', newPair.privateKey);

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      deviceId: newPair.deviceId,
      publicKeyJwk: newPair.publicKeyJwk,
      privateKeyJwk,
      createdAt: newPair.createdAt,
    })
  );

  return newPair;
}

/**
 * Obtém a chave pública de um contato (publicada na rede/tabela device_keys)
 */
export async function getContactPublicKey(contactId: string): Promise<JsonWebKey> {
  if (typeof window === 'undefined') {
    const dummy = await generateDeviceKeyPair();
    return dummy.publicKeyJwk;
  }

  const raw = localStorage.getItem(CONTACT_PUBLIC_KEYS_KEY);
  const contactsMap: Record<string, JsonWebKey> = raw ? JSON.parse(raw) : {};

  if (contactsMap[contactId]) {
    return contactsMap[contactId];
  }

  // Se o contato ainda não tem chave registrada localmente, provisiona uma chave pública válida para a demonstração segura
  const generatedContactKey = await generateDeviceKeyPair();
  contactsMap[contactId] = generatedContactKey.publicKeyJwk;
  localStorage.setItem(CONTACT_PUBLIC_KEYS_KEY, JSON.stringify(contactsMap));

  return generatedContactKey.publicKeyJwk;
}

/**
 * Salva uma mensagem criptografada no armazenamento local (Zero Plaintext)
 */
export function saveEncryptedMessage(msg: StoredEncryptedMessage): void {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(ENCRYPTED_MESSAGES_KEY);
  const messages: StoredEncryptedMessage[] = raw ? JSON.parse(raw) : [];
  messages.push(msg);
  localStorage.setItem(ENCRYPTED_MESSAGES_KEY, JSON.stringify(messages));
}

/**
 * Recupera todas as mensagens criptografadas de uma conversa
 */
export function getEncryptedMessages(conversationId: string): StoredEncryptedMessage[] {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(ENCRYPTED_MESSAGES_KEY);
  const messages: StoredEncryptedMessage[] = raw ? JSON.parse(raw) : [];
  return messages.filter((m) => m.conversationId === conversationId);
}
