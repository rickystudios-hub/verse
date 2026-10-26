'use client';

import * as React from 'react';
import { 
  Lock, 
  KeyRound, 
  Send, 
  CheckCheck,
  ShieldCheck,
  MoreVertical,
  Edit2,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Mic,
  Square,
  X,
  Download
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
  editEncryptedMessage,
  deleteEncryptedMessage,
  StoredEncryptedMessage 
} from '@/features/e2ee/storage';
import { DeviceKeyPair, SafetyNumberInfo, DecryptedMessage } from '@/features/e2ee/types';

interface PendingAttachment {
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size: number;
}

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

  // Estados de Edição e Exclusão de mensagens
  const [editingMessage, setEditingMessage] = React.useState<DecryptedMessage | null>(null);
  const [editInputText, setEditInputText] = React.useState('');
  const [activeMenuMessageId, setActiveMenuMessageId] = React.useState<string | null>(null);

  // Estados de Anexo de Mídia (Imagens, Vídeos, Áudio, Arquivos)
  const [attachment, setAttachment] = React.useState<PendingAttachment | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Gravação de Áudio ao vivo
  const [isRecordingAudio, setIsRecordingAudio] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

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
        
        // Mensagem inicial caso a conversa esteja vazia
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

        // Recupera as mensagens com texto e anexos
        const decryptedList: DecryptedMessage[] = [];
        for (const msg of storedList) {
          let plaintext = msg.plaintext;
          
          if (!plaintext && !msg.mediaUrl) {
            try {
              const isMe = msg.senderId === currentUserId;
              const keyToUse = isMe ? peerJwk : msg.payload?.senderPublicKeyJwk;
              plaintext = await decryptE2EEMessage(msg.payload, deviceKey.privateKey, keyToUse);
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
            plaintext: plaintext || '',
            isEdited: msg.isEdited,
            editedAt: msg.editedAt,
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
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

  // Manipulador de anexo de arquivos locais (imagem, vídeo, áudio, documentos)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo suportado é de 25MB.',
      });
      return;
    }

    let type: 'image' | 'video' | 'audio' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result as string,
        type,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);

    // Limpa valor para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Gravação de Áudio pelo Microfone
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            url: reader.result as string,
            type: 'audio',
            name: `Mensagem de voz (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).webm`,
            size: audioBlob.size,
          });
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      showToast({
        type: 'error',
        title: 'Acesso ao microfone negado',
        description: 'Permita o acesso ao microfone no seu navegador para gravar mensagens de voz.',
      });
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Envio de nova mensagem (Texto e/ou Anexo)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = inputMessage.trim().length > 0;
    const hasAttachment = attachment !== null;

    if ((!hasText && !hasAttachment) || !deviceKey || !contactPublicJwk || isSending) return;

    setIsSending(true);
    const textToSend = inputMessage.trim();

    try {
      const payload = await encryptE2EEMessage(
        textToSend || (attachment ? `[${attachment.name}]` : ''),
        deviceKey.privateKey,
        contactPublicJwk,
        deviceKey.publicKeyJwk,
        deviceKey.deviceId
      );

      const storedMsg: StoredEncryptedMessage = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        receiverId: selectedContact.id,
        payload,
        plaintext: textToSend,
        mediaUrl: attachment?.url,
        mediaType: attachment?.type,
        fileName: attachment?.name,
        fileSize: attachment?.size,
        createdAt: new Date().toISOString(),
      };

      saveEncryptedMessage(storedMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: storedMsg.id,
          conversationId,
          senderId: currentUserId,
          receiverId: selectedContact.id,
          plaintext: textToSend,
          mediaUrl: storedMsg.mediaUrl,
          mediaType: storedMsg.mediaType,
          fileName: storedMsg.fileName,
          fileSize: storedMsg.fileSize,
          createdAt: storedMsg.createdAt,
          isEncrypted: true,
          algorithm: payload.algorithm,
        },
      ]);

      setInputMessage('');
      setAttachment(null);
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

  // Edição de Mensagem
  const handleOpenEdit = (msg: DecryptedMessage) => {
    setEditingMessage(msg);
    setEditInputText(msg.plaintext);
    setActiveMenuMessageId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !editInputText.trim()) return;

    const newText = editInputText.trim();
    const success = editEncryptedMessage(editingMessage.id, newText);

    if (success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id
            ? { ...m, plaintext: newText, isEdited: true, editedAt: new Date().toISOString() }
            : m
        )
      );
      setEditingMessage(null);
      showToast({
        type: 'success',
        title: 'Mensagem editada',
        description: 'Sua alteração foi salva com sucesso.',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Erro ao editar',
        description: 'Não foi possível salvar a alteração.',
      });
    }
  };

  // Exclusão de Mensagem
  const handleDeleteMessage = (messageId: string) => {
    setActiveMenuMessageId(null);
    if (!confirm('Deseja excluir esta mensagem?')) return;

    const success = deleteEncryptedMessage(messageId);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast({
        type: 'info',
        title: 'Mensagem excluída',
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            const isMenuOpen = activeMenuMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative ${
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-none shadow-sm'
                      : 'bg-surface border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  {/* Conteúdo de Mídia (Imagem, Vídeo, Áudio ou Arquivo) */}
                  {msg.mediaUrl && (
                    <div className="mb-2 space-y-1.5 overflow-hidden rounded-xl">
                      {msg.mediaType === 'image' && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={msg.mediaUrl}
                          alt={msg.fileName || 'Imagem'}
                          className="max-h-64 rounded-xl object-cover w-full cursor-pointer hover:opacity-95"
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
                        />
                      )}

                      {msg.mediaType === 'video' && (
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="max-h-64 rounded-xl w-full bg-black"
                        />
                      )}

                      {msg.mediaType === 'audio' && (
                        <div className="p-1">
                          <audio src={msg.mediaUrl} controls className="w-full h-9" />
                        </div>
                      )}

                      {msg.mediaType === 'file' && (
                        <a
                          href={msg.mediaUrl}
                          download={msg.fileName || 'arquivo'}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                        >
                          <FileText className="w-6 h-6 shrink-0 text-accent" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{msg.fileName || 'Arquivo'}</p>
                            <p className="text-[10px] opacity-75">{formatFileSize(msg.fileSize)}</p>
                          </div>
                          <Download className="w-4 h-4 shrink-0 opacity-80" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Texto da mensagem */}
                  {msg.plaintext && (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.plaintext}</p>
                  )}

                  {/* Rodapé da mensagem: Hora, editada e confirmação */}
                  <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                    isMe ? 'text-accent-foreground/75' : 'text-slate-400'
                  }`}>
                    {msg.isEdited && (
                      <span className="italic opacity-75">(editada)</span>
                    )}
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-current opacity-90" />}
                  </div>

                  {/* Botão de Opções da Mensagem (3 pontos) */}
                  <div className={`absolute top-1 ${isMe ? '-left-7' : '-right-7'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button
                      type="button"
                      onClick={() => setActiveMenuMessageId(isMenuOpen ? null : msg.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-foreground hover:bg-surface-muted transition-colors"
                      title="Opções da mensagem"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Menu de Ações */}
                    {isMenuOpen && (
                      <div className={`absolute z-30 ${isMe ? 'right-0' : 'left-0'} top-6 w-32 bg-surface border border-border rounded-xl shadow-lg p-1 text-xs space-y-0.5`}>
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(msg)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-surface-muted transition-colors text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-accent" />
                            <span>Editar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pré-visualização do Anexo Selecionado antes de enviar */}
        {attachment && (
          <div className="p-2.5 bg-surface-muted border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {attachment.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />}
              {attachment.type === 'video' && <VideoIcon className="w-4 h-4 text-purple-400 shrink-0" />}
              {attachment.type === 'audio' && <Music className="w-4 h-4 text-emerald-400 shrink-0" />}
              {attachment.type === 'file' && <FileText className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="font-semibold text-foreground truncate">{attachment.name}</span>
              <span className="text-[11px] text-slate-500">({formatFileSize(attachment.size)})</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full text-slate-400 hover:text-red-400 transition-colors"
              title="Remover anexo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barra de Gravação de Áudio ao vivo */}
        {isRecordingAudio && (
          <div className="p-3 bg-red-950/30 border-t border-red-800/40 flex items-center justify-between text-xs text-red-400 animate-pulse">
            <div className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span>Gravando áudio ({recordingSeconds}s)...</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopRecordingAudio}
              className="gap-1 text-red-400 border-red-800/60 hover:bg-red-500/10 text-xs py-1 h-7"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Concluir</span>
            </Button>
          </div>
        )}

        {/* Compositor de Mensagem */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface flex items-center gap-2">
          {/* Input invisível para seleção de arquivo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
            className="hidden"
          />

          {/* Botão Anexar Arquivo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-foreground shrink-0 rounded-xl"
            title="Anexar arquivo, imagem, vídeo ou áudio"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Botão Gravar Áudio */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={isRecordingAudio ? stopRecordingAudio : startRecordingAudio}
            className={`p-2 shrink-0 rounded-xl transition-colors ${
              isRecordingAudio ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-foreground'
            }`}
            title={isRecordingAudio ? 'Parar gravação' : 'Gravar áudio'}
          >
            <Mic className="w-4 h-4" />
          </Button>

          {/* Campo de Texto */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={attachment ? 'Adicione uma legenda (opcional)...' : 'Digite uma mensagem...'}
            className="flex-1 bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-accent"
          />

          {/* Botão Enviar */}
          <Button
            type="submit"
            variant="accent"
            size="sm"
            disabled={(!inputMessage.trim() && !attachment) || isSending}
            className="px-4 py-2.5 gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </form>
      </div>

      {/* Modal de Edição de Mensagem */}
      <Modal
        isOpen={editingMessage !== null}
        onClose={() => setEditingMessage(null)}
        title="Editar Mensagem"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Texto da mensagem
            </label>
            <textarea
              value={editInputText}
              onChange={(e) => setEditInputText(e.target.value)}
              rows={3}
              required
              className="w-full p-3 bg-surface-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingMessage(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={!editInputText.trim()}
              className="font-bold"
            >
              Salvar Alteração
            </Button>
          </div>
        </form>
      </Modal>

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
