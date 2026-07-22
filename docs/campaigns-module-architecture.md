# Campanhas - Design Técnico Enterprise

> Documento arquitetural para revisão. Não contém código executável, schema Prisma, migrations, DTOs, controllers ou services implementáveis.

## 1. Objetivos do módulo

- Criar um módulo de Campanhas enterprise, multi-tenant e escalável para disparos WhatsApp em massa.
- Suportar milhares ou milhões de destinatários por organização sem bloquear APIs transacionais.
- Integrar corretamente com Organizations, Users, Leads, Pipeline, WhatsApp, Templates, Dashboard, Timeline, IA e Relatórios.
- Manter o fluxo obrigatório `Campaign -> CampaignMessage -> Message`, sem relacionamento direto entre `Campaign` e `Message`.
- Garantir opt-in, opt-out, suppression list, limites da Meta, limites do provider, limites por conexão, limites por número e idempotência antes de qualquer envio.
- Separar domínio de payloads específicos da Meta e delegar envio ao módulo WhatsApp por portas de integração.
- Preparar persistência e filas para alto volume, execução assíncrona, pausa, retomada, cancelamento seguro e métricas incrementais.

## 2. Responsabilidades

O módulo Campanhas é responsável por:

- Modelar campanhas, audiências, segmentos, imports, agendamentos, aprovações, lotes, mensagens planejadas, links, cliques, conversões, falhas, métricas e auditoria.
- Criar snapshot de audiência no momento apropriado para garantir reprodutibilidade da execução.
- Orquestrar preparação, batching, dispatch, retries, finalização e cálculo incremental de métricas.
- Validar elegibilidade de destinatários: tenant, opt-in, opt-out, suppression, telefone válido, WhatsApp disponível, janela de 24 horas e template obrigatório fora da janela.
- Resolver variáveis de templates sem acoplar o domínio a payloads da Meta.
- Publicar eventos de domínio para Dashboard, Timeline, Relatórios, IA, Leads e Pipeline.
- Consultar o módulo WhatsApp para enviar mensagens, verificar `ConversationOptOut`, obter conversas, criar `Message` por porta e processar status por webhook.

O módulo não é responsável por:

- Enviar mensagens diretamente para Meta ou qualquer provider.
- Armazenar credenciais do provider.
- Implementar payloads específicos da Meta no domínio.
- Recalcular métricas agregadas integralmente em toda consulta.
- Ignorar controles de rate limit, opt-out ou políticas do WhatsApp.
- Substituir o módulo Templates como fonte de aprovação e estrutura do template.

## 3. Escopo inicial

- Campanhas WhatsApp baseadas em templates aprovados.
- Criação manual de campanha, seleção de audiência por leads, filtros ou importação CSV/planilha.
- Envio de teste, aprovação, agendamento, preparação de lotes, execução assíncrona e retry controlado.
- Métricas incrementais, tracking de links, conversões básicas, exportação e auditoria.
- Múltiplos números remetentes por organização, com seleção fixa ou política de rotação configurável.
- WebSocket ou SSE para progresso em tempo real.

## 4. Fora do escopo inicial

- Editor visual avançado de jornadas omnichannel.
- A/B testing automático.
- Otimização preditiva por IA para horário, conteúdo ou número remetente.
- Envio para canais diferentes de WhatsApp.
- Cobrança financeira definitiva; apenas estimativas e custo real quando o provider informar dados.
- Segmentação em tempo real durante a execução; a campanha usa snapshot.
- Implementação executável de Prisma, migrations, DTOs, controllers ou services.

## 5. Arquitetura geral

A arquitetura segue NestJS, Prisma, PostgreSQL, Redis, BullMQ, SOLID, Clean Architecture, DDD, Repository Pattern, arquitetura orientada a eventos e processamento assíncrono.

Camadas recomendadas:

1. **Domain**: entidades, value objects, enums, eventos, invariantes, domain services e portas de repositories.
2. **Application**: casos de uso, políticas de autorização, transações, orquestração, locks, enfileiramento, idempotência e publicação de eventos.
3. **Infrastructure**: Prisma repositories, BullMQ processors, Redis locks/cache/rate limit, adapters para WhatsApp, Templates, Leads, Pipeline, Dashboard, Timeline, Relatórios e IA.
4. **Interface**: controllers REST conceituais, presenters, guards, WebSocket/SSE gateway e endpoints de exportação.

## 6. Diagrama textual dos componentes

```text
[REST Controllers / SSE Gateway / WebSocket Gateway]
                   |
                   v
          [Application Use Cases]
       /       |        |          \
      v        v        v           v
[Domain] [Repository Ports] [Integration Ports] [Event Bus]
      |        |              |             |
      v        v              v             v
[Rules] [Prisma/PostgreSQL] [WhatsApp/Templates/Leads] [BullMQ]
                         |                  |
                         v                  v
                    [Redis Cache]      [Workers]
                                            |
                                            v
                    [Dashboard / Timeline / Reports / IA]
```

## 7. Entidades principais e campos conceituais

### 7.1 Campaign

Representa a campanha como agregado raiz operacional.

Campos conceituais:

- `id`, `organizationId`, `name`, `description`, `channel`, `status`, `type`.
- `objective`, `timezone`, `priority`, `tags`, `metadata`.
- `createdByUserId`, `updatedByUserId`, `approvedByUserId`.
- `scheduledAt`, `startedAt`, `pausedAt`, `completedAt`, `canceledAt`, `archivedAt`.
- `version`, `idempotencyKey`, `createdAt`, `updatedAt`, `deletedAt`.

Regra: `Campaign` nunca aponta diretamente para `Message`.

### 7.2 CampaignMessage

Representa uma mensagem planejada ou executada para um destinatário específico.

Campos conceituais:

- `id`, `organizationId`, `campaignId`, `audienceMemberId`, `batchId`.
- `leadId`, `conversationId`, `messageId` opcional, `phoneE164`, `recipientName`.
- `status`, `attemptCount`, `maxAttempts`, `nextRetryAt`, `lastAttemptAt`.
- `templateId`, `campaignTemplateId`, `resolvedVariables`, `renderedPreview`.
- `senderPhoneNumberId`, `whatsappConnectionId`, `provider`.
- `deduplicationKey`, `idempotencyKey`, `errorCode`, `errorMessage`, `failureCategory`.
- `queuedAt`, `sendingAt`, `sentAt`, `deliveredAt`, `readAt`, `failedAt`, `canceledAt`, `skippedAt`.
- `costEstimated`, `costActual`, `createdAt`, `updatedAt`.

Regra: `CampaignMessage` deve existir antes de `Message`. Quando o WhatsApp cria a `Message`, o `messageId` volta para `CampaignMessage`.

### 7.3 CampaignAudience

Define a origem e configuração da audiência.

Campos: `id`, `organizationId`, `campaignId`, `sourceType`, `name`, `criteria`, `snapshotStatus`, `totalEstimated`, `totalSnapshotted`, `createdAt`, `updatedAt`.

### 7.4 CampaignAudienceMember

Snapshot normalizado de cada destinatário elegível ou rejeitado.

Campos: `id`, `organizationId`, `campaignId`, `audienceId`, `leadId`, `importRowId`, `phoneE164`, `normalizedPhoneHash`, `name`, `email`, `source`, `eligibilityStatus`, `exclusionReason`, `deduplicationKey`, `variablesSnapshot`, `leadSnapshot`, `createdAt`, `updatedAt`.

### 7.5 CampaignSegment

Filtro reutilizável ou inline para leads.

Campos: `id`, `organizationId`, `name`, `description`, `filterDefinition`, `isReusable`, `createdByUserId`, `createdAt`, `updatedAt`.

### 7.6 CampaignBatch

Unidade operacional de dispatch.

Campos: `id`, `organizationId`, `campaignId`, `sequence`, `status`, `messageCount`, `queuedCount`, `sentCount`, `failedCount`, `startedAt`, `completedAt`, `lockedAt`, `lockOwner`, `rateLimitGroup`, `createdAt`, `updatedAt`.

### 7.7 CampaignSchedule

Configuração de agendamento e janelas permitidas.

Campos: `id`, `organizationId`, `campaignId`, `scheduledAt`, `timezone`, `allowedWeekdays`, `allowedTimeWindows`, `throttlePerMinute`, `status`, `createdByUserId`, `createdAt`, `updatedAt`.

### 7.8 CampaignTemplate

Associação entre campanha e template aprovado.

Campos: `id`, `organizationId`, `campaignId`, `templateId`, `templateName`, `language`, `versionSnapshot`, `componentsSnapshot`, `category`, `statusAtSelection`, `createdAt`.

### 7.9 CampaignVariable

Mapeamento de variáveis do template para fontes de dados.

Campos: `id`, `organizationId`, `campaignId`, `campaignTemplateId`, `key`, `position`, `required`, `sourceType`, `sourcePath`, `fallbackValue`, `defaultValue`, `validationRule`, `createdAt`, `updatedAt`.

### 7.10 CampaignLink

Link rastreável usado na campanha.

Campos: `id`, `organizationId`, `campaignId`, `originalUrl`, `shortCode`, `utmSource`, `utmMedium`, `utmCampaign`, `isActive`, `createdAt`, `updatedAt`.

### 7.11 CampaignClick

Evento de clique deduplicável.

Campos: `id`, `organizationId`, `campaignId`, `campaignMessageId`, `campaignLinkId`, `leadId`, `phoneE164`, `ipHash`, `userAgentHash`, `fingerprint`, `clickedAt`, `isUnique`, `metadata`.

### 7.12 CampaignConversion

Conversão atribuída à campanha.

Campos: `id`, `organizationId`, `campaignId`, `campaignMessageId`, `leadId`, `pipelineDealId`, `type`, `value`, `currency`, `occurredAt`, `attributionModel`, `metadata`.

### 7.13 CampaignFailure

Registro detalhado de falhas.

Campos: `id`, `organizationId`, `campaignId`, `campaignMessageId`, `batchId`, `errorCode`, `errorMessage`, `category`, `isRetryable`, `providerReason`, `occurredAt`, `rawContextRef`.

### 7.14 CampaignMetric

Agregado incremental por campanha e janela temporal.

Campos: `id`, `organizationId`, `campaignId`, `bucketType`, `bucketStart`, `audienceTotal`, `planned`, `queued`, `sent`, `delivered`, `read`, `failed`, `canceled`, `skipped`, `optOuts`, `replies`, `clicks`, `uniqueClicks`, `conversions`, `estimatedCost`, `actualCost`, `updatedAt`.

### 7.15 CampaignApproval

Workflow de aprovação.

Campos: `id`, `organizationId`, `campaignId`, `status`, `requestedByUserId`, `reviewedByUserId`, `requestedAt`, `reviewedAt`, `comment`, `riskSnapshot`.

### 7.16 CampaignTestSend

Envio de teste antes da aprovação ou agendamento.

Campos: `id`, `organizationId`, `campaignId`, `requestedByUserId`, `recipientPhoneE164`, `senderPhoneNumberId`, `status`, `messageId`, `resolvedVariables`, `errorMessage`, `sentAt`, `createdAt`.

### 7.17 CampaignImport

Importação de CSV/planilha.

Campos: `id`, `organizationId`, `campaignId`, `uploadedByUserId`, `fileName`, `storageKey`, `status`, `totalRows`, `validRows`, `invalidRows`, `duplicateRows`, `processedRows`, `mapping`, `errorSummary`, `createdAt`, `completedAt`.

### 7.18 CampaignSuppression

Bloqueio específico de campanhas.

Campos: `id`, `organizationId`, `phoneE164`, `leadId`, `reason`, `source`, `scope`, `expiresAt`, `createdByUserId`, `createdAt`.

### 7.19 CampaignAuditLog

Trilha de auditoria.

Campos: `id`, `organizationId`, `campaignId`, `actorUserId`, `action`, `before`, `after`, `ipHash`, `userAgentHash`, `occurredAt`.

## 8. Relacionamentos

- `Organization 1:N Campaign`.
- `User 1:N Campaign` como criador, editor, aprovador ou executor.
- `Campaign 1:N CampaignAudience`.
- `CampaignAudience 1:N CampaignAudienceMember`.
- `Campaign 1:N CampaignMessage`.
- `CampaignAudienceMember 1:0..1 CampaignMessage` por campanha e telefone elegível.
- `Campaign 1:N CampaignBatch`.
- `CampaignBatch 1:N CampaignMessage`.
- `Campaign 1:0..1 CampaignSchedule`.
- `Campaign 1:N CampaignTemplate`.
- `CampaignTemplate 1:N CampaignVariable`.
- `Campaign 1:N CampaignLink`.
- `CampaignLink 1:N CampaignClick`.
- `CampaignMessage 1:N CampaignClick`.
- `CampaignMessage 1:0..1 Message`, mas `Campaign` não se relaciona diretamente com `Message`.
- `CampaignMessage N:1 Lead` opcional.
- `CampaignMessage N:1 Conversation` opcional.
- `CampaignConversion N:1 CampaignMessage` opcional, `N:1 Lead` opcional e `N:1 PipelineDeal` opcional.
- `Campaign 1:N CampaignFailure`, `CampaignApproval`, `CampaignTestSend`, `CampaignImport`, `CampaignAuditLog` e `CampaignMetric`.
- `ConversationOptOut` do WhatsApp é consultado por `organizationId` e `phoneE164` antes de criar jobs de envio.

## 9. Ciclo de vida e estados

Estados principais:

- `DRAFT`: campanha editável.
- `PENDING_APPROVAL`: aguardando aprovação.
- `APPROVED`: aprovada, ainda não agendada/iniciada.
- `SCHEDULED`: possui execução futura.
- `PREPARING`: criando snapshot, validando variáveis, gerando mensagens e lotes.
- `RUNNING`: dispatch ativo.
- `PAUSED`: execução suspensa com segurança.
- `COMPLETED`: todos os itens terminaram em estado final.
- `CANCELED`: cancelada antes ou durante execução.
- `FAILED`: erro sistêmico não recuperável.
- `ARCHIVED`: removida da operação diária sem apagar histórico.

Transições permitidas devem ser explícitas e auditadas. Jobs sempre recarregam o estado atual no banco antes de agir.

## 10. Fluxo de criação da campanha

1. Usuário cria campanha em `DRAFT` com `organizationId` obrigatório.
2. Seleciona canal WhatsApp, objetivo, nome, template aprovado e idioma.
3. Define variáveis, audiência, remetente ou política de seleção, agendamento opcional e links rastreáveis.
4. Sistema valida permissões, feature flags, quotas, template, organização e consistência mínima.
5. Cada alteração relevante gera `CampaignAuditLog`.

## 11. Fluxo de seleção da audiência

- Audiência pode vir de Leads filtrados, segmento salvo, lista importada ou combinação controlada.
- A seleção em modo edição produz estimativa, não snapshot definitivo.
- O snapshot definitivo é criado em `PREPARING`, respeitando opt-out, suppression, quotas, deduplicação e normalização.

## 12. Segmentação por filtros de Leads

Filtros conceituais:

- Campos do Lead: status, origem, responsável, tags, cidade, UF, país, data de criação, última interação.
- Pipeline: estágio, valor, probabilidade, data de movimentação.
- Engajamento: respondeu WhatsApp, clicou campanha anterior, opt-out ausente.
- Critérios customizados permitidos pelo módulo Leads.

O filtro deve ser serializado em `CampaignSegment.filterDefinition` de forma provider-agnostic e traduzido pelo `LeadsIntegrationPort`.

## 13. Snapshot da audiência

- Ao entrar em `PREPARING`, criar `CampaignAudienceMember` com dados normalizados e snapshots mínimos.
- Snapshot deve ser imutável para a execução corrente, exceto campos técnicos de elegibilidade.
- Mudanças posteriores no Lead não alteram destinatários já planejados.
- Se a campanha for duplicada ou reexecutada, novo snapshot deve ser criado.

## 14. Importação CSV ou planilha

1. Upload gera `CampaignImport` com arquivo em storage.
2. Job `campaign-import` lê em streaming, detecta encoding e separador.
3. Usuário mapeia colunas para nome, telefone, email e variáveis.
4. Sistema valida linhas, normaliza telefones, deduplica por telefone e reporta erros.
5. Linhas válidas alimentam `CampaignAudienceMember` ou staging interno do import.
6. Importações grandes devem ser chunked e idempotentes por hash de arquivo, linha e organização.

### 14.1 Importação da lista de corretores para distribuição automática

- A lista de corretores da distribuição automática continua sendo importada por planilha `.xlsx` ou `.csv`, sem alterar a arquitetura existente de Campanhas, Webhooks, Round Robin, Distribuição ou Automações.
- No escopo inicial da distribuição de corretores, somente `Nome` e `Telefone` são campos obrigatórios. O import deve aceitar planilhas simples com cabeçalhos equivalentes a esses campos e rejeitar linhas sem nome ou telefone utilizável.
- O telefone importado deve ser normalizado automaticamente pelo Impulse, seguindo a estratégia geral de normalização de telefones deste documento. O usuário não deve informar nem importar links do WhatsApp.
- O link `https://wa.me/55XXXXXXXXXXX` é sempre derivado em tempo de uso a partir do telefone normalizado; não deve ser armazenado como campo persistente da lista.
- A estrutura deve permanecer extensível para campos opcionais futuros como `Foto`, `Gerente`, `Equipe`, `Cargo` e `Observações`, mantendo esses dados como metadados ou colunas mapeáveis sem tornar nenhum deles obrigatório no fluxo inicial.
- A validação do import deve preservar idempotência, deduplicação por telefone normalizado e isolamento por `organizationId`, sem criar dependência direta entre a lista importada e payloads específicos da Meta.

### 14.2 Limpeza automática da base importada para campanhas

- Antes de criar a audiência definitiva e antes de qualquer envio, toda importação de clientes para campanha deve executar limpeza automática após a normalização dos telefones.
- A deduplicação deve usar como chave principal `organizationId + campaignId + phoneE164`, garantindo que cada telefone normalizado gere no máximo um `CampaignAudienceMember` ou destinatário equivalente dentro da mesma campanha.
- Formatos diferentes do mesmo número, como `(11) 99999-9999`, `11 99999-9999`, `+55 11 99999-9999` e `5511999999999`, devem convergir para a mesma chave depois da normalização.
- A limpeza deve bloquear duplicidade entre linhas, páginas, chunks, lotes, reprocessamentos do mesmo import e jobs paralelos, preservando idempotência por hash de arquivo, linha, organização, campanha e telefone normalizado.
- Quando houver duplicidade, manter apenas o primeiro registro válido encontrado. Se o primeiro registro estiver sem nome e um duplicado posterior trouxer nome válido, pode existir política explícita de enriquecimento, desde que o telefone permaneça único, nenhum segundo destinatário seja criado e a decisão apareça no relatório do import.
- A limpeza atua apenas na audiência/importação da campanha e não deve apagar, mesclar ou modificar Leads globais do CRM fora das políticas próprias do módulo Leads.
- A constraint lógica e, quando aplicável, persistente deve impedir envio de duas ou mais mensagens ao mesmo cliente dentro da mesma campanha, mantendo compatibilidade com `CampaignImport`, `CampaignAudienceMember` e `CampaignRecipient`.

### 14.3 Relatório de limpeza da base

- Ao finalizar a importação, o sistema deve apresentar uma mensagem clara com total de linhas recebidas, números duplicados retirados, números inválidos retirados e números aptos para envio.
- A mensagem resumida obrigatória deve ser `Base limpa: {{duplicateCount}} números duplicados foram retirados.` quando houver duplicados, ou `Base limpa: nenhum número duplicado foi encontrado.` quando não houver duplicados.
- A interface deve exibir pelo menos `totalRows`, `validPhones`, `invalidPhones`, `duplicatePhonesRemoved` e `finalEligibleRecipients`, derivados do processamento normalizado da importação.
- Opcionalmente, o sistema pode disponibilizar arquivo de relatório contendo número original, telefone normalizado, número da linha, motivo da exclusão e tipo do erro.
- Os tipos de erro previstos para linhas removidas são `DUPLICATE_PHONE`, `INVALID_PHONE`, `MISSING_PHONE` e `MISSING_REQUIRED_FIELD`.
- Esses contadores devem ser registrados em `CampaignImport.errorSummary`, métricas ou metadados equivalentes, preservando auditoria, multi-tenancy, processamento em filas, chunks e reprocessamento idempotente.

## 15. Validação, normalização e deduplicação de telefones

- Converter para E.164 usando país padrão da organização quando necessário.
- Remover caracteres não numéricos antes da normalização.
- Rejeitar números impossíveis, curtos, longos ou sem DDI resolvível.
- Persistir telefone normalizado e hash para busca/deduplicação.
- Deduplicar por `organizationId + campaignId + phoneE164`.
- Em conflito entre múltiplos Leads com mesmo telefone, aplicar política explícita: lead principal, lead mais recente ou rejeitar ambíguo.

## 16. Envio de teste

- Permitido em `DRAFT`, `PENDING_APPROVAL` e `APPROVED` conforme permissão.
- Usa template e variáveis resolvidas com valores de exemplo ou Lead selecionado.
- Deve verificar opt-out do destinatário de teste, limites básicos e remetente válido.
- Deve usar `WhatsAppOutboundPort`, criando registro `CampaignTestSend` e `Message` via WhatsApp; não cria `CampaignMessage` de produção.

## 17. Aprovação

- Campanhas de alto volume, alto custo ou templates sensíveis entram em `PENDING_APPROVAL`.
- A aprovação valida audiência estimada, custo estimado, template, variáveis obrigatórias, suppression e riscos.
- Apenas usuários com permissão `aprovar campanhas` podem aprovar.
- Aprovação gera `CampaignApproval` e `CampaignAuditLog`.

## 18. Agendamento

- `CampaignSchedule` define horário, timezone, janelas de envio, throttle e dias permitidos.
- Scheduler enfileira `campaign-prepare` no momento correto.
- Antes de executar, job valida estado atual, aprovação, quotas e locks.

## 19. Preparação dos lotes

1. Lock distribuído por `campaignId`.
2. Estado muda para `PREPARING`.
3. Cria snapshot de audiência.
4. Resolve elegibilidade e variáveis obrigatórias.
5. Cria `CampaignMessage` para destinatários elegíveis antes de qualquer `Message`.
6. Agrupa em `CampaignBatch` por tamanho, remetente, rate limit group e prioridade.
7. Enfileira `campaign-dispatch`.

## 20. Execução completa

- `campaign-dispatch` escolhe batches pendentes, respeita rate limits e estado.
- `campaign-send-message` carrega `CampaignMessage` atual, valida opt-out novamente, janela de 24h, template e limites.
- Usa `WhatsAppOutboundPort.sendCampaignTemplateMessage` ou contrato equivalente.
- O módulo WhatsApp cria `Conversation`/`Message` conforme necessário e retorna `messageId`.
- `CampaignMessage.messageId` é atualizado idempotentemente.
- Webhooks de status atualizam `Message` no WhatsApp e publicam evento para atualizar `CampaignMessage`.

## 21. Pausa, retomada e cancelamento

### Pausa

- Usuário com permissão pausa campanha `RUNNING`.
- Estado vira `PAUSED`; workers param de criar novos envios ao recarregar estado.
- Jobs já em execução podem finalizar a mensagem atual, mas não devem buscar nova unidade.

### Retomada

- Estado volta para `RUNNING` após validar quotas, schedule e locks.
- Apenas `CampaignMessage` em `QUEUED`, `RATE_LIMITED` ou retry elegível retorna ao fluxo.

### Cancelamento

- Estado vira `CANCELED`.
- Mensagens não enviadas viram `CANCELED` ou `SKIPPED` conforme razão.
- Jobs pendentes devem observar estado e sair sem enviar.
- Mensagens já entregues permanecem históricas.

## 22. Retry de falhas

- Somente falhas `retryable` entram em `campaign-retry`.
- Usar backoff exponencial com jitter: `baseDelay * 2^attempt + random(0, jitterMax)`.
- Respeitar `maxAttempts`, estado da campanha, opt-out atual, rate limits e janela/template.
- Falha final gera `CampaignFailure` e métrica incremental.

## 23. Estratégia para CampaignBatch

- Batch é unidade de controle operacional, não unidade de negócio.
- Tamanho ajustável por plano, provider, número e template.
- Deve permitir sharding por `organizationId`, `campaignId`, `senderPhoneNumberId` e `rateLimitGroup`.
- Batches facilitam retomada, progresso, locks, backpressure e concorrência.

## 24. Estratégia para CampaignMessage

- Fonte de verdade da intenção de envio por destinatário.
- Possui status próprio independente do `Message` do WhatsApp, mas sincronizado por eventos.
- Deve ter chaves únicas para impedir duplicidade: `organizationId + campaignId + phoneE164` e/ou `deduplicationKey`.
- Deve ser criado antes do envio e antes da `Message`.

## 25. Integração com Message do WhatsApp

- Campanhas usa uma porta, por exemplo `WhatsAppCampaignPort`.
- Entrada provider-agnostic: `organizationId`, `campaignMessageId`, `conversationId?`, `leadId?`, `phoneE164`, `senderPhoneNumberId`, `templateRef`, `variables`, `idempotencyKey`.
- Saída: `messageId`, `conversationId`, `providerMessageId?`, status inicial.
- O WhatsApp persiste `Message`; Campanhas persiste apenas `CampaignMessage.messageId`.
- Nenhuma tabela ou caso de uso deve consultar `Campaign.messageId`, pois esse campo não existe.

## 26. Templates aprovados pela Meta

- O módulo Templates/WhatsApp é fonte da aprovação.
- Campanhas armazena snapshot em `CampaignTemplate` para auditoria e reprodutibilidade.
- No momento do envio, adapter valida se template ainda pode ser usado quando a regra exigir status atual.
- Payload Meta é construído apenas pelo adapter WhatsApp.

## 27. Variáveis de template

- `CampaignVariable` mapeia cada variável para Lead, audiência importada, organização, usuário, valor fixo ou fallback.
- Resolver variáveis durante `PREPARING` e salvar snapshot por `CampaignMessage`.
- Variáveis sensíveis devem ser mascaradas em logs.
- Valores finais devem respeitar tamanho, tipo, obrigatoriedade e escaping.

## 28. Validação de variáveis obrigatórias

- Antes de aprovar: validar configuração do mapeamento.
- Antes de preparar: validar cada destinatário.
- Antes de enviar: revalidar integridade mínima do snapshot.
- Ausência de variável obrigatória gera `SKIPPED` e `CampaignFailure` não retryable.

## 29. Múltiplos números de WhatsApp

- Cada campanha pode fixar um número ou usar política de seleção.
- Números elegíveis devem pertencer à organização, estar ativos, ter conexão saudável, suportar template/idioma e ter limite disponível.
- Qualidade baixa ou bloqueio do provider remove número do pool automaticamente.

## 30. Escolha e rotação do remetente

Políticas possíveis:

- `FIXED`: sempre o número configurado.
- `ROUND_ROBIN`: distribuição simples entre números elegíveis.
- `WEIGHTED`: pesos por qualidade, capacidade ou custo.
- `STICKY_BY_LEAD`: mesmo Lead tende a receber pelo mesmo número.

Rotação só deve ocorrer se permitida pelas regras de negócio, compliance e políticas do WhatsApp. A política deve ser registrada no audit log e refletida em `CampaignMessage.senderPhoneNumberId`.

## 31. Rate limits

Aplicar limites hierárquicos em Redis com fallback persistente:

- Organização: quota total e throughput por plano.
- Campanha: throttle configurado e segurança operacional.
- Conexão: capacidade técnica do provider.
- Número: limites da Meta, qualidade e tier.
- Provider: limites globais e janelas de erro.
- Template: proteção contra abuso e limites específicos.

Se qualquer limite bloquear, `CampaignMessage` fica `RATE_LIMITED` com `nextRetryAt`.

## 32. Filas BullMQ

Filas sugeridas:

- `campaign-prepare`: transição para preparação.
- `campaign-create-audience`: criação de snapshot.
- `campaign-create-batches`: criação de `CampaignBatch` e `CampaignMessage`.
- `campaign-dispatch`: seleção de batches e enfileiramento granular.
- `campaign-send-message`: envio de uma `CampaignMessage`.
- `campaign-retry`: retries.
- `campaign-calculate-metrics`: agregações incrementais e reconciliações.
- `campaign-complete`: fechamento seguro.
- `campaign-import`: parsing e validação de imports.

Jobs devem carregar dados atuais do banco por IDs pequenos, nunca depender de payloads grandes ou antigos.

## 33. Concorrência, backpressure, DLQ e idempotência

- Concorrência por fila configurável por ambiente e plano.
- Workers devem particionar trabalho por `organizationId` e rate limit group.
- Backpressure: pausar dispatch quando Redis, banco, provider ou fila excederem thresholds.
- Dead-letter queue para falhas não recuperáveis ou retries esgotados, com ferramenta de replay controlado.
- Idempotência por `idempotencyKey`, `deduplicationKey`, locks por `campaignMessageId` e constraints únicas.
- Nunca enviar se já existir `messageId` ou status final incompatível.

## 34. Prevenção de duplicidades e repetição indevida

- Constraint única por `organizationId + campaignId + phoneE164` para campanha.
- Suppression por telefone, lead ou escopo global/campanha.
- Política cross-campaign opcional: impedir mesmo telefone de receber o mesmo template em uma janela temporal.
- Deduplicação em import, segmentação e criação de `CampaignMessage`.
- Idempotência no adapter WhatsApp usando `campaignMessageId`.

## 35. Opt-in, opt-out e suppression

- Opt-in deve ser registrado no Lead ou fonte importada quando política exigir.
- Antes de qualquer envio, consultar `ConversationOptOut` do WhatsApp por `organizationId + phoneE164`.
- Opt-out recebido por resposta ou webhook cria/atualiza `ConversationOptOut` e pode criar `CampaignSuppression`.
- Suppression list cobre bloqueios manuais, legais, inválidos, reclamações e expiração opcional.
- Opt-out tem precedência sobre qualquer campanha, mesmo que o destinatário esteja no snapshot.

## 36. Contatos inválidos, sem WhatsApp e janela de 24 horas

- Telefones inválidos viram `INVALID_NUMBER` e não geram envio.
- Números sem WhatsApp viram falha não retryable ou suppression temporária conforme retorno do provider.
- Dentro da janela de 24 horas, regras podem permitir mensagens de atendimento quando aplicável.
- Fora da janela, o uso de template aprovado é obrigatório.
- Campanhas promocionais devem preferir templates aprovados mesmo dentro da janela, salvo regra explícita.

## 37. Status de CampaignMessage

Estados recomendados:

- `QUEUED`, `SENDING`, `SENT`, `DELIVERED`, `READ`, `FAILED`, `CANCELED`, `SKIPPED`, `OPTED_OUT`, `INVALID_NUMBER`, `RATE_LIMITED`.

Status finais: `READ`, `FAILED`, `CANCELED`, `SKIPPED`, `OPTED_OUT`, `INVALID_NUMBER` quando não houver retry pendente. `DELIVERED` pode ser final para provedores sem read receipts.

## 38. Webhooks de status

- Webhook entra no módulo WhatsApp e atualiza `Message`/`MessageStatus`.
- WhatsApp publica evento `MessageStatusUpdated` com `organizationId`, `messageId`, status e timestamp.
- Campanhas localiza `CampaignMessage` por `messageId` ou idempotency metadata.
- Atualização deve ser monotônica, idempotente e tolerante a eventos fora de ordem.

## 39. Métricas em tempo real

Métricas obrigatórias:

- audiência total, mensagens planejadas, enfileiradas, enviadas, entregues, lidas, falhas, canceladas, ignoradas, opt-outs, respostas recebidas, cliques, conversões, custo estimado, custo real, taxa de entrega, taxa de leitura, taxa de resposta, taxa de clique e taxa de conversão.

Estratégia:

- Atualizar contadores incrementalmente por eventos.
- Persistir `CampaignMetric` por campanha e buckets temporais.
- Cache Redis para leitura rápida do dashboard.
- Reconciliação periódica por janela pequena, não full scan a cada consulta.

## 40. Tracking de links, cliques e fraude

- Substituir URLs por links curtos com `shortCode` único.
- URL curta deve conter identificador de link e token opaco de `CampaignMessage`.
- Registrar clique com timestamp, IP hash, user-agent hash e fingerprint.
- Deduplicar clique único por `campaignMessageId + campaignLinkId` em janela configurável.
- Proteger contra bots: detectar prefetch, user-agents suspeitos, cliques múltiplos instantâneos e IPs anômalos.
- Redirecionamento deve ser rápido e resiliente, usando cache Redis para lookup.

## 41. Conversões e respostas

- Conversões podem vir de eventos do Pipeline, formulários, webhooks externos ou regras internas.
- Atribuir por `campaignMessageId`, `leadId`, link token, phoneE164 e janela de atribuição.
- Respostas inbound do WhatsApp devem ser associadas à campanha correta pela conversa, telefone, última `CampaignMessage` enviada, janela temporal e `messageId` quando houver reply context.
- Resposta deve incrementar métrica, publicar evento de Timeline e opcionalmente atualizar Lead/Pipeline.

### 41.1 Resposta a botão de template e distribuição de corretores

- Quando o webhook da Meta indicar resposta do cliente a um botão configurado no template da campanha, o fluxo atual de inbound deve identificar a campanha pelo vínculo da conversa, telefone, última `CampaignMessage`, payload interativo e janela temporal já usada para atribuição de respostas.
- O payload interativo deve preservar o identificador e o texto do botão clicado em metadados normalizados, permitindo que a regra de distribuição valide se aquele botão está configurado para acionar a distribuição automática.
- Após identificar campanha e botão, o módulo deve executar o Round Robin existente sem alterar sua estratégia, ponteiros, critérios de elegibilidade ou integrações de Distribuição e Automações.
- O próximo corretor selecionado deve vir da lista importada e normalizada com `Nome` e `Telefone`; campos opcionais futuros não devem ser exigidos para envio.
- A resposta automática deve ser enfileirada pelo contrato outbound do WhatsApp em duas mensagens: primeiro um texto transacional informando `brokerName`, depois uma mensagem de contato compartilhado com o vCard/contact message do corretor.
- Uma terceira mensagem com o link `wa.me` pode ser enviada apenas quando a configuração da campanha ou automação exigir; esse link deve ser gerado em tempo de envio a partir do telefone normalizado, nunca lido de campo importado.
- A campanha ou automação pode configurar opcionalmente a `Mensagem inicial para o corretor`, persistindo somente o texto configurado e resolvendo variáveis permitidas como `{{leadName}}`, `{{brokerName}}`, `{{campaignName}}` e `{{distributionCode}}` no momento de gerar o link opcional.
- Quando a mensagem inicial estiver configurada, o link opcional deve seguir o formato `https://wa.me/55XXXXXXXXXXX?text=MENSAGEM_CODIFICADA`, com texto codificado corretamente para URL; quando não estiver configurada, o link continua podendo ser gerado sem parâmetro `text`.
- A mensagem inicial pré-preenchida complementa o link opcional e não substitui o envio obrigatório do contato compartilhado `CONTACTS`/vCard.
- Todas as mensagens geradas por esse fluxo devem manter idempotência por webhook, campanha, destinatário, botão e corretor selecionado, evitando múltiplos compartilhamentos quando a Meta reenviar o mesmo evento.
- Eventos e métricas devem ser publicados pelos canais atuais de Campanhas, WhatsApp, Timeline e Dashboard, sem criar relacionamento direto `Campaign -> Message` e sem refatorar `CampaignRecipient`, Webhook, Distribuição ou Automações.

## 42. Associação Lead, Conversation, Message e CampaignMessage

- `CampaignAudienceMember` carrega `leadId` quando conhecido.
- Durante envio, WhatsApp resolve ou cria `Conversation` por organização, número remetente e telefone externo.
- `Message` aponta para `Conversation` e Lead quando aplicável.
- `CampaignMessage` aponta para `Lead`, `Conversation` e `Message` sem criar ligação direta `Campaign -> Message`.

## 43. Criar ou atualizar Lead a partir da campanha

- Imports podem criar Leads apenas se a organização habilitar a feature e o usuário tiver permissão.
- Duplicidade deve ser resolvida por telefone normalizado e regras do módulo Leads.
- Atualizações devem ser parciais, auditadas e não sobrescrever dados confiáveis sem política explícita.

## 44. Atualizar Pipeline, Timeline, Dashboard e Relatórios

- Resposta ou conversão pode criar tarefa, mover deal, atualizar estágio ou registrar atividade conforme regra configurada.
- Timeline recebe eventos: campanha criada, destinatário enfileirado, mensagem enviada, entregue, lida, resposta, clique, conversão, opt-out e falha.
- Dashboard consome métricas agregadas e eventos em tempo real.
- Relatórios usam tabelas agregadas e exportações assíncronas.

## 45. Exportação de resultados

- Exportação deve ser assíncrona para grandes volumes.
- Filtros por status, batch, data, lead, telefone, falha, clique e conversão.
- Arquivo gerado em storage com expiração e auditoria.
- Campos sensíveis obedecem permissões e mascaramento.

## 46. Auditoria e permissões

Permissões recomendadas:

- visualizar campanhas, criar campanhas, editar campanhas, aprovar campanhas, agendar campanhas, iniciar campanhas, pausar campanhas, cancelar campanhas, visualizar custos, exportar resultados e gerenciar listas de bloqueio.

Auditar:

- criação, edição, aprovação, agendamento, início, pausa, retomada, cancelamento, import, export, alteração de suppression, mudança de remetente, mudança de template e replay de DLQ.

## 47. Multi-tenant, feature flags, quotas e cache

- Toda consulta e escrita deve filtrar `organizationId`.
- IDs externos nunca bastam sem `organizationId`.
- Feature flags por organização controlam campanhas, imports, tracking, rotação, criação automática de Lead, conversões e IA.
- Quotas por plano: destinatários por campanha, campanhas simultâneas, mensagens por mês, throughput, imports, exportações e retenção.
- Redis para cache de métricas, locks, rate limit, short links, estado operacional e deduplicação temporária.

## 48. Locks distribuídos e campanhas simultâneas

- Locks por `campaignId` para preparação, finalização e transições críticas.
- Locks por `campaignMessageId` para envio.
- Locks por `organizationId + rateLimitGroup` para throughput.
- Campanhas simultâneas devem compartilhar quotas por organização e provider de forma justa.
- Scheduler deve evitar starvation usando prioridade, idade do job e quotas reservadas.

## 49. Particionamento e índices PostgreSQL

Tabelas de alto volume candidatas a particionamento:

- `CampaignMessage` por `organizationId` hash e/ou `createdAt`/`campaignId` range.
- `CampaignClick` por data.
- `CampaignMetric` por bucket temporal.
- `CampaignAuditLog` por data.
- `CampaignFailure` por data.

Índices recomendados:

- `Campaign(organizationId, status, scheduledAt)`.
- `Campaign(organizationId, createdAt)`.
- `CampaignMessage(organizationId, campaignId, status, nextRetryAt)`.
- `CampaignMessage(organizationId, campaignId, phoneE164)` único quando aplicável.
- `CampaignMessage(organizationId, messageId)`.
- `CampaignMessage(organizationId, batchId, status)`.
- `CampaignAudienceMember(organizationId, campaignId, normalizedPhoneHash)`.
- `CampaignBatch(organizationId, campaignId, status, sequence)`.
- `CampaignMetric(organizationId, campaignId, bucketType, bucketStart)`.
- `CampaignClick(organizationId, campaignId, campaignLinkId, clickedAt)`.
- `CampaignSuppression(organizationId, phoneE164, scope)`.
- `CampaignAuditLog(organizationId, campaignId, occurredAt)`.

## 50. Retenção de dados

- Métricas agregadas: retenção longa conforme plano.
- `CampaignMessage`: retenção detalhada por plano e compliance.
- Webhooks/raw context: retenção curta ou storage frio.
- Cliques e IP/user-agent hash: retenção limitada e minimização de dados.
- Exports: expiração automática.
- Exclusão/anônimização deve preservar agregados quando permitido.

## 51. Eventos de domínio

Eventos sugeridos:

- `CampaignCreated`, `CampaignUpdated`, `CampaignSubmittedForApproval`, `CampaignApproved`, `CampaignRejected`.
- `CampaignScheduled`, `CampaignPreparationStarted`, `CampaignAudienceSnapshotted`, `CampaignBatchesCreated`.
- `CampaignStarted`, `CampaignPaused`, `CampaignResumed`, `CampaignCanceled`, `CampaignCompleted`, `CampaignFailed`.
- `CampaignMessageQueued`, `CampaignMessageSending`, `CampaignMessageSent`, `CampaignMessageDelivered`, `CampaignMessageRead`, `CampaignMessageFailed`, `CampaignMessageSkipped`, `CampaignMessageOptedOut`.
- `CampaignLinkClicked`, `CampaignConversionRecorded`, `CampaignReplyReceived`, `CampaignMetricUpdated`.

## 52. Serviços de domínio

- `CampaignEligibilityService`: opt-in, opt-out, suppression, quotas e elegibilidade.
- `CampaignAudienceSnapshotService`: snapshot e deduplicação.
- `CampaignBatchingService`: criação de lotes.
- `CampaignTemplateVariableService`: resolução e validação de variáveis.
- `CampaignSenderSelectionService`: escolha e rotação de remetentes.
- `CampaignRateLimitService`: limites hierárquicos.
- `CampaignMetricService`: contadores e taxas.
- `CampaignAttributionService`: resposta, clique e conversão.
- `CampaignStateMachine`: transições válidas.

## 53. Casos de uso

- Criar, editar, duplicar, arquivar e listar campanhas.
- Selecionar audiência, estimar audiência e criar snapshot.
- Importar contatos, validar import e confirmar import.
- Enviar teste.
- Solicitar aprovação, aprovar e rejeitar.
- Agendar, iniciar, pausar, retomar, cancelar e completar campanha.
- Preparar lotes, enviar mensagem, processar status, processar retry e DLQ.
- Registrar clique, registrar conversão, associar resposta e exportar resultados.
- Gerenciar suppression list.

## 54. Repository Ports

- `CampaignRepositoryPort`.
- `CampaignAudienceRepositoryPort`.
- `CampaignAudienceMemberRepositoryPort`.
- `CampaignSegmentRepositoryPort`.
- `CampaignBatchRepositoryPort`.
- `CampaignMessageRepositoryPort`.
- `CampaignScheduleRepositoryPort`.
- `CampaignTemplateRepositoryPort`.
- `CampaignLinkRepositoryPort`.
- `CampaignMetricRepositoryPort`.
- `CampaignApprovalRepositoryPort`.
- `CampaignImportRepositoryPort`.
- `CampaignSuppressionRepositoryPort`.
- `CampaignAuditLogRepositoryPort`.

## 55. Integration Ports

- `OrganizationsIntegrationPort`: plano, quotas, timezone, flags e status da organização.
- `UsersIntegrationPort`: permissões, actor e auditoria.
- `LeadsIntegrationPort`: filtros, snapshots, criação/atualização e busca por telefone.
- `PipelineIntegrationPort`: deals, estágios, conversões e automações.
- `WhatsAppCampaignPort`: opt-out, conversas, envio, status, números, conexão e limites.
- `TemplatesIntegrationPort`: templates aprovados, variáveis e idioma.
- `DashboardIntegrationPort`: publicação de métricas.
- `TimelineIntegrationPort`: atividades por Lead/Conversation.
- `AIIntegrationPort`: sugestões futuras e classificação de respostas.
- `ReportsIntegrationPort`: datasets e exports.

## 56. Controllers conceituais e endpoints REST

Controllers conceituais:

- `CampaignsController`, `CampaignAudienceController`, `CampaignImportsController`, `CampaignApprovalsController`, `CampaignExecutionController`, `CampaignMetricsController`, `CampaignSuppressionController`, `CampaignExportsController`, `CampaignLinksController`.

Endpoints conceituais:

- `POST /campaigns`, `GET /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id`, `POST /campaigns/:id/archive`.
- `POST /campaigns/:id/audience/estimate`, `POST /campaigns/:id/imports`, `GET /campaigns/:id/imports/:importId`.
- `POST /campaigns/:id/test-send`, `POST /campaigns/:id/submit-approval`, `POST /campaigns/:id/approve`, `POST /campaigns/:id/reject`.
- `POST /campaigns/:id/schedule`, `POST /campaigns/:id/start`, `POST /campaigns/:id/pause`, `POST /campaigns/:id/resume`, `POST /campaigns/:id/cancel`.
- `GET /campaigns/:id/messages`, `GET /campaigns/:id/metrics`, `GET /campaigns/:id/export`.
- `GET /c/:shortCode` para redirect de link curto.
- `GET /campaign-suppression`, `POST /campaign-suppression`, `DELETE /campaign-suppression/:id`.

## 57. WebSocket ou SSE

- Canal por organização e campanha: `organization:{id}:campaign:{id}`.
- Eventos: progresso, mudança de estado, contadores, falhas relevantes, conclusão e alertas de rate limit.
- Usar snapshots periódicos mais deltas incrementais para tolerar perda de eventos.
- Autorizar assinatura por permissão de visualizar campanhas.

## 58. Organização recomendada de pastas

```text
backend/src/campaigns/
  domain/
    entities/
    value-objects/
    events/
    services/
    ports/
  application/
    use-cases/
    policies/
    dto-conceptual-only/
  infrastructure/
    prisma/
    queues/
    redis/
    integrations/
  interface/
    rest/
    realtime/
  docs/
```

Esta estrutura é uma direção futura; não implica criação imediata de arquivos.

## 59. Diretrizes futuras para Prisma

- Não acoplar nomes de modelos Prisma ao domínio sem uma camada repository.
- Usar transações curtas para criação de snapshot, mensagens e lotes.
- Evitar payloads JSON gigantes em entidades de alto volume.
- Usar constraints únicas para idempotência.
- Avaliar particionamento nativo PostgreSQL antes de milhões de mensagens.
- Criar migrations em etapas, com backfill e índices concorrentes quando necessário.

## 60. Enums possíveis

- `CampaignStatus`, `CampaignChannel`, `CampaignType`, `CampaignPriority`.
- `CampaignAudienceSourceType`, `CampaignAudienceEligibilityStatus`.
- `CampaignMessageStatus`, `CampaignFailureCategory`.
- `CampaignBatchStatus`, `CampaignScheduleStatus`.
- `CampaignApprovalStatus`, `CampaignImportStatus`.
- `CampaignSuppressionScope`, `CampaignSuppressionReason`.
- `CampaignSenderPolicy`, `CampaignMetricBucketType`.

## 61. Validações possíveis

- `organizationId` obrigatório em todas as operações.
- Template aprovado e compatível com idioma/categoria.
- Variáveis obrigatórias mapeadas e resolvíveis.
- Telefone em E.164 válido.
- Usuário com permissão para ação solicitada.
- Campanha em estado compatível com transição.
- Quotas e feature flags habilitadas.
- Remetente ativo e pertencente à organização.
- Opt-out e suppression ausentes imediatamente antes do envio.
- Rate limits disponíveis antes de chamar WhatsApp.

## 62. Integrações

- **Organizations**: tenant, plano, quotas, timezone, flags e limites.
- **Users**: permissões, ownership e auditoria.
- **Leads**: segmentação, snapshots, enriquecimento, criação/atualização e timeline.
- **Pipeline**: conversões, movimentações e regras pós-resposta.
- **WhatsApp**: `ConversationOptOut`, `Conversation`, `Message`, status, números, conexão, envio e webhooks.
- **Templates**: templates aprovados pela Meta, variáveis e versões.
- **Dashboard**: métricas agregadas e tempo real.
- **Timeline**: eventos por lead/conversa/campanha.
- **IA**: classificação de respostas, recomendações futuras e análise de performance.
- **Relatórios**: datasets, exportações e auditoria de acesso.

## 63. Pontos de escalabilidade

- Processamento por filas e jobs pequenos baseados em IDs.
- Particionamento de tabelas de alto volume.
- Métricas incrementais e cache Redis.
- Rate limit distribuído por múltiplas dimensões.
- Locks finos por campanha, batch e mensagem.
- Batching adaptativo e backpressure.
- DLQ e replay seguro.
- Exportações assíncronas.
- Separação entre intenção de campanha (`CampaignMessage`) e transporte (`Message`).

## 64. Riscos arquiteturais

- Duplicidade de mensagens por retry sem idempotência forte.
- Eventos de webhook fora de ordem gerando regressão de status.
- Recalcular métricas por full scan e degradar PostgreSQL.
- Ignorar opt-out entre snapshot e envio.
- Misturar payloads da Meta no domínio.
- Rotação de números violar política ou prejudicar qualidade.
- Queries sem `organizationId` vazarem dados entre tenants.
- Jobs com payload grande ficarem obsoletos ou inconsistentes.
- Pausa/cancelamento não observados por workers em execução.

## 65. Melhorias futuras

- A/B testing de templates e horários.
- Otimização por IA de segmentos, horários e remetentes.
- Jornadas multi-etapas com condições.
- Frequency capping global por Lead.
- Orçamento e cobrança detalhada por conversa/template.
- Data warehouse para analytics avançado.
- Simulador de custo e entrega antes da aprovação.
- Segmentos dinâmicos versionados com preview histórico.
- Regras avançadas de atribuição multitoque.
