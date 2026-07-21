# Dashboard & Analytics - Design Técnico Enterprise

> Documento arquitetural para revisão. Não contém código executável, schema Prisma, migrations, DTOs, controllers ou services implementáveis.

## 1. Objetivos do módulo

- Fornecer dashboards e analytics enterprise, multi-tenant, escaláveis e de baixa latência para o Impulse CRM.
- Consolidar dados de Organizations, Users, Leads, Pipeline, WhatsApp, Campaigns, Templates, AI, Timeline e Reports sem consultar indiscriminadamente tabelas operacionais de alto volume em tempo real.
- Disponibilizar métricas incrementais, projeções de leitura, snapshots, agregações temporais, rankings, funis, metas, relatórios e exportações.
- Suportar milhões de eventos e registros com consistência eventual controlada, idempotência, replay e rebuild de projeções.
- Garantir isolamento por `organizationId`, permissões, hierarquia, RBAC, ABAC e conformidade com LGPD.

## 2. Responsabilidades

O módulo é responsável por:

- Receber eventos analíticos publicados pelos módulos operacionais ou por uma outbox comum.
- Normalizar eventos em formato analítico versionado.
- Atualizar projeções idempotentes e métricas incrementais.
- Servir consultas de dashboard a partir de read models, snapshots, buckets e cache.
- Gerenciar dashboards configuráveis, widgets, filtros, layouts, preferências, metas, rankings, alertas e relatórios.
- Reconciliar projeções contra fontes oficiais por janelas pequenas, IDs específicos ou snapshots controlados.
- Exportar dados e gerar relatórios agendados de forma assíncrona.

O módulo não é responsável por:

- Ser fonte transacional oficial de Leads, Pipeline, WhatsApp, Campaigns, Users ou Organizations.
- Recalcular todas as métricas a cada consulta.
- Executar full scans em tabelas operacionais de alto volume.
- Conhecer detalhes internos de módulos operacionais.
- Armazenar credenciais de integrações externas.
- Substituir um data warehouse definitivo futuro.

## 3. Escopo inicial

- Dashboards por organização, gerente, corretor, equipe, campanha, número de WhatsApp, canal e período.
- Widgets de KPIs, séries temporais, rankings, funis, metas, tabelas resumidas e alertas básicos.
- Métricas de leads, pipeline, vendas, VGV, propostas, visitas, SLA, atendimento, WhatsApp, campanhas, IA, custos, receita e produtividade.
- Projeções incrementais em PostgreSQL com cache Redis e processamento BullMQ.
- Eventos via outbox, consumers idempotentes, DLQ, retries, replay, rebuild e versionamento de projeções.
- Exportações CSV, Excel e PDF em background.
- Atualizações quase em tempo real por SSE ou WebSocket.

## 4. Fora do escopo inicial

- Data lake/data warehouse completo com modelagem dimensional definitiva.
- OLAP dedicado, streaming engine externo ou ferramenta BI embarcada.
- Machine learning preditivo avançado para forecasting e anomaly detection.
- A/B testing estatístico avançado.
- Billing financeiro definitivo; custos serão métricas analíticas ou estimativas quando necessário.
- Edição visual complexa de dashboards no estilo ferramenta BI completa.

## 5. Arquitetura geral

A arquitetura segue NestJS, Prisma, PostgreSQL, Redis, BullMQ, Clean Architecture, DDD, SOLID, CQRS, Repository Pattern e Event-driven Architecture.

- **Write/Command side operacional**: módulos de origem executam transações próprias e publicam eventos por outbox.
- **Analytics ingestion**: consumers capturam eventos, deduplicam e persistem `AnalyticsEvent` normalizado.
- **Projection workers**: atualizam read models, buckets, snapshots, rankings e funis de forma idempotente.
- **Query side**: APIs consultam apenas read models, snapshots, agregações e cache.
- **Realtime gateway**: envia deltas ou sinais de atualização sem substituir a fonte de verdade.
- **Reconciliation/rebuild**: jobs controlados reprocessam eventos ou recalculam pequenas janelas.

## 6. Camadas

1. **Domain**: entidades conceituais, value objects, métricas, períodos, dimensões, eventos, regras, serviços de domínio e portas.
2. **Application**: casos de uso, autorização, orquestração de queries, comandos administrativos, rebuild, exportações e publicação de jobs.
3. **Infrastructure**: Prisma repositories, Redis cache/locks, BullMQ queues/workers, adapters de eventos, armazenamento de exports e email/notification adapters.
4. **Interfaces**: controllers REST conceituais, SSE/WebSocket gateway, presenters e policies.

## 7. Diagrama textual dos componentes

```text
[Operational Modules]
 Organizations | Users | Leads | Pipeline | WhatsApp | Campaigns | Templates | AI | Timeline | Reports
        |                         publish domain events through outbox
        v
[Outbox Table / Event Relay]
        |
        v
[BullMQ Analytics Ingestion Queue]
        |
        v
[Analytics Event Consumer]
  dedupe -> normalize -> persist AnalyticsEvent -> enqueue projection tasks
        |
        v
[BullMQ Projection Queues]
        |
        v
[Projection Workers]
  MetricBucket | MetricProjection | MetricSnapshot | Ranking | Funnel | Goal | Alert
        |
        +--> [PostgreSQL Read Models, partitioned by tenant/time]
        +--> [Redis Cache, short TTL, not source of truth]
        +--> [SSE/WebSocket invalidation/update notifications]
        |
        v
[Dashboard Query APIs]
        |
        v
[Web App / Reports / Exports]
```

## 8. Estratégia de Command Side e Query Side

- Command side: limitado a configurações do próprio analytics, como criar dashboard, alterar layout, definir metas, iniciar exportação, solicitar rebuild e agendar relatório.
- Query side: retorna dados a partir de projeções e snapshots já materializados.
- Comandos operacionais continuam nos módulos donos, que emitem eventos para analytics.
- Queries analíticas nunca devem bloquear comandos transacionais.

## 9. Estratégia de CQRS

- Usar CQRS para separar escrita/configuração de leitura intensiva.
- Commands validam invariantes e persistem entidades de configuração.
- Queries usam read repositories otimizados, sem carregar agregados completos.
- Eventos de configuração, como `DashboardLayoutChanged`, invalidam caches relacionados.

## 10. Estratégia de Read Models

Read models recomendados:

- `metric_projection`: valor atual por métrica, tenant, dimensão e período lógico.
- `metric_bucket`: agregados temporais por granularidade.
- `metric_snapshot`: fotografia consistente por intervalo fechado.
- `metric_ranking`: ranking pré-computado por dimensão.
- `metric_funnel`: etapas e conversões por funil.
- `dashboard_widget_projection`: payload pré-formatado por widget quando necessário.

## 11. Estratégia de projeções

- Cada projeção possui `projectionName`, `projectionVersion`, `organizationId`, `lastProcessedEventId`, `lastProcessedOccurredAt` e checkpoint.
- Projeções são atualizadas por workers independentes e idempotentes.
- Projeções podem ser rebuildadas em nova versão sem apagar a anterior até validação.
- Projeções usam upsert e incrementos atômicos por chaves únicas.

## 12. Estratégia de métricas incrementais

- Eventos carregam deltas pequenos: `+1 lead_created`, `+cost`, `+revenue`, `status_from/status_to`.
- Métricas de contagem usam incrementos e decrementos compensatórios quando há transição.
- Métricas derivadas, como taxas, são calculadas na leitura a partir de numerador/denominador projetados.
- Payloads grandes não são fonte de verdade; workers recarregam estado atual por IDs pequenos quando necessário.

## 13. Estratégia de snapshots

- Snapshots fecham períodos ou estados caros de recompor: dia encerrado, mês, campanha finalizada, funil congelado e relatório enviado.
- Snapshots são imutáveis por versão, exceto correções registradas como nova versão ou ajuste auditado.
- Consultas longas combinam snapshots históricos fechados com buckets recentes abertos.

## 14. Estratégia de agregações temporais

- Agregar por minuto, hora, dia, semana, mês, trimestre e ano.
- Buckets menores alimentam buckets maiores por rollup assíncrono.
- Períodos fechados viram snapshots; períodos abertos continuam incrementais.
- Toda agregação deve armazenar timezone aplicado e limites UTC.

## 15. Estratégia para dados em tempo real

- Usar SSE ou WebSocket para notificar mudanças recentes em widgets.
- Realtime mostra valores de projeções já persistidas ou cache derivado delas.
- Para contadores ultra recentes, permitir camada `live_delta` no Redis com TTL curto, reconciliada para PostgreSQL.
- Nunca usar realtime como única fonte de verdade.

## 16. Estratégia para dados quase em tempo real

- Objetivo inicial: latência de segundos a poucos minutos, conforme carga.
- Eventos entram em filas BullMQ e atualizam projeções em lote pequeno.
- APIs podem informar `dataFreshness`, `lastUpdatedAt` e `isEventuallyConsistent`.

## 17. Estratégia para dados históricos

- Dados históricos são consultados por snapshots e buckets consolidados.
- Eventos antigos podem ser arquivados ou movidos para dados frios após retenção.
- Rebuild histórico deve ser feito por organização, período, projeção e versão, nunca global sem particionamento.

## 18. Estratégia para consistência eventual

- Aceitar atraso entre evento operacional e dashboard.
- Exibir frescor dos dados para widgets críticos.
- Garantir convergência por idempotência, checkpoints, reconciliação e replay.
- Evitar prometer consistência forte em métricas agregadas de alto volume.

## 19. Estratégia para reconciliação

- Jobs periódicos comparam contadores projetados contra fontes oficiais por pequenas janelas e IDs.
- Reconciliadores executam por tenant, métrica, período e dimensão.
- Diferenças geram eventos de ajuste auditáveis.
- Reconciliar campanhas encerradas, dias fechados e status de mensagens recebidos tardiamente.

## 20. Estratégia para evitar full scans

- Toda consulta filtra por `organizationId`, período e dimensões indexadas.
- Usar buckets e snapshots em vez de tabelas operacionais.
- Limitar drill-down por paginação/cursor e read models específicos.
- Proibir queries analíticas ad hoc diretamente em tabelas transacionais de alto volume.

## 21. Estratégia para evitar consultas pesadas nas tabelas operacionais

- Módulos operacionais publicam eventos com IDs e metadados mínimos.
- Analytics mantém cópias analíticas denormalizadas necessárias.
- Quando precisar enriquecer, workers buscam por IDs pequenos em portas de integração.
- Relatórios grandes usam jobs assíncronos e exports materializados.

## 22. Dashboard por organização

- Escopo padrão de tenant: todas as métricas agregadas da organização.
- Filtros por período, canal, campanha, equipe, usuário, funil e número.
- Respeitar features, quotas e permissões de organização.

## 23. Dashboard por gerente

- Visibilidade baseada em equipes e subordinados.
- Métricas agregadas por equipe/corretor com mascaramento quando necessário.
- Rankings devem incluir apenas pessoas dentro do escopo autorizado.

## 24. Dashboard por corretor

- Mostra carteira, leads atribuídos, SLA, produtividade, mensagens, visitas, propostas e conversões do usuário.
- Não expõe métricas de outros corretores, salvo permissão explícita.

## 25. Dashboard por equipe

- Dimensão `teamId` deve existir nos buckets ou em projeções específicas.
- Mudanças de equipe podem exigir estratégia temporal: equipe no momento do evento versus equipe atual.
- Recomenda-se armazenar ambas quando aplicável: `actorTeamIdAtEvent` e `currentTeamId`.

## 26. Dashboard por campanha

- Métricas por `campaignId`: enviados, entregues, lidos, respostas, cliques, opt-outs, falhas, custo, conversões e receita atribuída.
- Campanhas finalizadas devem gerar snapshot imutável para leitura rápida.

## 27. Dashboard por número de WhatsApp

- Dimensão `whatsappPhoneNumberId` para envio, entrega, leitura, resposta, falha, custo e qualidade.
- Separar número remetente de número de destino.
- Aplicar permissões por conexão/número quando houver.

## 28. Dashboard por canal

- Dimensão `channel`: WhatsApp, formulário, manual, importação, campanha, orgânico, paid, referral e outros.
- Canal de origem do lead e canal de interação devem ser dimensões distintas.

## 29. Dashboard por período

- Toda query exige intervalo explícito ou preset seguro.
- Limitar granularidade permitida por tamanho do intervalo.
- Comparações usam bucket equivalente no timezone da organização.

## 30. Estratégia para filtros

- Filtros configuráveis por widget e dashboard.
- Validar filtros contra métricas compatíveis e permissões.
- Transformar filtros em chave canônica para cache.
- Filtros de alta cardinalidade devem exigir índice ou projeção dedicada.

## 31. Estratégia para drill-down

- KPI agregado abre lista paginada baseada em read model de detalhe ou search index futuro.
- Drill-down deve carregar registros por IDs projetados e paginação cursor-based.
- O detalhe transacional pode ser buscado por porta do módulo dono somente para página pequena.

## 32. Comparação entre períodos

- Consultar buckets do período atual e anterior equivalente.
- Calcular variação absoluta e percentual na application/query layer.
- Sinalizar quando períodos têm completude diferente.

## 33. Metas

- `MetricGoal` define alvo por métrica, dimensão, período, owner e regra de cálculo.
- Projeções calculam progresso incremental.
- Alertas disparam quando meta é atingida, atrasada ou em risco.

## 34. Rankings

- Pré-computar rankings por organização, equipe, usuário, campanha e canal.
- Armazenar `rank`, `value`, `tieBreaker`, `computedAt` e janela.
- Não ranquear entidades fora do escopo autorizado do solicitante.

## 35. Funis

- Modelar `MetricFunnel` com etapas ordenadas, evento de entrada, evento de saída, janela e dimensões.
- Eventos de transição atualizam contadores por etapa.
- Conversão é calculada por etapa e por funil completo.

## 36. Conversão

- Conversões devem ter evento explícito ou regra configurada.
- Armazenar fonte de atribuição, janela de atribuição e entidade convertida.
- Taxa de conversão = conversões / base elegível, usando denominadores projetados.

## 37. SLA

- Métricas de SLA: primeira resposta, atendimento dentro do limite, vencidos e backlog.
- Eventos de lead criado, atribuído, mensagem recebida, primeira resposta e encerramento alimentam buckets.
- SLA deve respeitar calendário/horário comercial por organização quando configurado.

## 38. Produtividade

- Métricas por usuário/equipe: leads trabalhados, contatos, respostas, mensagens enviadas, visitas, propostas, tarefas e vendas.
- Evitar contar ações duplicadas pelo mesmo evento.
- Separar atividade bruta de atividade efetiva.

## 39. Atendimento

- Medir conversas abertas, em espera, finalizadas, reabertas, transferidas, tempo médio de atendimento e taxa de resposta.
- Manter projeção por atendente, equipe, canal e número.

## 40. Campanhas

- Projetar lifecycle: rascunho, aprovada, agendada, em execução, pausada, concluída, cancelada.
- Métricas por campanha e por mensagem devem ser incrementais a partir dos eventos de dispatch e webhook.

## 41. WhatsApp

- Eventos principais: mensagem enviada, entregue, lida, recebida, falhada, conversa iniciada, opt-out, opt-in, clique e custo informado.
- Status fora de ordem devem usar precedência e timestamps do provider.
- Mensagens duplicadas devem ser deduplicadas por provider message id e event id.

## 42. IA

- Métricas: interações IA, sugestões aceitas, automações executadas, handoff humano, tokens, custo, tempo economizado estimado e conversões assistidas.
- Dados de prompt/resposta devem ser minimizados, mascarados ou referenciados por ID.

## 43. Leads

- Métricas: criados, atribuídos, qualificados, perdidos, convertidos, reativados, por origem, temperatura, responsável e campanha.
- Mudanças de status usam transição `from/to` para ajustar buckets corretos.

## 44. Pipeline

- Métricas: oportunidades, valor em aberto, avanço de etapa, perda, ganho, duração por etapa, propostas e vendas.
- Eventos de stage change atualizam funis e snapshots de pipeline.

## 45. Custos

- Custos por mensagem, campanha, lead, venda, canal e IA.
- Distinguir custo estimado, custo confirmado e custo ajustado.
- Ajustes devem ser eventos auditáveis.

## 46. Receita

- Receita deve vir de eventos de venda/negócio ganho ou integração financeira futura.
- Armazenar receita bruta, líquida quando disponível, moeda e data de reconhecimento.

## 47. VGV

- VGV projetado a partir de negócios, imóveis ou vendas conforme modelo do CRM.
- Separar VGV em aberto, proposto, ganho e perdido.
- Comparações devem respeitar moeda e período.

## 48. Vendas

- Métricas: quantidade, receita, VGV, ticket médio, ciclo médio e origem atribuída.
- Venda cancelada deve gerar evento compensatório.

## 49. Visitas

- Métricas: agendadas, realizadas, no-show, canceladas, por corretor, equipe, imóvel, campanha e origem.
- Eventos tardios de conclusão atualizam buckets do horário correto.

## 50. Propostas

- Métricas: criadas, enviadas, aceitas, recusadas, expiradas, valor total e taxa de aceite.
- Propostas alteradas geram deltas para valor e status.

## 51. Respostas recebidas

- Contar mensagens inbound elegíveis por lead, campanha, canal, número e usuário responsável.
- Definir janela de atribuição para resposta de campanha.

## 52. Mensagens enviadas

- Contar apenas envios aceitos pelo módulo WhatsApp ou provider.
- Separar mensagens de campanha, atendimento manual, automação e IA.

## 53. Mensagens entregues

- Atualizar por webhook de entrega com dedupe por message id/status.
- Entrega tardia atualiza bucket do timestamp de entrega.

## 54. Mensagens lidas

- Atualizar por webhook de leitura.
- Taxa de leitura usa lidas / entregues ou lidas / enviadas, conforme definição da métrica.

## 55. Cliques

- Links rastreados em campanha devem emitir evento de clique com campaignId, leadId e linkId quando possível.
- Deduplicar cliques únicos por lead/link/campanha e armazenar contagem total separada.

## 56. Conversões

- Conversão pode ser atribuída por campanha, canal, corretor ou IA.
- Armazenar `conversionType`, `conversionValue`, `attributionModel` e janela.

## 57. Opt-outs

- Métricas por campanha, número, canal e motivo.
- Opt-out deve impactar listas futuras, mas analytics apenas mede e expõe.

## 58. Falhas

- Classificar falhas por provider, validação, rate limit, opt-out, template, número inválido, erro temporário e erro permanente.
- Separar tentativas de mensagens definitivamente falhadas.

## 59. Tempo de primeira resposta

- Capturar timestamp de entrada elegível e primeira resposta humana/automática conforme definição.
- Armazenar soma de duração, contador, p50/p95 futuro via histogramas ou buckets.

## 60. Tempo médio de atendimento

- Duração entre abertura e fechamento de conversa/atendimento.
- Usar acumuladores `durationSumMs` e `durationCount` por dimensão.

## 61. Taxa de resposta

- `responses / delivered` para campanhas ou `responded_leads / contacted_leads` para vendas.
- Definição deve ser versionada em `MetricDefinition`.

## 62. Taxa de conversão

- Calcular a partir de conversões e base qualificada projetada.
- Evitar recalcular base consultando leads operacionais.

## 63. Taxa de leitura

- `read / delivered` preferencialmente; alternativa `read / sent` deve ser métrica distinta.
- Exibir denominador usado.

## 64. Custo por Lead

- `cost / leads_created_or_acquired`, com dimensão de campanha/canal.
- Custos tardios ajustam numerador incrementalmente.

## 65. Custo por venda

- `cost / sales_count` por período e atribuição.
- Se vendas forem zero, retornar nulo e não infinito.

## 66. Custo por resposta

- `cost / responses_count` por campanha, número e canal.
- Diferenciar resposta única de total de respostas.

## 67. Métricas customizadas

- `MetricDefinition` permite fórmulas seguras sobre métricas base projetadas.
- Fórmulas devem ser whitelisted, versionadas e validadas contra permissões.
- Não permitir SQL arbitrário de usuário.

## 68. Dashboards configuráveis

- Dashboards podem ser globais da organização, por papel, por equipe ou pessoais.
- Configuração referencia widgets e filtros, não contém dados agregados como fonte oficial.

## 69. Widgets configuráveis

- Tipos: KPI, line chart, bar chart, pie/donut, table, ranking, funnel, goal, alert, heatmap e markdown controlado.
- Widget declara métricas, dimensões, granularidade, filtros, formato, refresh e permissões.

## 70. Layouts salvos

- `DashboardLayout` guarda grid, breakpoints, ordem, visibilidade e versão.
- Alterações geram eventos e invalidam cache do dashboard.

## 71. Preferências por usuário

- Preferências: dashboard padrão, filtros favoritos, timezone visual, formato numérico, widgets ocultos e intervalos padrão.
- Preferência não deve alterar configuração global sem permissão.

## 72. Permissões por widget ou métrica

- Cada `DashboardMetric` pode exigir capability como `analytics.view.revenue` ou `analytics.view.team`.
- Widgets ocultam ou mascaram métricas proibidas.
- Permissão é validada na query, não apenas na interface.

## 73. Visibilidade hierárquica

- Escopo hierárquico: organização inteira, unidades, equipes, subordinados, próprio usuário.
- Projeções podem armazenar dimensões hierárquicas para evitar pós-filtragem cara.
- Mudanças hierárquicas exigem política temporal clara.

## 74. RBAC e ABAC

- RBAC define papéis e capabilities.
- ABAC aplica atributos: organização, equipe, owner, canal, campanha, sensibilidade e plano.
- Policies ficam na application layer; domínio não depende de framework.

## 75. Multi-tenant

- `organizationId` obrigatório em eventos, entidades, projections, buckets, snapshots, caches, filas e logs.
- Chaves únicas incluem `organizationId`.
- Cache key sempre começa com tenant.
- Rebuild, export e relatório são rate-limited por tenant.

## 76. Feature flags

- Flags controlam widgets, métricas, granularidades, realtime, exports, rankings e métricas customizadas.
- Flags avaliadas na application layer e registradas em auditoria para mudanças sensíveis.

## 77. Quotas

- Quotas por plano: dashboards, widgets, exports simultâneos, relatórios agendados, retenção, granularidade e refresh.
- Excedentes retornam erro de negócio ou degradam para granularidade maior.

## 78. Cache Redis

- Cache de respostas por `organizationId`, dashboard/widget, filtros canônicos, período, granularidade, usuário/escopo e versão de projeção.
- TTL curto para tempo real; maior para histórico fechado.
- Redis também pode armazenar live deltas, locks, rate limits e estado de jobs.

## 79. Invalidação de cache

- Invalidação por tags: tenant, metric, period bucket, dashboard, widget e projection version.
- Eventos de projeção atualizada invalidam chaves relacionadas ou incrementam namespace version.
- Preferir TTL + versioned keys para reduzir custo de deleção em massa.

## 80. Locks distribuídos

- Usar Redis locks com TTL para rebuild, rollup, snapshot fechamento e export pesado.
- Locks devem ter owner token e renovação segura.
- Operação deve ser idempotente mesmo se lock expirar.

## 81. BullMQ

- BullMQ orquestra ingestion, projection, rollup, snapshots, reconciliation, rebuild, exports, reports e alerts.
- Jobs pequenos, particionados por tenant/período/projeção.
- Payload do job contém IDs, ranges e versões, não objetos grandes.

## 82. Filas sugeridas

- `analytics.ingestion.events`
- `analytics.projections.high-priority`
- `analytics.projections.standard`
- `analytics.rollups`
- `analytics.snapshots`
- `analytics.reconciliation`
- `analytics.rebuild`
- `analytics.exports`
- `analytics.reports.scheduled`
- `analytics.alerts`
- `analytics.dlq`

## 83. Workers

- Workers por fila com concorrência configurável por tenant e tipo de métrica.
- Workers carregam estado atual por IDs pequenos quando necessário.
- Workers registram checkpoints, métricas de processamento e erros estruturados.

## 84. Backpressure

- Limitar concorrência por tenant e por origem de evento.
- Priorizar eventos recentes e projeções críticas.
- Degradar realtime antes de degradar persistência.
- Aplicar rate limit e pausas quando DLQ crescer ou banco saturar.

## 85. Retries

- Retentativas exponenciais com jitter para erros temporários.
- Erros de validação, permissão ou evento inválido vão para DLQ sem retry infinito.
- Retry deve preservar idempotency key.

## 86. DLQ

- DLQ armazena job id, event id, organizationId, erro, stack sanitizada, tentativas e payload mínimo.
- Permitir reprocessamento após correção, por evento ou lote pequeno.
- Alertar quando taxa de DLQ exceder limite.

## 87. Idempotência

- `AnalyticsEvent` possui `eventId` global e `deduplicationKey` por origem.
- Tabelas de projeção usam chaves únicas por métrica/dimensão/bucket/projeção.
- Processed-events por projection evitam aplicar o mesmo evento duas vezes.
- Transições de status usam máquina de estados para evitar contagem duplicada.

## 88. Outbox pattern

- Módulos operacionais gravam evento na mesma transação do estado de origem.
- Relay publica eventos para filas sem exigir que módulos conheçam internals do dashboard.
- Outbox contém tipo, versão, aggregateId, organizationId, occurredAt, payload mínimo e traceId.

## 89. Event consumers

- Consumers validam schema, tenant, versão, assinatura interna quando aplicável e deduplicação.
- Consumers normalizam para `AnalyticsEvent` e roteiam para projeções interessadas.
- Falha de uma projeção não deve bloquear todas, desde que evento esteja persistido.

## 90. Eventos fora de ordem

- Usar `occurredAt`, `receivedAt`, versão do agregado e precedência de status.
- Eventos tardios atualizam bucket histórico e marcam cache afetado.
- Quando ordem for essencial, reconsultar estado atual por ID ou aguardar janela de estabilização.

## 91. Deduplicação de eventos

- Deduplicar por `eventId`, `sourceEventId`, `providerEventId` e chave natural quando necessário.
- Manter tabela compacta de dedupe por retenção suficiente.
- Deduplication hit incrementa métrica operacional de eventos duplicados, não métrica de negócio.

## 92. Replay de eventos

- Replay seleciona organizationId, período, origem, tipo de evento, projeção e versão.
- Replay roda em namespace/projectionVersion separado ou modo dry-run.
- Proteger por permissão administrativa e locks.

## 93. Rebuild de projeções

- Criar nova versão de projeção, processar histórico e comparar checksums/amostras.
- Trocar alias ativo somente após validação.
- Rebuild pode ser por tenant, métrica, período ou projeção inteira.

## 94. Versionamento de projeções

- `projectionVersion` obrigatório em read models.
- Mudanças de fórmula, dimensão, granularidade ou regra de atribuição criam nova versão.
- Queries usam versão ativa registrada em catálogo.

## 95. Métricas em buckets

- **Minuto**: realtime/quase realtime, retenção curta, alto custo.
- **Hora**: operação diária e gráficos de curto prazo.
- **Dia**: padrão para dashboards gerenciais.
- **Semana**: análise comercial e produtividade.
- **Mês**: metas, receita, VGV e campanhas.
- **Trimestre**: gestão executiva.
- **Ano**: histórico consolidado.

## 96. Timezone por organização

- Armazenar eventos em UTC.
- Calcular buckets com timezone da organização vigente no evento ou no período.
- Mudança de timezone requer política de corte e possível rebuild de períodos abertos.

## 97. PostgreSQL

- Fonte de verdade analítica para eventos normalizados, read models, snapshots, configurações e auditoria.
- Usar transações curtas, upserts atômicos e índices compostos.
- Separar tabelas de configuração de tabelas de alto volume.

## 98. Particionamento

- Particionar eventos e buckets por tempo, e considerar subpartição/hash por organizationId em alto volume.
- Snapshots podem ser particionados por período fechado.
- Retenção e arquivamento ficam mais simples com partições.

## 99. Índices

- Índices compostos típicos: `(organizationId, metricKey, bucketGranularity, bucketStartUtc, dimensionHash, projectionVersion)`.
- Índices para dashboards: `(organizationId, dashboardId, userId)`.
- Índices para eventos: `(organizationId, occurredAt)`, `(eventId)`, `(sourceType, sourceEventId)`.
- Evitar índices excessivos em tabelas de alta escrita; validar por query plans.

## 100. Retenção de dados

- Eventos brutos: retenção conforme plano e LGPD.
- Buckets minuto/hora: retenção menor.
- Buckets dia/mês/ano e snapshots: retenção maior.
- Exports expiram e são removidos automaticamente.

## 101. Dados frios

- Eventos antigos podem ir para storage frio ou schema histórico.
- Rebuild de dados frios é mais lento e assíncrono.
- APIs devem indicar quando consulta excede janela quente.

## 102. Materialized views

- Usar somente para consultas estáveis e históricas, não para realtime de alto volume.
- Refresh incremental ou concorrente quando possível.
- Não substituir projeções idempotentes para métricas críticas.

## 103. Data warehouse futuro

- Manter `AnalyticsEvent` e projeções com schemas versionados facilita ETL/ELT futuro.
- Projetar dimensões compatíveis com modelo estrela: fato_evento, fato_métrica, dim_tempo, dim_usuario, dim_campanha, dim_canal.
- Exports internos podem alimentar warehouse sem impactar OLTP.

## 104. Exportação

- Exportações são jobs assíncronos com status, filtros, formato e expiração.
- Export lê snapshots/read models, não tabelas operacionais.
- Grandes exports usam paginação por cursor e arquivos temporários.

## 105. Relatórios agendados

- `ReportSchedule` define periodicidade, destinatários, formato, filtros e timezone.
- Jobs geram relatório após fechamento do período ou com frescor declarado.
- Falhas são auditadas e retentadas.

## 106. CSV

- Indicado para dados tabulares grandes.
- Usar streaming em job, separador configurável e encoding UTF-8.
- Mascarar campos sensíveis conforme permissões.

## 107. Excel

- Indicado para relatórios executivos moderados.
- Pode incluir múltiplas abas: KPIs, séries, rankings e funis.
- Limitar tamanho para evitar memória excessiva.

## 108. PDF

- Indicado para snapshot visual de dashboard/relatório.
- Gerar assíncrono a partir de template controlado.
- Incluir metadados de período, filtros e frescor.

## 109. WebSocket

- Útil para dashboards abertos com múltiplos widgets e atualizações bidirecionais.
- Autenticar conexão, validar tenant e escopo por assinatura de canal.
- Enviar deltas compactos ou sinal de invalidação.

## 110. SSE

- Alternativa mais simples para stream unidirecional de atualizações.
- Boa escolha inicial para baixa complexidade operacional.
- Reconnect deve usar last event id quando possível.

## 111. Atualização em tempo real

- Projection worker publica evento interno `MetricProjectionUpdated`.
- Gateway agrupa updates por janela curta para evitar storm.
- Cliente refaz query do widget ou aplica delta confiável.

## 112. Observabilidade

- Métricas técnicas: lag de fila, eventos/s, projection latency, cache hit, DLQ rate, rebuild duration e query latency.
- Métricas de negócio: volume por tenant, dashboards acessados, exports e relatórios.
- Dashboards internos para saúde do analytics.

## 113. Logs

- Logs estruturados com `organizationId`, `eventId`, `jobId`, `projectionName`, `projectionVersion`, `traceId` e `userId` quando aplicável.
- Não logar dados sensíveis de leads, mensagens ou prompts.

## 114. Tracing

- Propagar traceId da outbox até worker, repository e gateway realtime.
- Spans para ingestion, dedupe, projection update, cache invalidation e query.

## 115. Auditoria

- Auditar criação/alteração/exclusão de dashboards, widgets, metas, relatórios, exports, rebuilds, replay e acessos a métricas sensíveis.
- Auditoria deve ser append-only e filtrada por tenant.

## 116. LGPD

- Minimização de dados: analytics armazena dimensões e hashes, não conteúdo sensível desnecessário.
- Direito de exclusão pode anonimizar dimensões pessoais mantendo agregados quando legalmente permitido.
- Exportações respeitam base legal, permissões e expiração.

## 117. Anonimização

- Substituir identificadores pessoais por tokens irreversíveis em eventos frios quando necessário.
- Agregados históricos podem permanecer sem identificação individual.
- Reprocessar projeções afetadas quando anonimização exigir.

## 118. Mascaramento

- Campos pessoais em drill-down e exports são mascarados conforme papel, escopo e finalidade.
- Métricas financeiras ou de IA podem exigir permissões específicas.

## 119. Entidades conceituais

Entidades recomendadas: `Dashboard`, `DashboardLayout`, `DashboardWidget`, `DashboardFilter`, `DashboardMetric`, `MetricDefinition`, `MetricProjection`, `MetricSnapshot`, `MetricBucket`, `MetricDimension`, `MetricGoal`, `MetricRanking`, `MetricFunnel`, `MetricAlert`, `Report`, `ReportSchedule`, `ReportExport`, `AnalyticsEvent`, `AnalyticsProjection` e `AnalyticsAuditLog`.

## 120. Campos conceituais de cada entidade

- `Dashboard`: `id`, `organizationId`, `name`, `description`, `scopeType`, `ownerUserId`, `teamId`, `isDefault`, `visibility`, `status`, `createdAt`, `updatedAt`, `deletedAt`.
- `DashboardLayout`: `id`, `organizationId`, `dashboardId`, `userId`, `breakpoint`, `grid`, `version`, `createdAt`, `updatedAt`.
- `DashboardWidget`: `id`, `organizationId`, `dashboardId`, `type`, `title`, `metricKeys`, `dimensionKeys`, `filterDefinition`, `visualConfig`, `refreshPolicy`, `requiredPermissions`, `position`, `createdAt`, `updatedAt`.
- `DashboardFilter`: `id`, `organizationId`, `dashboardId`, `widgetId`, `key`, `operator`, `value`, `isGlobal`, `createdAt`, `updatedAt`.
- `DashboardMetric`: `id`, `organizationId`, `widgetId`, `metricDefinitionId`, `alias`, `format`, `sortOrder`, `createdAt`, `updatedAt`.
- `MetricDefinition`: `id`, `key`, `name`, `description`, `category`, `formulaType`, `formula`, `numeratorKey`, `denominatorKey`, `unit`, `defaultGranularity`, `supportedDimensions`, `requiredPermissions`, `version`, `status`.
- `MetricProjection`: `id`, `organizationId`, `projectionName`, `projectionVersion`, `metricKey`, `dimensionHash`, `dimensionValues`, `periodStartUtc`, `periodEndUtc`, `value`, `numerator`, `denominator`, `updatedAt`.
- `MetricSnapshot`: `id`, `organizationId`, `snapshotType`, `metricKey`, `periodStartUtc`, `periodEndUtc`, `timezone`, `dimensionHash`, `data`, `projectionVersion`, `createdAt`.
- `MetricBucket`: `id`, `organizationId`, `metricKey`, `granularity`, `bucketStartUtc`, `bucketEndUtc`, `timezone`, `dimensionHash`, `dimensionValues`, `count`, `sum`, `min`, `max`, `durationSumMs`, `durationCount`, `projectionVersion`, `updatedAt`.
- `MetricDimension`: `id`, `organizationId`, `key`, `name`, `entityType`, `entityId`, `attributes`, `validFrom`, `validTo`.
- `MetricGoal`: `id`, `organizationId`, `metricKey`, `targetValue`, `periodType`, `periodStartUtc`, `periodEndUtc`, `scopeType`, `scopeId`, `ownerUserId`, `status`, `createdAt`, `updatedAt`.
- `MetricRanking`: `id`, `organizationId`, `metricKey`, `rankedEntityType`, `rankedEntityId`, `rank`, `value`, `periodStartUtc`, `periodEndUtc`, `dimensionHash`, `computedAt`, `projectionVersion`.
- `MetricFunnel`: `id`, `organizationId`, `name`, `steps`, `scopeType`, `filterDefinition`, `attributionWindow`, `status`, `createdAt`, `updatedAt`.
- `MetricAlert`: `id`, `organizationId`, `metricKey`, `condition`, `threshold`, `scopeType`, `scopeId`, `channels`, `status`, `lastTriggeredAt`, `createdAt`, `updatedAt`.
- `Report`: `id`, `organizationId`, `name`, `description`, `dashboardId`, `filterDefinition`, `format`, `status`, `createdByUserId`, `createdAt`, `updatedAt`.
- `ReportSchedule`: `id`, `organizationId`, `reportId`, `cronExpression`, `timezone`, `recipients`, `format`, `isActive`, `lastRunAt`, `nextRunAt`, `createdAt`, `updatedAt`.
- `ReportExport`: `id`, `organizationId`, `reportId`, `dashboardId`, `requestedByUserId`, `format`, `status`, `fileKey`, `expiresAt`, `filterDefinition`, `error`, `createdAt`, `completedAt`.
- `AnalyticsEvent`: `id`, `organizationId`, `eventId`, `sourceType`, `sourceAggregateId`, `eventType`, `eventVersion`, `occurredAt`, `receivedAt`, `payloadRef`, `payloadSmall`, `deduplicationKey`, `traceId`.
- `AnalyticsProjection`: `id`, `organizationId`, `projectionName`, `projectionVersion`, `status`, `lastCheckpoint`, `lastProcessedEventAt`, `activeFrom`, `createdAt`, `updatedAt`.
- `AnalyticsAuditLog`: `id`, `organizationId`, `actorUserId`, `action`, `entityType`, `entityId`, `before`, `after`, `ipAddress`, `userAgent`, `createdAt`.

## 121. Relacionamentos

- `Dashboard` possui muitos `DashboardWidget`, `DashboardLayout` e `DashboardFilter`.
- `DashboardWidget` referencia várias `DashboardMetric` e filtros próprios.
- `DashboardMetric` referencia `MetricDefinition`.
- `MetricProjection`, `MetricBucket`, `MetricSnapshot` e `MetricRanking` referenciam metric keys e dimensões por hash/valores.
- `MetricGoal` e `MetricAlert` referenciam métricas e escopos organizacionais.
- `Report` pode referenciar `Dashboard`; `ReportSchedule` e `ReportExport` referenciam `Report`.
- `AnalyticsEvent` alimenta `AnalyticsProjection` e read models.

## 122. Eventos de domínio

- `DashboardCreated`, `DashboardUpdated`, `DashboardDeleted`
- `DashboardLayoutChanged`, `DashboardWidgetAdded`, `DashboardWidgetUpdated`, `DashboardWidgetRemoved`
- `MetricDefinitionCreated`, `MetricDefinitionVersioned`, `MetricGoalChanged`
- `AnalyticsEventReceived`, `AnalyticsEventDeduplicated`, `ProjectionUpdated`
- `ProjectionRebuildRequested`, `ProjectionRebuildCompleted`, `ProjectionRebuildFailed`
- `MetricSnapshotCreated`, `MetricAlertTriggered`
- `ReportExportRequested`, `ReportExportCompleted`, `ReportScheduleTriggered`

Eventos externos consumidos incluem leads, pipeline, mensagens, campanhas, IA, templates, usuários e organizações.

## 123. Serviços de domínio

- `MetricFormulaEvaluator`: valida e calcula fórmulas derivadas.
- `DimensionResolver`: normaliza dimensões e hashes.
- `BucketPeriodCalculator`: calcula buckets considerando timezone.
- `ProjectionIdempotencyPolicy`: define chaves e regras de dedupe.
- `VisibilityPolicy`: define escopo hierárquico conceitual.
- `GoalProgressCalculator`: calcula progresso e status de metas.
- `FunnelTransitionPolicy`: valida transições de funil.

## 124. Casos de uso

- Criar/editar/remover dashboard.
- Salvar layout e preferências por usuário.
- Adicionar/configurar/remover widget.
- Consultar dashboard e widget.
- Consultar séries temporais, ranking, funil, metas e drill-down.
- Definir métricas customizadas e metas.
- Receber evento analítico.
- Processar projeção incremental.
- Criar snapshot/rollup.
- Solicitar replay/rebuild/reconciliação.
- Solicitar exportação e relatório agendado.
- Disparar alertas.

## 125. Repository Ports

- `DashboardRepositoryPort`
- `DashboardLayoutRepositoryPort`
- `DashboardWidgetRepositoryPort`
- `MetricDefinitionRepositoryPort`
- `MetricProjectionRepositoryPort`
- `MetricBucketRepositoryPort`
- `MetricSnapshotRepositoryPort`
- `MetricGoalRepositoryPort`
- `MetricRankingRepositoryPort`
- `MetricFunnelRepositoryPort`
- `MetricAlertRepositoryPort`
- `AnalyticsEventRepositoryPort`
- `AnalyticsProjectionRepositoryPort`
- `ReportRepositoryPort`
- `ReportExportRepositoryPort`
- `AnalyticsAuditLogRepositoryPort`

## 126. Integration Ports

- `OrganizationContextPort`
- `UserHierarchyPort`
- `AuthorizationPolicyPort`
- `OperationalEntityLookupPort`
- `EventBusPort`
- `OutboxConsumerPort`
- `QueuePort`
- `CachePort`
- `DistributedLockPort`
- `ExportStoragePort`
- `NotificationPort`
- `RealtimePublisherPort`

## 127. Controllers conceituais

- `DashboardController`: configuração e leitura de dashboards.
- `DashboardWidgetController`: widgets e queries individuais.
- `MetricsController`: catálogo, séries, rankings, funis e metas.
- `ReportsController`: relatórios, agendamentos e exports.
- `AnalyticsAdminController`: rebuild, replay, reconciliação e saúde.
- `AnalyticsRealtimeGateway`: SSE/WebSocket conceitual.

## 128. Endpoints REST conceituais

- `GET /analytics/dashboards`
- `POST /analytics/dashboards`
- `GET /analytics/dashboards/:id`
- `PATCH /analytics/dashboards/:id`
- `DELETE /analytics/dashboards/:id`
- `PUT /analytics/dashboards/:id/layout`
- `POST /analytics/dashboards/:id/widgets`
- `PATCH /analytics/widgets/:id`
- `DELETE /analytics/widgets/:id`
- `GET /analytics/widgets/:id/data`
- `GET /analytics/metrics/definitions`
- `GET /analytics/metrics/:metricKey/series`
- `GET /analytics/metrics/:metricKey/ranking`
- `GET /analytics/funnels/:id`
- `POST /analytics/goals`
- `GET /analytics/reports`
- `POST /analytics/reports/:id/exports`
- `POST /analytics/reports/:id/schedules`
- `POST /analytics/admin/projections/:name/rebuild`
- `POST /analytics/admin/projections/:name/replay`
- `POST /analytics/admin/reconciliation`

## 129. Organização recomendada de pastas

```text
backend/src/analytics/
  domain/
    entities/
    value-objects/
    events/
    services/
    ports/
  application/
    commands/
    queries/
    use-cases/
    policies/
  infrastructure/
    prisma/
    redis/
    bullmq/
    event-consumers/
    exporters/
    realtime/
  interfaces/
    rest/
    gateways/
    presenters/
  analytics.module.ts
```

## 130. Diretrizes futuras para Prisma

- Não gerar schema agora.
- Modelos devem incluir `organizationId`, timestamps, soft delete quando aplicável e versionamento.
- Usar índices compostos alinhados aos padrões de query.
- Avaliar tabelas separadas para configurações versus alto volume.
- Para partições, considerar migrations SQL manuais complementares ao Prisma quando necessário.

## 131. Possíveis enums

- `DashboardScopeType`: ORGANIZATION, TEAM, USER, MANAGER, CAMPAIGN, CHANNEL.
- `WidgetType`: KPI, LINE, BAR, TABLE, RANKING, FUNNEL, GOAL, ALERT, HEATMAP.
- `MetricCategory`: LEADS, PIPELINE, WHATSAPP, CAMPAIGNS, AI, REVENUE, COST, SLA, PRODUCTIVITY.
- `BucketGranularity`: MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR.
- `ProjectionStatus`: BUILDING, ACTIVE, DEPRECATED, FAILED, REBUILDING.
- `ExportFormat`: CSV, XLSX, PDF.
- `ReportStatus`: DRAFT, ACTIVE, PAUSED, ARCHIVED.
- `AlertCondition`: GT, GTE, LT, LTE, EQ, CHANGE_PERCENT, GOAL_RISK.

## 132. Possíveis validações

- `organizationId` obrigatório em todas as operações.
- Período máximo por granularidade.
- Métrica compatível com dimensões e filtros solicitados.
- Permissão para cada métrica sensível.
- Dashboard/widget dentro de quota do plano.
- Fórmulas customizadas sem SQL arbitrário.
- Exportação limitada por volume, formato e permissão.
- Rebuild/replay apenas para administradores autorizados.

## 133. Pontos de escalabilidade

- Particionamento por tempo e tenant.
- Filas por prioridade e workload.
- Workers horizontais e concorrência por tenant.
- Cache com chaves versionadas.
- Rollups e snapshots para reduzir custo de consulta.
- Rebuild paralelo por partição.
- Data warehouse futuro para análises profundas.

## 134. Riscos arquiteturais

- Crescimento de cardinalidade por dimensões demais.
- Eventos fora de ordem gerando inconsistência se regras de precedência forem fracas.
- Cache com invalidação ampla demais causando stampede.
- Rebuilds concorrendo com ingestão normal.
- Mudanças hierárquicas alterando interpretação histórica.
- Métricas customizadas mal governadas virando BI ad hoc caro.
- Retenção inadequada afetando LGPD ou capacidade de replay.

## 135. Melhorias futuras

- Warehouse dedicado e camada semântica analítica.
- OLAP/columnar store para exploração avançada.
- Histogramas e percentis reais para SLA e atendimento.
- Anomaly detection e forecast por IA.
- A/B testing e atribuição multi-touch.
- Query planner interno para widgets customizados.
- Catálogo de métricas com documentação e lineage.
- Governança de qualidade de dados com score por projeção.
