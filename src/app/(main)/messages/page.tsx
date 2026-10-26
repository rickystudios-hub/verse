'use client';

import * as React from 'react';
import { 
  Lock, 
  KeyRound, 
  Send, 
  CheckCheck,
  ShieldCheck
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
import { DeviceKeyPair, SafetyNumberInfo, DecryptedMessage } from '@/features/e2ee/types';

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
  const { showToast } = useToast();

  const conversationId = [currentUserId, selectedContact.id].sort().join('_');

  // Inicializa o par de chaves local do dispositivo
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

  // Carrega mensagens e chave pública do contato
  React.useEffect(() => {
    let isMounted = true;

    async function loadContactAndMessages() {
      if (!deviceKey) return;

      try {
        const peerJwk = await getContactPublicKey(selectedContact.id);
        if (!isMounted) return;
        setContactPublicJwk(peerJwk);

        // Calcula código de segurança da conversa
        const safety = await computeSafetyNumber(deviceKey.publicKeyJwk, peerJwk);
        if (!isMounted) return;
        setSafetyInfo(safety);

        // Carrega mensagens armazenadas localmente
        const storedList = getEncryptedMessages(conversationId);
        
        // Mensagem inicial de boas-vindas caso a conversa esteja vazia
        if (storedList.length === 0) {
          const welcomePlaintext = selectedContact.username === 'verse_oficial'
            ? 'Olá! Seja bem-vindo ao VÉRSE. Este é o seu canal de mensagens diretas e privadas.'
            : 'Oi! Prazer em conectar com você aqui no VÉRSE.';
          
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
            plaintext: welcomePlaintext,
            createdAt: new Date().toISOString(),
          };

          saveEncryptedMessage(welcomeMsg);
          storedList.push(welcomeMsg);
        }

        // Recupera as mensagens mantendo o texto legível sem falhas de decifra
        const decryptedList: DecryptedMessage[] = [];
        for (const msg of storedList) {
          let plaintext = msg.plaintext;
          
          if (!plaintext) {
            try {
              const isMe = msg.senderId === currentUserId;
              const keyToUse = isMe ? peerJwk : msg.payload?.senderPublicKeyJwk;
              plaintext = await decryptE2EEMessage(msg.payload, deviceKey.privateKey, keyToUse);
              // Salva o texto decifrado no armazenamento local para carregamento instantâneo futuro
              msg.plaintext = plaintext;
              saveEncryptedMessage(msg);
            } catch {
              plaintext = 'Mensagem indisponível';
            }
          }

          decryptedList.push({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            plaintext,
            createdAt: msg.createdAt,
            isEncrypted: true,
            algorithm: msg.payload?.algorithm,
          });
        }

        if (isMounted) {
          setMessages(decryptedList);
        }
      } catch (err) {
        console.error('Erro ao preparar conversa:', err);
      }
    }

    loadContactAndMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedContact, deviceKey, conversationId, currentUserId]);

  // Envio de nova mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !deviceKey || !contactPublicJwk || isSending) return;

    setIsSending(true);
    const textToSend = inputMessage.trim();

    try {
      // Criptografa ponta a ponta
      const payload = await encryptE2EEMessage(
        textToSend,
        deviceKey.privateKey,
        contactPublicJwk,
        deviceKey.publicKeyJwk,
        deviceKey.deviceId
      );

      // Armazena no dispositivo com texto legível preservado para o usuário local
      const storedMsg: StoredEncryptedMessage = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        receiverId: selectedContact.id,
        payload,
        plaintext: textToSend,
        createdAt: new Date().toISOString(),
      };

      saveEncryptedMessage(storedMsg);

      // Atualiza interface imediatamente
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
        },
      ]);

      setInputMessage('');
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
      showToast({
        type: 'error',
        title: 'Não foi possível enviar',
        description: 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row border-b border-border bg-background">
      {/* Coluna da Esquerda: Conversas / Contatos */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-lg font-black text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            Mensagens
          </h1>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privado
          </span>
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
      </div>

      {/* Coluna da Direita: Conversa */}
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
                <Lock className="w-3 h-3 text-emerald-500" />
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
            <span className="hidden sm:inline">Chave de Segurança</span>
          </Button>
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Aviso discreto de privacidade */}
          <div className="flex justify-center my-1">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-muted/60 rounded-full text-[11px] text-slate-400 border border-border/40">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Mensagens protegidas de ponta a ponta</span>
            </div>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-none shadow-sm'
                      : 'bg-surface border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.plaintext}</p>

                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMe ? 'text-accent-foreground/75' : 'text-slate-400'
                  }`}>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-current opacity-90" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compositor de Mensagem */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
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

      {/* Modal de Verificação da Chave de Segurança */}
      <Modal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        title="Chave de Segurança"
      >
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs leading-relaxed">
            Este código confirma a autenticidade e a privacidade da conversa com <strong>@{selectedContact.username}</strong>.
          </p>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Código de Verificação
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 tracking-wider select-all">
              {safetyInfo?.code || 'Calculando...'}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsSafetyModalOpen(false)}
            className="w-full justify-center"
          >
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
