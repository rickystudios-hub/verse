'use client';

import * as React from 'react';
import { 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  Send, 
  Eye, 
  CheckCheck,
  Shield,
  Smartphone,
  Info
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';
import { 
  encryptE2EEMessage, 
  decryptE2EEMessage, 
  computeSafetyNumber 
} from '@/features/e2ee/crypto';
import { 
  getOrCreateLocalDeviceKey, 
  getContactPublicKey, 
  saveEncryptedMessage, 
  getEncryptedMessages,
  StoredEncryptedMessage 
} from '@/features/e2ee/storage';
import { DeviceKeyPair, SafetyNumberInfo, DecryptedMessage, EncryptedPayload } from '@/features/e2ee/types';

export default function MessagesPage() {
  const currentUserId = INITIAL_MOCK_PROFILES[0].id;
  const contacts = INITIAL_MOCK_PROFILES.slice(1); // verse_oficial, clara_dev

  const [selectedContact, setSelectedContact] = React.useState(contacts[0]);
  const [deviceKey, setDeviceKey] = React.useState<DeviceKeyPair | null>(null);
  const [contactPublicJwk, setContactPublicJwk] = React.useState<JsonWebKey | null>(null);
  const [messages, setMessages] = React.useState<DecryptedMessage[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = React.useState(false);
  const [safetyInfo, setSafetyInfo] = React.useState<SafetyNumberInfo | null>(null);
  const [inspectedPayload, setInspectedPayload] = React.useState<EncryptedPayload | null>(null);
  const { showToast } = useToast();

  const conversationId = [currentUserId, selectedContact.id].sort().join('_');

  // Inicializa o par de chaves local do dispositivo (IndexedDB / LocalStorage seguro)
  React.useEffect(() => {
    async function initDevice() {
      try {
        const key = await getOrCreateLocalDeviceKey(currentUserId);
        setDeviceKey(key);
      } catch (err) {
        console.error('Falha ao inicializar chaves do dispositivo:', err);
      }
    }
    initDevice();
  }, [currentUserId]);

  // Carrega chave pública do contato selecionado e descriptografa mensagens
  React.useEffect(() => {
    let isMounted = true;

    async function loadContactAndMessages() {
      if (!deviceKey) return;

      try {
        const peerJwk = await getContactPublicKey(selectedContact.id);
        if (!isMounted) return;
        setContactPublicJwk(peerJwk);

        // Calcula Safety Number (Fingerprint compartilhado)
        const safety = await computeSafetyNumber(deviceKey.publicKeyJwk, peerJwk);
        if (!isMounted) return;
        setSafetyInfo(safety);

        // Carrega e decifra mensagens armazenadas
        const storedList = getEncryptedMessages(conversationId);
        
        // Se a conversa estiver vazia, cria uma mensagem de boas-vindas cifrada inicial
        if (storedList.length === 0) {
          const welcomePlaintext = `Olá! Esta conversa com @${selectedContact.username} está protegida por criptografia de ponta a ponta (E2EE) com Web Crypto API. Nem o servidor nem a IA têm acesso a este conteúdo.`;
          
          const encryptedWelcome = await encryptE2EEMessage(
            welcomePlaintext,
            deviceKey.privateKey,
            peerJwk,
            deviceKey.publicKeyJwk,
            deviceKey.deviceId
          );

          const welcomeMsg: StoredEncryptedMessage = {
            id: `msg_init_${Date.now()}`,
            conversationId,
            senderId: selectedContact.id,
            receiverId: currentUserId,
            payload: encryptedWelcome,
            createdAt: new Date().toISOString(),
          };

          saveEncryptedMessage(welcomeMsg);
          storedList.push(welcomeMsg);
        }

        // Descriptografa todas as mensagens recebidas e enviadas localmente no browser
        const decryptedList: DecryptedMessage[] = [];
        for (const msg of storedList) {
          try {
            const plaintext = await decryptE2EEMessage(msg.payload, deviceKey.privateKey);
            decryptedList.push({
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              plaintext,
              createdAt: msg.createdAt,
              isEncrypted: true,
              algorithm: msg.payload.algorithm,
              rawCiphertext: msg.payload.ciphertext,
              iv: msg.payload.iv,
            });
          } catch {
            decryptedList.push({
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              plaintext: '🔒 Falha ao decifrar mensagem. Chave de sessão incompatível ou mensagem corrompida.',
              createdAt: msg.createdAt,
              isEncrypted: true,
              algorithm: msg.payload.algorithm,
            });
          }
        }

        if (isMounted) {
          setMessages(decryptedList);
        }
      } catch (err) {
        console.error('Erro ao preparar conversa E2EE:', err);
      }
    }

    loadContactAndMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedContact, deviceKey, conversationId, currentUserId]);

  // Envio de nova mensagem criptografada
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !deviceKey || !contactPublicJwk || isSending) return;

    setIsSending(true);
    const textToSend = inputMessage.trim();

    try {
      // 1. Criptografia no cliente: AES-GCM-256 com chave derivada de ECDH P-256
      const payload = await encryptE2EEMessage(
        textToSend,
        deviceKey.privateKey,
        contactPublicJwk,
        deviceKey.publicKeyJwk,
        deviceKey.deviceId
      );

      // 2. Armazena apenas o ciphertext (Zero plaintext gravado)
      const storedMsg: StoredEncryptedMessage = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        receiverId: selectedContact.id,
        payload,
        createdAt: new Date().toISOString(),
      };

      saveEncryptedMessage(storedMsg);

      // 3. Atualiza estado da interface imediatamente
      setMessages((prev) => [
        ...prev,
        {
          id: storedMsg.id,
          conversationId,
          senderId: currentUserId,
          receiverId: selectedContact.id,
          plaintext: textToSend,
          createdAt: storedMsg.createdAt,
          isEncrypted: true,
          algorithm: payload.algorithm,
          rawCiphertext: payload.ciphertext,
          iv: payload.iv,
        },
      ]);

      setInputMessage('');
      showToast({
        type: 'success',
        title: 'Mensagem Cifrada e Enviada',
        description: 'Texto cifrado com AES-GCM-256 antes da transmissão.',
      });
    } catch (err) {
      console.error('Falha ao cifrar mensagem:', err);
      showToast({
        type: 'error',
        title: 'Falha Criptográfica',
        description: 'Não foi possível cifrar a mensagem com a chave do destinatário.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row border-b border-border bg-background">
      {/* Coluna da Esquerda: Contatos & Status E2EE */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-black text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              Mensagens E2EE
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            Criptografia de Ponta a Ponta com Web Crypto API (ECDH P-256 + AES-GCM-256).
          </p>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {contacts.map((contact) => {
            const isSelected = selectedContact.id === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3.5 text-left flex items-center gap-3 transition-colors ${
                  isSelected ? 'bg-surface-muted' : 'hover:bg-surface-muted/50'
                }`}
              >
                <Avatar fallbackName={contact.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground truncate">
                      {contact.display_name}
                    </p>
                    <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    @{contact.username}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informações do Dispositivo Local */}
        <div className="p-3 border-t border-border bg-surface-muted/40 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Smartphone className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold text-foreground">Dispositivo Local Protegido</span>
          </div>
          <p className="text-slate-500 text-[10px] truncate font-mono">
            ID: {deviceKey?.deviceId || 'Gerando par de chaves...'}
          </p>
        </div>
      </div>

      {/* Coluna da Direita: Conversa Criptografada */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Cabeçalho da Conversa */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <Avatar fallbackName={selectedContact.display_name} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {selectedContact.display_name}
                </span>
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                  E2EE
                </span>
              </div>
              <p className="text-[11px] text-slate-500">@{selectedContact.username}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSafetyModalOpen(true)}
            className="gap-1.5 text-xs text-foreground"
          >
            <KeyRound className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Código de Segurança</span>
          </Button>
        </div>

        {/* Banner de Garantia de Zero Conhecimento */}
        <div className="p-2.5 bg-emerald-950/20 border-b border-emerald-900/30 text-emerald-400 text-[11px] flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>
            Mensagens privadas são cifradas no seu dispositivo e decifradas apenas pelo destinatário. Zero texto claro no servidor.
          </span>
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-none shadow-sm'
                      : 'bg-surface border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.plaintext}</p>

                  <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-black/10 dark:border-white/10 text-[10px] opacity-75">
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      {msg.algorithm}
                    </span>
                    <div className="flex items-center gap-1">
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      {msg.rawCiphertext && (
                        <button
                          type="button"
                          onClick={() =>
                            setInspectedPayload({
                              ciphertext: msg.rawCiphertext!,
                              iv: msg.iv || '',
                              algorithm: 'AES-GCM-256',
                              curve: 'P-256',
                              senderDeviceId: 'device',
                              senderPublicKeyJwk: {} as JsonWebKey,
                            })
                          }
                          className="hover:underline flex items-center gap-0.5 ml-1 text-slate-400 dark:text-slate-300"
                          title="Inspecionar carga cifrada"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          <span>Carga</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Compositor de Mensagem Cifrada */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Mensagem criptografada de ponta a ponta..."
            className="flex-1 bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-accent"
          />
          <Button
            type="submit"
            variant="accent"
            size="sm"
            disabled={!inputMessage.trim() || isSending}
            className="px-4 py-2.5 gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </form>
      </div>

      {/* Modal de Verificação de Código de Segurança (Safety Number) */}
      <Modal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        title="Código de Segurança E2EE"
      >
        <div className="space-y-4">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Verificação de Chaves Criptográficas</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Compare este código pessoalmente ou por um canal de voz com <strong>@{selectedContact.username}</strong> para confirmar que nenhuma terceira parte interceptou a troca de chaves (anti-MITM).
            </p>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Safety Number
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 tracking-wider select-all">
              {safetyInfo?.code || 'Calculando...'}
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">
              Fingerprint SHA-256 (NIST P-256 ECDH)
            </p>
          </div>

          <div className="text-xs text-neutral-400 space-y-1 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/60">
            <p className="font-semibold text-neutral-300">Garantias Criptográficas do VÉRSE:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-500">
              <li>Cifra simétrica: AES-GCM com chave de 256 bits</li>
              <li>Vetor de inicialização (IV): 96 bits criptograficamente aleatório por mensagem</li>
              <li>Chaves privadas permanecem isoladas no armazenamento local do navegador</li>
            </ul>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsSafetyModalOpen(false)}
            className="w-full justify-center"
          >
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Modal de Inspeção da Carga Cifrada Real */}
      <Modal
        isOpen={!!inspectedPayload}
        onClose={() => setInspectedPayload(null)}
        title="Inspeção da Carga Criptografada"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400">
            <Info className="w-4 h-4 text-accent shrink-0" />
            <span>
              Isto é exatamente o que trafega pela rede e é armazenado no banco de dados (Zero Texto Claro).
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-semibold uppercase text-[10px]">
              Ciphertext (Base64 AES-GCM-256):
            </span>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-emerald-400 break-all select-all max-h-32 overflow-y-auto">
              {inspectedPayload?.ciphertext}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-semibold uppercase text-[10px]">
              Vetor de Inicialização (IV de 12 bytes em Base64):
            </span>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-amber-400 break-all select-all">
              {inspectedPayload?.iv}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setInspectedPayload(null)}
            className="w-full justify-center mt-2"
          >
            Fechar Inspeção
          </Button>
        </div>
      </Modal>
    </div>
  );
}
