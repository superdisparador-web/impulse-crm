# WhatsApp Module - Design Técnico Enterprise

## 1. Objetivos do módulo

- Criar um módulo WhatsApp multi-tenant, escalável e provider-based para o Impulse CRM.
- Usar a API Oficial da Meta como provider principal, mantendo contratos para inclusão futura de providers como Evolution API sem alterar regras de negócio.
- Suportar milhões de mensagens, milhares de conexões simultâneas, múltiplos números por organização, filas assíncronas, retries, auditoria e WebSockets.
- Integrar conversas, mensagens e eventos ao ecossistema do CRM: Leads, Pipeline, Users, Organizations, Dashboard, Campanhas e IA.
- Preservar Clean Architecture, Domain-driven design, SOLID, Repository Pattern e arquitetura orientada a eventos.

## 2. Responsabilidades

O módulo é responsável por:

- Gerenciar providers, conexões, números, templates, conversas, participantes, mensagens, anexos, status, webhooks, inboxes, atribuições, notas, labels, respostas rápidas, reações e contexto de IA.
- Traduzir comandos de negócio para contratos provider-agnostic.
- Normalizar webhooks recebidos de providers em eventos de domínio internos.
- Deduplicar eventos, mensagens e callbacks de status.
- Orquestrar envio, recebimento, sincronização, criação automática de leads, associação com pipeline e publicação na timeline.
- Garantir isolamento por `organizationId`, controle de permissões e trilhas de auditoria.

O módulo não deve ser responsável por:

- Implementar regras internas de scoring de Leads.
- Implementar motor de automação de Campanhas.
- Implementar motor de IA. Deve apenas expor contexto e eventos consumíveis.
- Persistir arquivos binários diretamente no PostgreSQL.
- Acoplar regras de negócio à Meta ou a qualquer provider específico.

## 3. Escopo

### Dentro do escopo

- WhatsApp inbound e outbound.
- Conversas 1:1 entre organização e contato externo.
- Mensagens de texto, templates, áudio, imagem, vídeo, documentos, localização, contatos compartilhados, botões e respostas rápidas.
- Webhooks de mensagens, status, templates e conexão.
- Multi-inbox, múltiplos atendentes, múltiplos números e filas.
- Histórico, timeline e eventos de domínio.

### Fora do escopo inicial

- Grupos de WhatsApp como canal principal de atendimento.
- Chamadas de voz ou vídeo.
- Cobrança detalhada por conversa da Meta, exceto armazenamento de metadados para relatórios futuros.
- Implementação efetiva de migrations, DTOs, controllers, services ou código neste documento.

## 4. Arquitetura geral

A arquitetura deve seguir quatro camadas:

1. **Domain**: entidades, value objects, eventos de domínio, contratos de repositories e portas de providers.
2. **Application**: casos de uso, orquestração, transações, autorização de alto nível, publicação de eventos e integração com filas.
3. **Infrastructure**: Prisma repositories, clients dos providers, storage, cache Redis, BullMQ, WebSocket gateway, adapters externos.
4. **Interface**: REST controllers, webhook controllers, guards, presenters e documentação Swagger.

A regra central é que o domínio e os casos de uso dependem apenas de abstrações. A API da Meta deve existir como adapter concreto de `WhatsappProviderPort`.

## 5. Diagrama textual dos componentes

```text
[REST API / Webhook API / WebSocket Gateway]
              |
              v
[Application Use Cases]
  |       |       |       |
  v       v       v       v
[Domain Services] [Domain Events] [Repository Ports] [Provider Ports]
              |                         |
              v                         v
       [Event Bus]              [Infrastructure Adapters]
          |                     |        |        |
          v                     v        v        v
 [BullMQ Workers]        [Prisma] [Meta API] [Redis] [Object Storage]
          |
          v
 [Leads / Pipeline / Dashboard / Campaigns / AI / Timeline]
```

## 6. Entidades principais

### WhatsappProvider

Representa um provider disponível. Ex.: `META_OFFICIAL`, `EVOLUTION_API`.

Campos conceituais:

- `id`, `organizationId` opcional para providers globais ou customizados por tenant.
- `code`, `name`, `status`, `capabilities`, `configSchema`, `createdAt`, `updatedAt`.

### WhatsappConnection

Representa a conexão de uma organização com um provider.

Campos conceituais:

- `id`, `organizationId`, `providerId`, `name`, `status`, `credentialsRef`, `metadata`, `lastSyncAt`, `createdById`, `createdAt`, `updatedAt`, `deletedAt`.

### PhoneNumber

Número conectado à organização.

Campos conceituais:

- `id`, `organizationId`, `connectionId`, `displayName`, `e164`, `countryCode`, `providerPhoneNumberId`, `businessAccountId`, `qualityRating`, `status`, `defaultInboxId`, `createdAt`, `updatedAt`.

### Inbox

Caixa compartilhada para atendimento.

Campos conceituais:

- `id`, `organizationId`, `name`, `description`, `status`, `routingStrategy`, `businessHours`, `createdAt`, `updatedAt`.

### Conversation

Thread entre um número da organização e um contato externo.

Campos conceituais:

- `id`, `organizationId`, `phoneNumberId`, `inboxId`, `leadId`, `pipelineDealId`, `externalContactPhone`, `externalContactName`, `status`, `lastMessageAt`, `lastInboundAt`, `lastOutboundAt`, `unreadCount`, `sessionExpiresAt`, `metadata`, `createdAt`, `updatedAt`, `closedAt`.

### ConversationSession

Representa a janela de atendimento do WhatsApp vinculada a uma conversa, especialmente a janela de 24 horas aberta por mensagens inbound.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `openedAt`, `expiresAt`, `windowType`, `canSendFreeMessage`, `lastInboundAt`, `createdAt`, `updatedAt`.

Observações arquiteturais:

- `Conversation.sessionExpiresAt` permanece como snapshot de leitura rápida, enquanto `ConversationSession` preserva o histórico e a semântica completa das janelas.
- A criação de uma nova sessão deve ocorrer de forma idempotente quando uma mensagem inbound reabrir ou estender a janela de atendimento.

### ConversationParticipant

Participantes internos e externos da conversa.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `type`, `userId`, `leadId`, `externalPhone`, `displayName`, `joinedAt`, `leftAt`.

### ConversationOptOut

Controle tenant-scoped de opt-out, bloqueio de campanhas e restrições de mensagens para um telefone externo.

Campos conceituais:

- `id`, `organizationId`, `phone`, `leadId`, `source`, `reason`, `createdAt`.

Observações arquiteturais:

- `leadId` é opcional porque o opt-out pode ser recebido antes da criação ou associação de um Lead.
- O bloqueio deve ser consultado antes de envios por Campanhas, automações e IA, sem impedir necessariamente respostas transacionais ou atendimento humano permitido pela política da organização.

### Message

Mensagem normalizada provider-agnostic.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `phoneNumberId`, `providerMessageId`, `direction`, `type`, `body`, `payload`, `status`, `sentByUserId`, `replyToMessageId`, `templateId`, `idempotencyKey`, `providerTimestamp`, `createdAt`, `updatedAt`, `deletedAt`.

### Attachment

Metadados de mídia vinculada a mensagens.

Campos conceituais:

- `id`, `organizationId`, `messageId`, `type`, `fileName`, `mimeType`, `sizeBytes`, `storageKey`, `storageUrl`, `providerMediaId`, `checksum`, `durationMs`, `width`, `height`, `transcriptionText`, `createdAt`.

### MessageStatus

Histórico de estados da mensagem.

Campos conceituais:

- `id`, `organizationId`, `messageId`, `status`, `providerStatus`, `reason`, `occurredAt`, `rawPayload`, `createdAt`.

### WebhookEvent

Evento bruto recebido do provider.

Campos conceituais:

- `id`, `organizationId`, `providerId`, `connectionId`, `phoneNumberId`, `eventType`, `providerEventId`, `deduplicationKey`, `payload`, `processingStatus`, `receivedAt`, `processedAt`, `errorMessage`, `retryCount`.

### Template

Template de mensagem aprovado ou sincronizado com provider.

Campos conceituais:

- `id`, `organizationId`, `phoneNumberId`, `providerTemplateId`, `name`, `language`, `category`, `status`, `components`, `createdAt`, `updatedAt`.

### TemplateCategory

Categoria de template.

Campos conceituais:

- `id`, `organizationId`, `name`, `description`, `providerCategory`, `createdAt`, `updatedAt`.

### TemplateVariable

Variáveis mapeáveis de template.

Campos conceituais:

- `id`, `organizationId`, `templateId`, `key`, `position`, `exampleValue`, `sourceType`, `sourcePath`, `required`.

### ConversationLabel

Marcador aplicado a conversas.

Campos conceituais:

- `id`, `organizationId`, `name`, `color`, `description`, `createdAt`, `updatedAt`.

### ConversationAssignment

Atribuição da conversa para usuário, time ou inbox.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `assignedToUserId`, `assignedByUserId`, `inboxId`, `status`, `assignedAt`, `unassignedAt`.

### QuickReply

Resposta rápida reutilizável.

Campos conceituais:

- `id`, `organizationId`, `inboxId`, `title`, `shortcut`, `body`, `attachments`, `visibility`, `createdById`, `createdAt`, `updatedAt`.

### ConversationNote

Nota interna vinculada à conversa.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `authorUserId`, `body`, `visibility`, `createdAt`, `updatedAt`, `deletedAt`.

### MessageReaction

Reação em mensagem.

Campos conceituais:

- `id`, `organizationId`, `messageId`, `emoji`, `reactedByUserId`, `externalContactPhone`, `providerReactionId`, `createdAt`, `removedAt`.

### AIConversationContext

Contexto resumido para IA.

Campos conceituais:

- `id`, `organizationId`, `conversationId`, `leadId`, `summary`, `sentiment`, `intent`, `entities`, `lastAnalyzedMessageId`, `embeddingRef`, `createdAt`, `updatedAt`.

### OrganizationFeatureFlag

Configuração por organização para habilitar ou desabilitar capacidades do módulo e integrações adjacentes de forma progressiva.

Campos conceituais:

- `id`, `organizationId`, `flag`, `enabled`, `metadata`, `createdAt`, `updatedAt`.

Observações arquiteturais:

- Deve ser consultada pelos casos de uso antes de acionar IA, Campanhas, Evolution API, Meta API, Transcrição, Voice, Copilot ou WebSocket.
- A entidade pode viver no módulo Organizations, mas o WhatsApp deve depender apenas de uma porta de leitura de feature flags para evitar acoplamento.

### CampaignMessage

Entidade intermediária do contexto de Campanhas para representar cada tentativa planejada ou executada de disparo antes da materialização de uma `Message`.

Campos conceituais:

- `id`, `organizationId`, `campaignId`, `messageId`, `leadId`, `phone`, `status`, `scheduledAt`, `sentAt`, `attemptCount`, `batchId`, `segmentSnapshot`, `errorReason`, `createdAt`, `updatedAt`.

Observações arquiteturais:

- A relação correta é `Campaign -> CampaignMessage -> Message`; `Campaign` não deve se relacionar diretamente com `Message`.
- `CampaignMessage` preserva metadados de segmentação, lote, tentativa, opt-out e auditoria que não pertencem ao domínio de mensagens conversacionais.

## 7. Relacionamentos entre entidades

- `Organization` 1:N `WhatsappConnection`, `PhoneNumber`, `Inbox`, `Conversation`, `Message`, `WebhookEvent`, `Template`, `QuickReply`, `OrganizationFeatureFlag`, `ConversationOptOut`.
- `WhatsappProvider` 1:N `WhatsappConnection`.
- `WhatsappConnection` 1:N `PhoneNumber`.
- `PhoneNumber` 1:N `Conversation`, `Message`, `Template`.
- `Inbox` 1:N `PhoneNumber`, `Conversation`, `QuickReply`, `ConversationAssignment`.
- `Conversation` 1:N `ConversationParticipant`, `ConversationSession`, `Message`, `ConversationAssignment`, `ConversationNote`.
- `Conversation` N:M `ConversationLabel` por tabela intermediária `ConversationLabelAssignment`.
- `Conversation` N:1 opcional `Lead`.
- `Conversation` N:1 opcional `PipelineDeal` ou entidade equivalente do módulo Pipeline.
- `Message` 1:N `Attachment`, `MessageStatus`, `MessageReaction`.
- `Message` N:1 opcional `Template`.
- `Message` N:1 opcional `Message` por `replyToMessageId`.
- `WebhookEvent` N:1 `WhatsappProvider`, `WhatsappConnection` e opcional `PhoneNumber`.
- `Template` 1:N `TemplateVariable` e N:1 `TemplateCategory`.
- `AIConversationContext` 1:1 `Conversation`.
- `ConversationOptOut` N:1 opcional `Lead` e deve ser único por `organizationId + phone` quando ativo.
- `Campaign` 1:N `CampaignMessage`; `CampaignMessage` N:1 opcional `Message`, evitando acoplamento direto entre `Campaign` e `Message`.
- `OrganizationFeatureFlag` N:1 `Organization`, com unicidade por `organizationId + flag`.

## 8. Fluxo completo de envio de mensagens

1. Usuário, campanha, automação ou IA solicita envio.
2. Caso de uso valida organização, permissões, inbox, número, conversa, janela de atendimento e tipo da mensagem.
3. Caso de uso resolve provider pela `WhatsappConnection` do `PhoneNumber`.
4. Mensagem é criada com status inicial `QUEUED` e `idempotencyKey`.
5. Evento `WhatsappMessageQueued` é publicado.
6. Job BullMQ `send-whatsapp-message` é criado por tenant, provider e número.
7. Worker carrega a mensagem e chama `WhatsappProviderPort.sendMessage`.
8. Adapter da Meta transforma payload interno em payload oficial da Meta.
9. Em sucesso, `providerMessageId` é salvo e status transita para `SENT` ou `ACCEPTED`.
10. Em erro recuperável, retry com backoff exponencial e jitter.
11. Em erro definitivo, status `FAILED` e evento de domínio.
12. WebSocket publica atualização para usuários autorizados na inbox.
13. Timeline de Lead/Pipeline recebe evento agregado.

Complementos incrementais:

- O caso de uso também deve validar feature flags, opt-out e políticas específicas da organização antes de enfileirar o envio.
- `WhatsappMessagePolicyService` centraliza as regras de envio: janela de 24 horas, necessidade de template, validação de mídia, limites do provider, tamanho máximo, idioma e permissões.

## 9. Fluxo completo de recebimento via Webhook

1. Provider envia webhook para endpoint público.
2. Controller valida assinatura, challenge e origem.
3. Payload bruto é persistido em `WebhookEvent` antes de processamento pesado.
4. Deduplicação é aplicada por `deduplicationKey` única.
5. Evento é colocado em fila `process-whatsapp-webhook`.
6. Worker normaliza payload usando o adapter do provider.
7. Sistema resolve organização, conexão e número pelo identificador do provider.
8. Sistema localiza ou cria `Conversation` pelo par `phoneNumberId + externalContactPhone`.
9. Sistema persiste `Message`, `Attachment` e participantes necessários.
10. Sistema atualiza unread count, `lastMessageAt`, sessão e inbox.
11. Sistema cria Lead automaticamente quando aplicável.
12. Sistema publica eventos `WhatsappMessageReceived`, `ConversationUpdated` e `TimelineEventCreated`.
13. WebSocket notifica atendentes conectados.
14. `WebhookEvent` é marcado como `PROCESSED`.

## 10. Fluxo de sincronização

- Sincronização manual ou agendada deve consultar provider para números, templates, qualidade, status de conexão e metadados.
- Cada sincronização deve ser idempotente e incremental usando `lastSyncAt`.
- Templates devem ser reconciliados por `providerTemplateId + language + name`.
- Números devem ser reconciliados por `providerPhoneNumberId` e `e164`.
- Divergências devem gerar eventos de auditoria e domínio.

## 11. Fluxo de atualização de status

1. Provider envia webhook de status.
2. Evento bruto é persistido e deduplicado.
3. Worker encontra `Message` por `providerMessageId` e `organizationId`.
4. Cria registro em `MessageStatus`.
5. Atualiza snapshot `Message.status` apenas se a transição for válida.
6. Publica `WhatsappMessageStatusUpdated`.
7. Notifica WebSocket e Dashboard.

## 12. Fluxo de criação automática de Leads

- Ao receber primeira mensagem inbound sem `leadId`, o módulo consulta serviço de Leads por telefone E.164.
- Antes da criação, o módulo deve verificar `ConversationOptOut` para não reativar fluxos de campanha indevidos em contatos bloqueados.
- Se não existir lead e a configuração da organização permitir, cria Lead mínimo com telefone, nome externo quando disponível e origem `WHATSAPP`.
- A deduplicação de Leads deve continuar pertencendo ao módulo Leads.
- A conversa passa a apontar para `leadId`.
- Um evento de timeline é gerado para registrar a origem.

## 13. Fluxo de associação com Pipeline

- Conversas podem ser associadas manualmente ou por automação a um negócio do Pipeline.
- Ao criar Lead automaticamente, regra configurável pode criar ou associar deal em pipeline padrão.
- Eventos relevantes de conversa podem aparecer na visão do deal.
- O WhatsApp não deve alterar etapas de pipeline diretamente sem passar por caso de uso do módulo Pipeline.

## 14. Fluxo de Timeline

- O módulo deve publicar eventos normalizados consumidos pelo `TimelineService`.
- Eventos candidatos: mensagem recebida, mensagem enviada, conversa aberta, conversa fechada, lead criado, deal associado, nota criada, atribuição alterada.
- Timeline deve ser leitura agregada, evitando duplicação rígida de dados.

## 15. Estratégia para anexos

- Arquivos binários devem ir para object storage compatível com S3.
- O acesso ao object storage deve ocorrer através de um `StorageProviderPort`, nunca por integração direta no domínio.
- Adapters futuros devem permitir Amazon S3, Cloudflare R2, Google Cloud Storage, Azure Blob e Storage Local sem alterar entidades ou casos de uso.
- PostgreSQL armazena apenas metadados, chaves, checksums e links temporários.
- Downloads de mídia do provider devem ocorrer em worker assíncrono.
- URLs públicas devem ser assinadas e expirar.
- Antivírus e validação de MIME devem ser previstos para upload outbound.
- `WhatsappMediaStorageService` deve depender de `StorageProviderPort`, preservando o isolamento entre política de anexos e provider de armazenamento.

## 16. Estratégia para mensagens de áudio

- Armazenar duração, codec, mime type e transcrição opcional.
- Preparar fila para transcrição por IA.
- Suportar voice notes e arquivos de áudio comuns como tipos distintos no payload.

## 17. Estratégia para documentos

- Validar tamanho, extensão, MIME e política da organização.
- Indexar metadados para busca.
- Suportar pré-visualização quando possível via serviço externo, nunca bloqueando o fluxo principal.

## 18. Estratégia para imagens

- Armazenar dimensões, thumbnails e checksum.
- Gerar thumbnails de forma assíncrona.
- Preservar metadados mínimos e remover dados sensíveis quando política exigir.

## 19. Estratégia para vídeos

- Armazenar duração, dimensões, thumbnail e tamanho.
- Processamento pesado deve ser em fila separada.
- Limites por provider devem ser aplicados antes do envio.

## 20. Estratégia para localização

- Persistir latitude, longitude, nome e endereço no `Message.payload`.
- Exibir mapa por integração frontend.
- Nunca transformar localização em endereço obrigatório de Lead sem confirmação.

## 21. Estratégia para contatos compartilhados

- Persistir vCards normalizados no payload.
- Permitir criar Lead a partir de contato compartilhado apenas por ação explícita ou automação configurada.
- Deduplicar telefones normalizados em E.164.

## 22. Estratégia para respostas rápidas

- `QuickReply` deve ser tenant-scoped e opcionalmente inbox-scoped.
- Suportar variáveis simples como nome do lead, usuário e organização.
- Uso de quick reply gera mensagem outbound comum, preservando autoria do usuário.

## 23. Estratégia para Inbox compartilhada

- Inboxes agrupam números, conversas, permissões e roteamento.
- Conversas podem migrar entre inboxes com auditoria.
- Estratégias de roteamento: manual, round-robin, menor carga, horário comercial e regras por label.

## 24. Estratégia para múltiplos atendentes

- Uma conversa pode ter responsável principal e participantes internos.
- Locks otimistas evitam sobrescrita de atribuições.
- Presença, digitação e leitura interna devem usar WebSockets e Redis Pub/Sub.

## 25. Estratégia para múltiplos números por organização

- Cada `PhoneNumber` pertence a uma `WhatsappConnection` e pode ter inbox padrão.
- Conversas são únicas por `organizationId + phoneNumberId + externalContactPhone` enquanto ativas, com histórico preservado.
- Regras de envio devem escolher número por inbox, campanha, pipeline, usuário ou configuração padrão.

## 26. Estratégia para rate limit

- Rate limit por tenant, provider, conexão, número e tipo de operação.
- Usar Redis token bucket ou leaky bucket.
- Respeitar limites e qualidade do provider.
- Degradação controlada: enfileirar, atrasar ou falhar com erro explícito.

## 27. Estratégia para filas

Filas BullMQ previstas:

- `whatsapp-send-message`
- `whatsapp-process-webhook`
- `whatsapp-download-media`
- `whatsapp-sync-provider`
- `whatsapp-update-template-status`
- `whatsapp-ai-analysis`
- `whatsapp-timeline-dispatch`

Cada job deve carregar dados atuais do banco, não confiar em payloads grandes ou obsoletos.

## 28. Estratégia para retries

- Backoff exponencial com jitter.
- Classificar erros em recuperáveis, não recuperáveis, rate limited e provider outage.
- Usar dead-letter queues para falhas persistentes.
- Garantir idempotência em jobs por `idempotencyKey`, `providerMessageId` e `deduplicationKey`.

## 29. Estratégia para deduplicação de webhooks

- Chave única por provider: `organizationId + providerId + deduplicationKey`.
- Quando provider não fornecer ID confiável, gerar hash canônico do payload com timestamp, número e ID da mensagem.
- Persistir evento bruto mesmo quando duplicado, se necessário, em modo auditável; processamento de negócio deve ocorrer uma única vez.

## 30. Estratégia para auditoria

- Registrar quem enviou, atribuiu, fechou, reabriu, editou notas, alterou labels e modificou configurações.
- Webhooks e status devem guardar payload bruto com política de retenção.
- Credenciais devem ser referenciadas por secret manager, nunca expostas em logs.
- Auditoria deve ser tenant-scoped e consultável por administradores autorizados.

## 31. Estratégia para cache

- Redis para rate limit, presença, typing indicators, locks distribuídos, snapshots de inbox e metadados de provider.
- Cache de templates e números com invalidação por evento de sincronização.
- Nunca usar cache como fonte única para mensagens ou status críticos.

## 32. Estratégia para índices do banco

Índices essenciais:

- `WhatsappConnection(organizationId, providerId, status)`.
- `PhoneNumber(organizationId, e164)` único quando ativo.
- `PhoneNumber(providerPhoneNumberId)` único por provider.
- `Conversation(organizationId, phoneNumberId, externalContactPhone)`.
- `Conversation(organizationId, inboxId, status, lastMessageAt)`.
- `Conversation(organizationId, leadId)`.
- `Message(organizationId, conversationId, createdAt)`.
- `Message(organizationId, providerMessageId)` único quando não nulo.
- `Message(organizationId, idempotencyKey)` único quando não nulo.
- `MessageStatus(organizationId, messageId, occurredAt)`.
- `WebhookEvent(organizationId, providerId, deduplicationKey)` único.
- `Attachment(organizationId, messageId)`.
- `Template(organizationId, phoneNumberId, name, language)`.
- `ConversationAssignment(organizationId, assignedToUserId, status)`.
- `ConversationSession(organizationId, conversationId, openedAt, expiresAt)`.
- `ConversationOptOut(organizationId, phone)` único quando ativo.
- `OrganizationFeatureFlag(organizationId, flag)` único.
- `CampaignMessage(organizationId, campaignId, status, scheduledAt)`.

Para alto volume, considerar particionamento por mês em `Message`, `MessageStatus` e `WebhookEvent`.

## 33. Estratégia para permissões

- Permissões por organização, inbox e ação.
- Ações: visualizar inbox, enviar mensagem, usar template, atribuir conversa, fechar conversa, gerenciar número, gerenciar provider, ver auditoria, exportar histórico.
- Usuários só podem acessar conversas de inboxes permitidas.
- Mensagens de campanhas e IA devem registrar ator técnico e ator humano responsável quando existir.

## 34. Estratégia de multi-tenancy

- Todas as tabelas de domínio devem possuir `organizationId`.
- Toda query deve filtrar por `organizationId` no repository.
- Chaves únicas devem considerar tenant, exceto identificadores globais de provider quando estritamente necessário.
- Jobs devem carregar e validar `organizationId` antes de processar.
- WebSocket rooms devem ser segmentadas por organização e inbox.

## 35. Eventos de domínio

Eventos previstos:

- `WhatsappConnectionCreated`
- `WhatsappConnectionStatusChanged`
- `WhatsappPhoneNumberSynced`
- `WhatsappConversationOpened`
- `WhatsappConversationClosed`
- `WhatsappConversationAssigned`
- `WhatsappConversationLabeled`
- `WhatsappMessageQueued`
- `WhatsappMessageSent`
- `WhatsappMessageReceived`
- `WhatsappMessageFailed`
- `WhatsappMessageStatusUpdated`
- `WhatsappAttachmentDownloaded`
- `WhatsappWebhookReceived`
- `WhatsappWebhookProcessed`
- `WhatsappTemplateSynced`
- `WhatsappLeadAutoCreated`
- `WhatsappPipelineDealAssociated`
- `WhatsappAIContextUpdated`
- `WhatsappConversationSessionOpened`
- `WhatsappConversationSessionExpired`
- `WhatsappConversationOptOutCreated`
- `WhatsappCampaignMessageLinked`
- `WhatsappConversationMergeRequested`
- `WhatsappConversationMerged`
- `WhatsappConversationSplitRequested`
- `WhatsappConversationSplitCompleted`

## 36. Serviços do módulo

Serviços de domínio:

- `WhatsappConversationDomainService`
- `WhatsappMessagePolicyService`
- `WhatsappMessagePolicyService` deve ser responsável exclusivamente por regras de envio, incluindo janela de 24 horas, necessidade de template, validação de mídia, limites do provider, tamanho máximo, idioma e permissões.
- `WhatsappRoutingDomainService`
- `WhatsappDeduplicationService`
- `WhatsappTemplatePolicyService`
- `WhatsappFeatureFlagService`, como porta de leitura para flags por organização.

Serviços de aplicação:

- `SendWhatsappMessageUseCase`
- `ReceiveWhatsappWebhookUseCase`
- `ProcessWhatsappWebhookUseCase`
- `SyncWhatsappConnectionUseCase`
- `AssignConversationUseCase`
- `CloseConversationUseCase`
- `CreateQuickReplyUseCase`
- `AutoCreateLeadFromConversationUseCase`
- `AssociateConversationWithPipelineUseCase`
- `BuildAIConversationContextUseCase`
- `CreateConversationOptOutUseCase`
- `EvaluateOrganizationFeatureFlagUseCase`
- `RequestConversationMergeUseCase`, futuro e preservando histórico.
- `RequestConversationSplitUseCase`, futuro e preservando histórico.

Serviços de infraestrutura:

- `MetaWhatsappProviderAdapter`
- `WhatsappProviderRegistry`
- `PrismaWhatsappRepository`
- `WhatsappMediaStorageService`
- `StorageProviderPort` com adapters para S3, R2, GCS, Azure Blob e armazenamento local.
- `WhatsappQueueProducer`
- `WhatsappRealtimePublisher`
- `WhatsappAuditLogger`

## 37. Controllers

Controllers previstos, sem implementação neste documento:

- `WhatsappConnectionsController`
- `WhatsappPhoneNumbersController`
- `WhatsappInboxesController`
- `WhatsappConversationsController`
- `WhatsappMessagesController`
- `WhatsappTemplatesController`
- `WhatsappQuickRepliesController`
- `WhatsappWebhookController`
- `WhatsappInternalEventsController`, se houver integração interna assíncrona HTTP.

## 38. Casos de uso

- Criar conexão com provider.
- Sincronizar conexão.
- Listar números.
- Configurar inbox padrão do número.
- Abrir ou localizar conversa.
- Enviar mensagem livre.
- Enviar template.
- Receber webhook.
- Processar webhook.
- Baixar mídia.
- Atualizar status de mensagem.
- Atribuir conversa.
- Transferir inbox.
- Fechar e reabrir conversa.
- Aplicar label.
- Criar nota interna.
- Criar resposta rápida.
- Criar Lead automaticamente.
- Associar conversa ao Pipeline.
- Gerar contexto de IA.
- Registrar opt-out de conversa ou campanha.
- Avaliar feature flag da organização.
- Solicitar merge de conversas, mantendo mensagens originais auditáveis.
- Solicitar split de conversa, movendo subconjunto de mensagens com rastreabilidade.

## 39. Endpoints REST

Endpoints conceituais:

- `POST /whatsapp/connections`
- `GET /whatsapp/connections`
- `GET /whatsapp/connections/:id`
- `POST /whatsapp/connections/:id/sync`
- `PATCH /whatsapp/connections/:id/status`
- `GET /whatsapp/phone-numbers`
- `PATCH /whatsapp/phone-numbers/:id/default-inbox`
- `POST /whatsapp/inboxes`
- `GET /whatsapp/inboxes`
- `GET /whatsapp/conversations`
- `GET /whatsapp/conversations/:id`
- `POST /whatsapp/conversations/:id/messages`
- `POST /whatsapp/conversations/:id/templates`
- `POST /whatsapp/conversations/:id/assignments`
- `POST /whatsapp/conversations/:id/labels`
- `POST /whatsapp/conversations/:id/notes`
- `POST /whatsapp/conversations/:id/close`
- `POST /whatsapp/conversations/:id/reopen`
- `GET /whatsapp/templates`
- `POST /whatsapp/templates/sync`
- `GET /whatsapp/quick-replies`
- `POST /whatsapp/quick-replies`
- `POST /whatsapp/opt-outs`
- `GET /whatsapp/feature-flags`
- `POST /whatsapp/conversations/:id/merge-requests`, futuro.
- `POST /whatsapp/conversations/:id/split-requests`, futuro.
- `POST /webhooks/whatsapp/:providerCode`
- `GET /webhooks/whatsapp/:providerCode`, para verification challenge quando exigido.

## 40. Organização das pastas

Estrutura conceitual recomendada:

```text
backend/src/modules/whatsapp/
  domain/
    entities/
    value-objects/
    events/
    repositories/
    providers/
    storage/
    services/
  application/
    use-cases/
    ports/
    policies/
  infrastructure/
    prisma/
    providers/meta/
    queue/
    cache/
    storage/
    realtime/
    audit/
  interface/
    http/
    webhook/
    websocket/
    presenters/
  whatsapp.module.ts
```

## 41. Estrutura Prisma

Este documento não define schema Prisma executável. A modelagem futura deve refletir as entidades descritas, com:

- `organizationId` obrigatório em todas as models tenant-scoped.
- `createdAt`, `updatedAt` e, quando necessário, `deletedAt`.
- Índices compostos tenant-aware.
- Modelagem futura para `ConversationSession` e `ConversationOptOut`, mantendo histórico de sessões e bloqueios de opt-out sem gerar schema neste documento.
- Constraints únicas para idempotência.
- Campos JSON para payloads provider-specific sem contaminar o domínio.
- Enums normalizados no domínio e mapeamento explícito para valores do provider.

## 42. Possíveis enums

- `WhatsappProviderCode`: `META_OFFICIAL`, `EVOLUTION_API`.
- `WhatsappConnectionStatus`: `PENDING`, `ACTIVE`, `DISCONNECTED`, `ERROR`, `SUSPENDED`.
- `WhatsappPhoneNumberStatus`: `ACTIVE`, `INACTIVE`, `PENDING_VERIFICATION`, `RESTRICTED`.
- `ConversationStatus`: `OPEN`, `PENDING`, `RESOLVED`, `CLOSED`, `ARCHIVED`.
- `ConversationParticipantType`: `INTERNAL_USER`, `LEAD`, `EXTERNAL_CONTACT`, `BOT`, `AI_AGENT`.
- `MessageDirection`: `INBOUND`, `OUTBOUND`.
- `MessageType`: `TEXT`, `TEMPLATE`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `LOCATION`, `CONTACTS`, `INTERACTIVE`, `REACTION`, `SYSTEM`.
- `MessageStatusType`: `QUEUED`, `SENDING`, `SENT`, `DELIVERED`, `READ`, `FAILED`, `CANCELED`.
- `WebhookProcessingStatus`: `RECEIVED`, `QUEUED`, `PROCESSING`, `PROCESSED`, `FAILED`, `IGNORED_DUPLICATE`.
- `TemplateStatus`: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `PAUSED`, `DISABLED`.
- `TemplateCategoryCode`: `MARKETING`, `UTILITY`, `AUTHENTICATION`, `SERVICE`.
- `AssignmentStatus`: `ACTIVE`, `TRANSFERRED`, `UNASSIGNED`.
- `QuickReplyVisibility`: `PRIVATE`, `INBOX`, `ORGANIZATION`.
- `ConversationSessionWindowType`: `CUSTOMER_SERVICE_24H`, `TEMPLATE_REQUIRED`, `EXPIRED`, `MANUAL_OVERRIDE`.
- `ConversationOptOutSource`: `USER_REQUEST`, `CAMPAIGN_UNSUBSCRIBE`, `MANUAL_BLOCK`, `IMPORT`, `AUTOMATION`, `PROVIDER_SIGNAL`.
- `StorageProviderCode`: `S3`, `CLOUDFLARE_R2`, `GOOGLE_CLOUD_STORAGE`, `AZURE_BLOB`, `LOCAL`.
- `OrganizationFeatureFlagCode`: `AI`, `CAMPAIGNS`, `EVOLUTION_API`, `META_API`, `TRANSCRIPTION`, `VOICE`, `COPILOT`, `WEBSOCKET`.

## 43. Possíveis validações

- `organizationId` obrigatório e coerente em todas as operações.
- Telefone em formato E.164.
- Mensagem outbound deve ter conversa, número ativo e provider ativo.
- Mensagem livre deve respeitar janela de atendimento do WhatsApp; fora da janela, exigir template aprovado.
- A janela de atendimento deve ser derivada de `ConversationSession` ativa com `canSendFreeMessage = true`.
- Template deve estar aprovado, no idioma correto e com variáveis obrigatórias preenchidas.
- Arquivos devem respeitar tamanho, MIME e capacidades do provider.
- As validações de mídia devem ser centralizadas em `WhatsappMessagePolicyService`.
- Usuário deve ter permissão sobre a inbox da conversa.
- Webhook deve ter assinatura válida.
- Eventos e jobs devem ser idempotentes.
- Transições de status devem ser monotônicas quando aplicável.
- Lead ou deal associados devem pertencer à mesma organização.
- Feature flags da organização devem ser avaliadas antes de acionar IA, Campanhas, providers alternativos, transcrição, voice, Copilot ou WebSocket.
- Envios de Campanhas devem verificar `ConversationOptOut` e criar `CampaignMessage` antes de materializar `Message`.

## 44. Integrações

### Leads

- Busca e criação por telefone normalizado.
- Registro de origem `WHATSAPP`.
- Timeline agregando eventos de conversa.

### Pipeline

- Associação de conversa a deal.
- Criação opcional de deal por regra.
- Eventos de mensagem visíveis no contexto comercial.

### Users

- Autoria de mensagens, notas e atribuições.
- Permissões por inbox e organização.
- Presença e status de atendimento via WebSocket.

### Organizations

- Tenant raiz de configurações, números, providers e limites.
- Políticas de retenção, rate limit e criação automática de leads.
- Feature flags por organização devem controlar a habilitação de IA, Campanhas, Evolution API, Meta API, Transcrição, Voice, Copilot e WebSocket sem exigir alterações no domínio.

### Dashboard

- Métricas de volume, SLA, tempo de primeira resposta, conversas abertas, taxa de falha, mensagens por provider e qualidade do número.

### Campanhas

- Envio em massa deve usar fila própria, rate limits agressivos e templates aprovados.
- Campanhas não devem bypassar permissões, opt-out ou limites do provider.
- A criação de `CampaignMessage` deve preceder a criação de `Message`, permitindo cancelar, pular ou auditar disparos antes de consumir limites do provider.
- A associação deve seguir o encadeamento `Campaign -> CampaignMessage -> Message`, evitando ligação direta entre `Campaign` e `Message` e preservando metadados próprios de disparo, segmentação, tentativa, lote e auditoria em `CampaignMessage`.

### IA

- Consumo de eventos de mensagens para sumarização, sentimento, intenção, sugestão de resposta e transcrição.
- IA deve operar de forma assíncrona e auditável.
- Respostas sugeridas por IA devem exigir confirmação humana quando política definir.

## 45. Pontos de escalabilidade

- Processamento assíncrono por BullMQ e Redis.
- Particionamento de tabelas de alto volume.
- Workers horizontalmente escaláveis por fila, tenant e provider.
- Webhooks rápidos com persistência imediata e processamento posterior.
- Object storage para mídia.
- Cache de leitura para inbox e templates.
- WebSockets com Redis adapter para múltiplas instâncias.
- Provider registry para adicionar novos adapters sem alterar casos de uso.
- Storage provider registry para trocar S3, R2, GCS, Azure Blob ou storage local sem alterar domínio.
- Feature flags tenant-scoped para ativar gradualmente providers, IA, transcrição, campanhas e WebSockets por organização.
- Idempotência em todos os fluxos externos.

## 46. Riscos arquiteturais

- Acoplamento acidental à Meta se payloads provider-specific vazarem para domínio.
- Crescimento explosivo de `Message`, `WebhookEvent` e `MessageStatus` sem particionamento e retenção.
- Falhas de deduplicação causarem mensagens duplicadas ou status inconsistentes.
- Rate limit incorreto gerar bloqueio de número ou queda de qualidade.
- Webhook lento causar timeout no provider.
- Credenciais expostas em logs ou payloads.
- Permissões por inbox mal aplicadas vazarem conversas entre times.
- IA gerar respostas inadequadas sem revisão humana.

## 47. Melhorias futuras

- SLA avançado por inbox e prioridade.
- Roteamento por skills, carga, idioma e horário.
- Opt-in e opt-out centralizados.
- Campanhas omnichannel.
- Busca semântica em conversas.
- Copilot de atendimento com RAG sobre histórico do Lead.
- Arquivamento frio de mensagens antigas.
- Analytics preditivo de conversão por canal.
- Suporte a novos providers via plugins.
- Merge e Split de Conversas, preservando histórico por eventos e mantendo rastreabilidade de mensagens movidas, conversas origem e conversas destino.
- Webhooks internos para automações low-code.
- Detecção automática de intenção e criação de tarefas.
