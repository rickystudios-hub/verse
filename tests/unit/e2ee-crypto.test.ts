import { describe, it, expect } from 'vitest';
import { 
  generateDeviceKeyPair, 
  encryptE2EEMessage, 
  decryptE2EEMessage, 
  computeSafetyNumber 
} from '@/features/e2ee/crypto';

describe('VÉRSE E2EE Cryptographic Suite (Fase 6 - Web Crypto API)', () => {
  it('gera par de chaves ECDH curva NIST P-256 com JWK público válido', async () => {
    const keyPair = await generateDeviceKeyPair();

    expect(keyPair.deviceId).toMatch(/^dev_/);
    expect(keyPair.publicKeyJwk.kty).toBe('EC');
    expect(keyPair.publicKeyJwk.crv).toBe('P-256');
    expect(keyPair.publicKeyJwk.x).toBeDefined();
    expect(keyPair.publicKeyJwk.y).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.createdAt).toBeDefined();
  });

  it('permite troca de chaves Diffie-Hellman e cifra/decifra perfeita entre Alice e Bob', async () => {
    // 1. Gera par de chaves de Alice e Bob
    const alice = await generateDeviceKeyPair();
    const bob = await generateDeviceKeyPair();

    const secretText = 'Olá Bob! Esta mensagem privada nunca passou em texto claro pelo servidor do VÉRSE.';

    // 2. Alice cifra para Bob
    const encryptedPayload = await encryptE2EEMessage(
      secretText,
      alice.privateKey,
      bob.publicKeyJwk,
      alice.publicKeyJwk,
      alice.deviceId
    );

    expect(encryptedPayload.algorithm).toBe('AES-GCM-256');
    expect(encryptedPayload.curve).toBe('P-256');
    expect(encryptedPayload.ciphertext).toBeDefined();
    expect(encryptedPayload.iv).toBeDefined();
    // Confirma que o texto claro não está visível no payload
    expect(encryptedPayload.ciphertext).not.toContain(secretText);

    // 3. Bob decifra usando sua chave privada
    const decryptedText = await decryptE2EEMessage(encryptedPayload, bob.privateKey);
    expect(decryptedText).toBe(secretText);
  });

  it('falha e rejeita decifrar quando uma terceira parte (Eve) tenta interceptar', async () => {
    const alice = await generateDeviceKeyPair();
    const bob = await generateDeviceKeyPair();
    const eve = await generateDeviceKeyPair(); // Espião

    const payload = await encryptE2EEMessage(
      'Dados confidenciais',
      alice.privateKey,
      bob.publicKeyJwk,
      alice.publicKeyJwk,
      alice.deviceId
    );

    // Eve tenta decifrar a mensagem destinada a Bob
    await expect(decryptE2EEMessage(payload, eve.privateKey)).rejects.toThrow();
  });

  it('falha e detecta adulteração de integridade caso o ciphertext seja alterado (Anti-Tampering AES-GCM)', async () => {
    const alice = await generateDeviceKeyPair();
    const bob = await generateDeviceKeyPair();

    const payload = await encryptE2EEMessage(
      'Mensagem autêntica',
      alice.privateKey,
      bob.publicKeyJwk,
      alice.publicKeyJwk,
      alice.deviceId
    );

    // Adulteração intencional de 1 caractere no ciphertext Base64
    const tamperedCiphertext = payload.ciphertext.slice(0, -2) + 'AA';
    const tamperedPayload = { ...payload, ciphertext: tamperedCiphertext };

    await expect(decryptE2EEMessage(tamperedPayload, bob.privateKey)).rejects.toThrow();
  });

  it('calcula Safety Numbers simétricos e determinísticos para verificação contra MITM', async () => {
    const alice = await generateDeviceKeyPair();
    const bob = await generateDeviceKeyPair();

    const codeAlicePerspective = await computeSafetyNumber(alice.publicKeyJwk, bob.publicKeyJwk);
    const codeBobPerspective = await computeSafetyNumber(bob.publicKeyJwk, alice.publicKeyJwk);

    // O código de segurança deve ser 100% idêntico independente de quem calcula
    expect(codeAlicePerspective.code).toBe(codeBobPerspective.code);
    expect(codeAlicePerspective.code.split(' ').length).toBe(4);
    expect(codeAlicePerspective.fingerprintAlice).toBeDefined();
  });
});
