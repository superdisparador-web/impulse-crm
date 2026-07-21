# Módulo Pipeline

## Entidades implementadas
Pipeline, PipelineStage, StageChecklist, PipelineLossReason, Deal, DealStageMovement, DealEvent, DealAssignment, Tag, DealTag, DealActivity e AuditLog global.

## Regras de negócio
- Lead pode possuir vários Deals; Lead não recebe campos comerciais do Pipeline.
- `Deal.status` é a única fonte oficial para OPEN, WON, LOST, REOPENED e ARCHIVED.
- `PipelineStage` não possui `isWon` nem `isLost`.
- Toda mudança de etapa cria `DealStageMovement` imutável.
- Toda alteração relevante cria `DealEvent`.
- Toda ação sensível cria `AuditLog` global.
- `Deal.ownerId` é o responsável atual; `DealAssignment` mantém histórico completo.
- `estimatedValue` não é sobrescrito no ganho; `closedValue` armazena o valor real fechado.
- Ao ganhar: status WON, `closedAt`, `wonAt` e `closedValue`.
- Ao perder: status LOST, `closedAt`, `lostAt` e `lossReasonId` obrigatório.
- Ao reabrir: status REOPENED, limpa `closedAt`, `wonAt`, `lostAt`, `lossReasonId` e `closedValue`, preservando histórico em `DealEvent`.
- Probabilidades aceitam 0 a 100; valores monetários não podem ser negativos.
- Apenas uma stage inicial ativa por pipeline e um pipeline padrão por organização são mantidos por regra transacional.

## Endpoints
Base: `/pipeline`

### Pipelines e Kanban
- `GET /pipelines`
- `POST /pipelines`
- `GET /pipelines/:id`
- `PATCH /pipelines/:id`
- `DELETE /pipelines/:id`
- `GET /pipelines/:id/kanban`

### Stages e checklists
- `POST /pipelines/:pipelineId/stages`
- `PATCH /stages/reorder/:pipelineId`
- `PATCH /stages/:id`
- `DELETE /stages/:id`
- `POST /stages/:stageId/checklists`
- `PATCH /checklists/:id`
- `DELETE /checklists/:id`

### Motivos de perda, tags e deals
- `GET|POST /loss-reasons`
- `PATCH|DELETE /loss-reasons/:id`
- `GET|POST /tags`
- `PATCH|DELETE /tags/:id`
- `GET|POST /deals`
- `GET|PATCH|DELETE /deals/:id`
- `POST /deals/:id/move`
- `POST /deals/:id/change-pipeline`
- `POST /deals/:id/assign`
- `POST /deals/:id/tags`
- `DELETE /deals/:id/tags/:tagId`
- `POST /deals/:id/won`
- `POST /deals/:id/lost`
- `POST /deals/:id/reopen`
- `GET /deals/:id/movements`
- `GET /deals/:id/timeline`
- `POST /deals/:id/activities`
- `PATCH /deals/:id/activities/:activityId`
- `POST /deals/:id/activities/:activityId/cancel`

## Permissões e segurança
Todos os endpoints usam `JwtAuthGuard` e `RolesGuard` com papéis ADMIN e CORRETOR. O escopo de organização é resolvido por `AccessContextService`; usuários não globais operam apenas sua organização. Todas as validações impedem relacionamentos cross-tenant entre Lead, Pipeline, Stage, Tag, LossReason, User e Deal.

## Eventos
Eventos persistidos em `DealEvent`: DEAL_CREATED, DEAL_UPDATED, DEAL_STAGE_CHANGED, DEAL_PIPELINE_CHANGED, DEAL_OWNER_CHANGED, DEAL_TAG_ADDED, DEAL_TAG_REMOVED, DEAL_WON, DEAL_LOST, DEAL_REOPENED, DEAL_ARCHIVED, DEAL_ACTIVITY_CREATED, DEAL_ACTIVITY_UPDATED, DEAL_ACTIVITY_COMPLETED.

## Fluxos
### Ganho
`POST /deals/:id/won` valida Deal OPEN/REOPENED, grava status WON, `closedAt`, `wonAt`, `closedValue`, cria DealEvent e AuditLog.

### Perda
`POST /deals/:id/lost` exige motivo válido na organização/pipeline, grava status LOST, `closedAt`, `lostAt`, `lossReasonId`, cria DealEvent e AuditLog.

### Reabertura
`POST /deals/:id/reopen` aceita Deal WON/LOST, valida stage ativa do pipeline, limpa campos atuais de fechamento, grava status REOPENED, cria movement REOPENED, DealEvent e AuditLog.

## Multi-tenancy
Todas as entidades operacionais possuem `organizationId` e índices multi-tenant. Queries operacionais nunca usam apenas `id` sem validação de organização.

## Migrations e testes
- Formatar schema: `npx prisma format --schema prisma/schema.prisma`
- Validar schema: `npx prisma validate --schema prisma/schema.prisma`
- Gerar client: `npx prisma generate --schema prisma/schema.prisma`
- Aplicar migrations: `npx prisma migrate deploy --schema prisma/schema.prisma`
- Backend: `rm -rf dist && npm run build && npm test`
- Frontend: `npm run lint && npm run build`
