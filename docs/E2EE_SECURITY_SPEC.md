# ESPECIFICAÇÃO DE ARQUITETURA E SEGURANÇA: MENSAGENS E2EE (FASE 6)

Este documento estabelece os critérios técnicos, requisitos criptográficos e limites de segurança para a funcionalidade de mensagens de ponta a ponta (**End-to-End Encryption**) do **VÉRSE**.

---

## 1. Princípios Criptográficos Inegociáveis

1. **Zero Texto Claro no Servidor:** O servidor nunca recebe, processa ou armazena o texto claro de mensagens privadas.
2. **Sem Chaves Privadas no Servidor:** As chaves privadas dos pares de identidade e das chaves de sessão permanecem exclusivamente nos dispositivos dos usuários (armazenamento seguro via IndexedDB / Web Crypto API).
3. **Não Inventar Criptografia:** Proibido criar algoritmos proprietários de cifra, hash ou troca de chaves.
4. **Respeito aos Padrões da Indústria:** A implementação utilizará o protocolo Double Ratchet / Signal Protocol ou o protocolo X3DH documentado por bibliotecas mantidas (ex: `@signalapp/libsignal-client` compilado para WASM ou `matrix-js-sdk` / `@matrix-org/olm`).
5. **Sem Fallback Silencioso para Texto Puro:** Caso uma sessão falhe na descriptografia ou um dispositivo não esteja verificado, o sistema deve exibir um erro de segurança explícito e NUNCA enviar ou receber texto claro como alternativa.

---

## 2. Requisitos Técnicos para a Fase 6

- [ ] Avaliação de compatibilidade da biblioteca criptográfica com Next.js SSR / Client Bundles (isolamento estrito no browser).
- [ ] Geração de Identity Key Pairs (IK), Signed Prekeys (SPK) e One-Time Prekeys (OPK) via Web Crypto API.
- [ ] Publicação apenas das chaves públicas na tabela `device_keys`.
- [ ] Mecanismo de verificação de chave/dispositivo (Safety Numbers ou Fingerprints para confirmação presencial/fora de banda).
- [ ] Tratamento de múltiplos dispositivos e revogação de dispositivos antigos.
- [ ] Forward Secrecy (sigilo prospectivo) e Post-Compromise Security (recuperação pós-comprometimento).
- [ ] Notificações no servidor sem conteúdo sensível (apenas "Você recebeu uma nova mensagem").

---

## 3. Estado Atual na Fundação (Fase 2)
Na Fase 2, as tabelas `conversations`, `conversation_members`, `encrypted_messages` e `device_keys` foram criadas no banco de dados com políticas RLS estritas, permitindo que a aplicação esteja preparada para receber o protocolo criptográfico na Fase 6 sem necessidade de quebrar a arquitetura do banco. A interface de mensagens no frontend apresenta o status modular com aviso transparente de que o recurso está em preparação para a Fase 6.
