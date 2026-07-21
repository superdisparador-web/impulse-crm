# Padrões de Engenharia do Impulse CRM

**Status:** obrigatório para novas implementações.  
**Escopo:** backend NestJS, frontend Next.js, Prisma, PostgreSQL, Redis, BullMQ, TypeScript, integrações, operações e documentação técnica.  
**Regra central:** este documento define padrões; ele não implementa funcionalidades, não cria schemas, migrations, DTOs, controllers ou services executáveis.

## 1. Objetivos dos padrões de engenharia

- Garantir código seguro, previsível, testável e sustentável.
- Preservar Clean Architecture, DDD, SOLID e separação clara de responsabilidades.
- Proteger isolamento multi-tenant, especialmente por `organizationId`.
- Reduzir regressões em integrações, filas, eventos, cache e banco de dados.
- Tornar revisões, incidentes, deploys e manutenção consistentes.
- Criar linguagem comum para engenharia, produto, segurança e operações.

## 2. Princípios gerais

**Obrigatório:**

- Escrever software simples antes de sofisticado.
- Modelar regras críticas no domínio, não em controllers, DTOs ou repositories.
- Tratar segurança, observabilidade, performance e testes como parte do design.
- Tornar dependências explícitas por interfaces, ports e adapters.
- Preservar compatibilidade com arquitetura aprovada do Impulse CRM.
- Preferir decisões reversíveis quando o custo de mudança for alto.

**Recomendado:**

- Usar ADRs para decisões arquiteturais relevantes.
- Evitar abstrações antes de existirem pelo menos dois usos reais.

## 3. Regras obrigatórias

- Toda operação tenant-aware deve exigir `organizationId`.
- O domínio nunca pode depender de Prisma, Redis, BullMQ, NestJS, SDKs ou providers externos.
- Controllers não podem conter regra de negócio.
- DTOs não podem conter regra de negócio.
- Repositories não podem conter regra de negócio de domínio.
- Jobs devem carregar IDs pequenos e metadados mínimos, nunca snapshots grandes.
- Cache nunca pode ser fonte única de verdade.
- Erros devem possuir códigos estáveis.
- Logs não podem expor PII, secrets, tokens ou payloads sensíveis.
- Toda integração externa deve possuir timeout.
- Toda operação com efeitos colaterais deve considerar idempotência.
- Toda implementação deve possuir testes proporcionais ao risco.

## 4. Regras proibidas

- Proibido acoplar domínio a framework, ORM, fila, cache ou provider externo.
- Proibido acessar dados de múltiplos tenants sem autorização explícita e teste específico.
- Proibido criar queries sem filtro tenant-aware em dados multi-tenant.
- Proibido usar `any` sem justificativa documentada e escopo mínimo.
- Proibido silenciar erros sem log seguro, métrica ou decisão explícita.
- Proibido logar PII, secrets, credenciais, tokens, cookies ou payloads integrais.
- Proibido fazer retry infinito.
- Proibido usar cache como fonte de verdade.
- Proibido executar migrations destrutivas em produção sem plano de rollback e backup.

## 5. Organização do projeto

**Estrutura esperada, adaptável a monorepo ou repositórios separados:**

- `backend/`: aplicação NestJS, módulos de domínio e infraestrutura.
- `frontend/`: aplicação Next.js.
- `docs/`: documentação técnica, ADRs, RFCs, runbooks e padrões.
- `shared/`: contratos, tipos e utilitários realmente compartilhados, sem acoplamento indevido.
- `infra/`: configurações operacionais, quando aplicável.

**Recomendado:** manter fronteiras visíveis por diretórios e reforçadas por lint, aliases e testes arquiteturais.

## 6. Organização por módulo

Cada módulo de negócio deve expor somente contratos necessários e esconder detalhes internos. Um módulo típico pode conter:

- `domain/`
- `application/`
- `infrastructure/`
- `interfaces/`
- `shared/`, quando houver itens internos compartilhados no módulo
- `config/`, quando a configuração for do módulo

## 7. Separação entre camadas

- `domain`: regras de negócio, entidades, value objects, domain services, domain events e invariantes.
- `application`: use cases, application services, ports, orquestração, transações e autorização de caso de uso.
- `infrastructure`: Prisma, Redis, BullMQ, SDKs externos, storage, email, WhatsApp, IA, observabilidade e implementações de ports.
- `interfaces`: REST controllers, WebSocket gateways, SSE endpoints, DTOs, presenters e mapeamento de entrada/saída.
- `shared`: utilitários transversais sem regra de negócio específica.
- `config`: leitura, validação e exposição de configuração.

## 8. Regras de dependência entre camadas

**Obrigatório:**

- `domain` não depende de nenhuma camada.
- `application` depende de `domain` e de ports próprios.
- `infrastructure` depende de `application` e `domain` para implementar ports.
- `interfaces` depende de `application` para executar use cases e mapear respostas.
- `shared` não pode depender de módulos de negócio.
- `config` não pode importar regras de negócio.

## 9. Dependency Rule

Dependências sempre apontam para dentro, em direção ao domínio. Detalhes externos dependem de abstrações internas; abstrações internas não conhecem detalhes externos.

Exemplo conceitual permitido: um use case depende de `CustomerRepositoryPort`; um adapter Prisma implementa esse port.  
Exemplo conceitual proibido: uma entidade importar `PrismaClient` ou um decorator NestJS.

## 10. Regras para Domain Layer

- Deve conter linguagem ubíqua do negócio.
- Deve proteger invariantes sempre que entidades ou aggregates mudarem estado.
- Deve ser executável em testes unitários sem banco, Redis, NestJS ou rede.
- Deve usar value objects para conceitos com validação própria.
- Não deve serializar diretamente formatos HTTP, Prisma ou eventos externos.

## 11. Regras para Application Layer

- Deve orquestrar casos de uso e transações.
- Deve depender de ports para persistência, filas, providers e relógio.
- Deve validar autorização e escopo tenant-aware antes de efeitos colaterais.
- Deve publicar eventos conforme necessidade do fluxo.
- Não deve conter detalhes de framework ou SDK externo.

## 12. Regras para Infrastructure Layer

- Deve implementar ports definidos pela aplicação.
- Deve conter adapters Prisma, Redis, BullMQ, providers externos e storage.
- Deve traduzir erros externos para erros internos padronizados.
- Deve aplicar timeouts, retries, circuit breaker e métricas em integrações.
- Não deve introduzir regra de domínio.

## 13. Regras para Interface Layer

- Deve receber requisições, validar formato, autenticar quando aplicável e chamar use cases.
- Deve mapear respostas e erros para protocolos como REST, WebSocket e SSE.
- Controllers, gateways e presenters não podem conter regra de negócio.
- DTOs representam contratos de entrada e saída, não entidades de domínio.

## 14. Regras para módulos compartilhados

- Só compartilhar código quando houver reutilização real e estável.
- Shared não é local para despejar helpers sem dono.
- Utilitários compartilhados devem ser pequenos, puros e sem dependência de módulos de negócio.
- Contratos compartilhados devem ter versionamento quando consumidos por múltiplas aplicações.

## 15. Regras para imports entre módulos

- Importar apenas APIs públicas do módulo de destino.
- Não importar arquivos internos de outro módulo por caminho profundo.
- Evitar imports cruzados entre módulos de negócio.
- Quando dois módulos precisarem colaborar, usar application events, integration events ou ports.

## 16. Regras para evitar dependências circulares

- Circularidade entre módulos é falha arquitetural.
- Extrair contrato para camada mais interna quando houver dependência mútua.
- Usar eventos para comunicação assíncrona entre bounded contexts.
- Adicionar teste ou regra de lint para detectar ciclos.

## 17. Regras de nomenclatura

- Nomes devem revelar intenção de negócio.
- Evitar abreviações obscuras.
- Usar inglês no código e português na documentação de produto quando definido pelo time.
- Manter nomes consistentes entre domínio, banco, eventos e APIs.

## 18. Nomenclatura específica

- Arquivos: `kebab-case` com sufixo de responsabilidade, como `create-customer.use-case`.
- Pastas: `kebab-case` ou nomes de camada padronizados.
- Classes: `PascalCase`.
- Interfaces: `PascalCase`; usar sufixo `Port` para portas.
- Ports: `CustomerRepositoryPort`, `PaymentProviderPort`.
- Adapters: `PrismaCustomerRepositoryAdapter`, `RedisCacheAdapter`.
- Repositories: interface no application como port; implementação na infrastructure.
- Use cases: verbo + objeto + `UseCase`.
- Services: nome pelo papel, evitando `Manager` genérico.
- Controllers: recurso + `Controller`.
- DTOs: ação/recurso + `RequestDto` ou `ResponseDto`.
- Entities: substantivo de domínio.
- Value objects: conceito de valor, como `EmailAddress`.
- Events: fato no passado, como `CustomerCreatedEvent`.
- Listeners/handlers: evento + `Handler`.
- Workers: fila/contexto + `Worker`.
- Queues: domínio + ação, como `notifications.send`.
- Jobs: verbo + objeto, como `send-whatsapp-message`.
- Exceptions: causa + `Error` ou `Exception`, conforme camada.
- Error codes: `DOMAIN_REASON` em caixa alta e estáveis.
- Tests: arquivo alvo + `.spec` ou `.test`, conforme convenção do pacote.

## 19. Convenções TypeScript

- TypeScript deve ser usado com tipagem estrita.
- Preferir tipos explícitos em APIs públicas.
- Evitar coerções implícitas e efeitos colaterais escondidos.
- Usar imports type-only quando importar apenas tipos.

## 20. Uso de strict mode

- `strict` deve permanecer habilitado.
- Não desabilitar `strictNullChecks`, `noImplicitAny` ou regras equivalentes para contornar erro.
- Exceções exigem justificativa no PR.

## 21. Regras para tipos

- Tipos devem representar estados válidos do domínio.
- Evitar tipos amplos quando unions ou value objects forem mais precisos.
- APIs públicas devem evitar inferência ambígua.

## 22. Regras para evitar any

- `any` é proibido por padrão.
- Quando inevitável, restringir ao menor escopo, converter para `unknown` e validar antes de uso.
- Não propagar `any` para domínio ou contratos públicos.

## 23. Regras para unknown

- Usar `unknown` para entradas externas não confiáveis.
- Validar ou estreitar o tipo antes de acessar propriedades.
- Preferir schemas de validação para payloads externos.

## 24. Regras para enums

- Preferir unions literais para domínios pequenos e estáveis.
- Usar enums somente quando interoperabilidade, serialização ou integração exigir.
- Não reutilizar enum de banco como regra de domínio sem avaliação.

## 25. Regras para unions

- Usar discriminated unions para estados mutuamente exclusivos.
- Garantir tratamento exaustivo em fluxos críticos.
- Evitar unions grandes demais que escondam modelagem inadequada.

## 26. Regras para generics

- Usar generics para abstrações reais, não para antecipação especulativa.
- Nomear parâmetros genéricos com clareza quando houver mais de um.
- Restringir generics com bounds quando necessário.

## 27. Regras para null e undefined

- Escolher uma semântica consistente por camada.
- `undefined` representa ausência de valor não informado.
- `null` representa ausência explícita persistida ou retornada.
- Não usar ambos para o mesmo significado no mesmo contrato.

## 28. Regras para immutability

- Preferir objetos imutáveis para value objects, eventos e DTOs de saída.
- Mudanças de estado em entidades devem ocorrer por métodos que preservem invariantes.
- Evitar mutação compartilhada entre camadas.

## 29. Regras para readonly

- Usar `readonly` em propriedades que não devem mudar após construção.
- Eventos, value objects e configurações devem ser readonly por padrão.
- Não remover readonly para facilitar testes.

## 30. Regras para funções

- Funções devem ter responsabilidade única.
- Preferir funções pequenas, nomeadas e previsíveis.
- Evitar parâmetros booleanos que alterem comportamento de forma ambígua.
- Evitar efeitos colaterais sem nome explícito.

## 31. Regras para classes

- Classes devem encapsular estado ou comportamento relevante.
- Não criar classes anêmicas sem necessidade.
- Injeção de dependências deve ocorrer por interfaces/ports quando cruzar fronteiras.

## 32. Regras para interfaces

- Interfaces devem descrever contrato estável.
- Não criar interface para cada classe automaticamente.
- Ports são interfaces orientadas por casos de uso, não por tecnologia.

## 33. Regras para comentários

- Comentários explicam o porquê, não o óbvio.
- Comentários de workaround devem indicar contexto, prazo ou issue.
- Não deixar comentário enganoso ou desatualizado.

## 34. Regras para documentação

- Toda funcionalidade crítica deve ter documentação proporcional ao risco.
- APIs públicas devem documentar contrato, erros e autorização.
- Fluxos operacionais devem ter runbook quando causarem incidentes relevantes.

## 35. Regras para TODO e FIXME

- `TODO` e `FIXME` devem incluir motivo, responsável ou referência rastreável.
- Não usar TODO para dívida indefinida em código crítico.
- FIXME em segurança, tenant isolation ou dados deve bloquear merge se não houver exceção aprovada.

## 36. Regras para Controllers

- Controllers só adaptam protocolo para application layer.
- Devem delegar regras de negócio a use cases.
- Devem obter identidade, permissões, `organizationId` e correlation context sem misturar domínio.

## 37. Regras para DTOs

- DTOs são contratos de transporte.
- Devem conter validações estruturais, não decisões de negócio.
- Não passar DTOs diretamente para domínio quando houver transformação necessária.

## 38. Regras para validação de entrada

- Validar formato e tipos na borda.
- Validar invariantes de negócio no domínio.
- Rejeitar campos desconhecidos quando o contrato exigir rigidez.
- Sanitizar entradas usadas em busca, HTML, arquivos e integrações.

## 39. Regras para Use Cases

- Cada use case representa uma intenção de negócio.
- Deve receber input explícito, incluindo `organizationId` quando aplicável.
- Deve coordenar repositories, services, eventos e transações.
- Deve retornar resultado claro, sem expor entidades mutáveis desnecessariamente.

## 40. Regras para Application Services

- Devem agrupar orquestrações reutilizáveis por múltiplos use cases.
- Não devem virar depósito de regras sem coesão.
- Devem operar sobre ports e entidades de domínio.

## 41. Regras para Domain Services

- Usar quando uma regra de domínio não pertence naturalmente a uma entidade ou value object.
- Devem ser puros sempre que possível.
- Não acessar banco, fila, cache ou provider externo.

## 42. Regras para Entities

- Entidades possuem identidade e ciclo de vida.
- Devem proteger invariantes por métodos próprios.
- Não devem depender de DTOs, ORM ou controllers.

## 43. Regras para Aggregates

- Aggregate define fronteira de consistência transacional.
- Alterações internas devem passar pelo aggregate root.
- Evitar aggregates grandes que causem contenção ou carregamento excessivo.

## 44. Regras para Value Objects

- Devem ser imutáveis.
- Igualdade deve ser por valor.
- Devem validar sua própria consistência.
- Não devem conter dependências externas.

## 45. Regras para Domain Events

- Representam fatos relevantes já ocorridos no domínio.
- Devem ser imutáveis e conter dados mínimos necessários.
- Não devem carregar objetos enormes ou snapshots desnecessários.

## 46. Regras para Integration Events

- Representam contratos entre módulos, serviços ou sistemas externos.
- Devem ter versionamento quando consumidos fora do bounded context.
- Devem ser compatíveis com outbox quando houver persistência e publicação confiável.

## 47. Regras para Event Handlers

- Devem ser idempotentes.
- Devem tolerar eventos duplicados e fora de ordem.
- Devem separar handlers síncronos críticos de handlers assíncronos opcionais.

## 48. Regras para Repositories

- Repositories persistem e recuperam aggregates ou modelos de leitura.
- Não devem conter regra de negócio de domínio.
- Devem aplicar filtros tenant-aware obrigatórios.

## 49. Regras para Repository Ports

- Devem viver na application layer ou boundary equivalente.
- Devem falar a linguagem do caso de uso, não do ORM.
- Devem esconder detalhes de Prisma, SQL e transação concreta.

## 50. Regras para Adapters

- Adapters traduzem contratos internos para tecnologia externa.
- Devem mapear erros externos para erros padronizados.
- Devem conter métricas, logs seguros e timeouts quando houver I/O.

## 51. Regras para Prisma

- Prisma é detalhe de infraestrutura.
- Tipos gerados pelo Prisma não entram no domínio.
- Mapear modelos Prisma para entidades/value objects explicitamente.
- Evitar query dinâmica sem validação e sem limites.

## 52. Regras para migrations

- Migration deve ser pequena, revisável e compatível com rollback.
- Separar mudanças expansivas e contrativas quando necessário.
- Dados críticos exigem backup e plano de verificação.
- Migration destrutiva exige aprovação explícita.

## 53. Regras para transactions

- Usar transação para mudanças que precisam consistência atômica.
- Manter transações curtas.
- Não chamar providers externos dentro de transação quando puder ser evitado.
- Combinar transação com outbox para efeitos externos confiáveis.

## 54. Regras para Unit of Work

- Unit of Work deve coordenar repositories dentro da mesma transação.
- A application layer decide fronteira transacional.
- Infrastructure implementa o mecanismo concreto.

## 55. Regras para índices

- Índices devem refletir filtros reais, ordenações e unicidade.
- Campos `organizationId` frequentemente usados devem participar de índices compostos.
- Avaliar custo de escrita antes de adicionar índice.

## 56. Regras para queries

- Toda query em dado tenant-aware deve filtrar por `organizationId`.
- Toda query de lista deve ter limite.
- Queries críticas devem ser avaliadas por plano de execução quando necessário.

## 57. Regras para paginação

- Endpoints de lista devem paginar por padrão.
- Definir limite máximo por contrato.
- Retornar metadados suficientes para navegação.

## 58. Regras para cursor pagination

- Preferir cursor pagination para listas grandes ou altamente mutáveis.
- Cursor deve ser opaco para clientes.
- Ordenação deve ser estável e indexada.

## 59. Regras para evitar N+1

- Revisar loops que fazem I/O por item.
- Usar batch, joins controlados ou loaders quando apropriado.
- Testes de integração devem cobrir fluxos com múltiplos registros.

## 60. Regras para evitar full scan

- Não executar filtros amplos sem índice em tabelas grandes.
- Toda busca deve ter seletividade, limite e tenant filter.
- Full scan só é aceito em manutenção planejada com janela operacional.

## 61. Regras para selects mínimos

- Selecionar apenas campos necessários.
- Evitar retornar PII sem necessidade.
- Não buscar relações inteiras quando IDs ou campos resumidos bastarem.

## 62. Regras para joins

- Joins devem ser intencionais, indexados e revisados quanto à cardinalidade.
- Evitar joins que misturem tenants sem filtros explícitos.
- Para leituras complexas, considerar read models.

## 63. Regras para soft delete

- Soft delete deve ser consistente por entidade.
- Queries padrão devem ignorar registros removidos quando aplicável.
- Unicidade com soft delete deve ser planejada.

## 64. Regras para auditoria

- Registrar criação, atualização, exclusão lógica e ações sensíveis.
- Auditoria deve incluir ator, `organizationId`, timestamp e origem.
- Não armazenar segredos em trilhas de auditoria.

## 65. Regras multi-tenant

- `organizationId` é obrigatório em dados e operações tenant-aware.
- Nunca confiar apenas em parâmetro do cliente sem validar autorização.
- Testar isolamento entre organizações.

## 66. Uso obrigatório de organizationId

- Use cases tenant-aware devem receber `organizationId` explicitamente.
- Repositories devem exigir `organizationId` em métodos tenant-aware.
- Jobs e eventos tenant-aware devem carregar `organizationId` quando necessário para escopo.

## 67. Regras para isolamento de tenant

- Dados de um tenant não podem aparecer em respostas, logs, métricas ou jobs de outro.
- Operações administrativas cross-tenant exigem autorização especial e auditoria.
- Cache, locks e chaves Redis devem incluir escopo de tenant quando aplicável.

## 68. Regras para filtros tenant-aware

- Filtro por `organizationId` deve ser aplicado no nível mais baixo seguro, geralmente repository/query builder.
- Não aceitar filtro tenant opcional em endpoints comuns.
- Testar falha quando `organizationId` estiver ausente.

## 69. Regras para cache

- Cache acelera leitura, não substitui banco de dados.
- Definir TTL, chave, escopo tenant e política de invalidação.
- Dados sensíveis em cache exigem criptografia ou justificativa de risco.

## 70. Regras para Redis

- Chaves devem ter prefixo de aplicação, ambiente, módulo e tenant quando aplicável.
- Definir TTL para chaves temporárias.
- Evitar comandos bloqueantes em produção.
- Monitorar latência, memória e evictions.

## 71. Regras para BullMQ

- Filas são infraestrutura e devem ser acessadas por ports/application services.
- Jobs devem ser pequenos, idempotentes e rastreáveis.
- Configurar retries, backoff, DLQ e observabilidade.

## 72. Regras para filas

- Nomear filas por domínio e intenção.
- Separar filas críticas de filas best-effort.
- Definir concorrência e limites por fila.

## 73. Regras para workers

- Workers devem validar payload antes de processar.
- Workers devem ser idempotentes.
- Workers devem registrar sucesso, falha, duração e tentativas sem dados sensíveis.

## 74. Regras para payloads de jobs

- Payload deve carregar IDs pequenos e contexto mínimo.
- Não carregar snapshots grandes, PII desnecessária ou arquivos.
- Incluir `organizationId`, `jobId`, `correlationId` e versão quando aplicável.

## 75. Regras para retries

- Retry somente para erro transiente.
- Definir número máximo de tentativas.
- Não repetir erro de validação, autorização ou regra de negócio definitiva.

## 76. Regras para backoff

- Usar backoff exponencial com jitter para reduzir tempestades.
- Definir limites máximos de atraso.
- Documentar exceções para filas críticas.

## 77. Regras para DLQ

- Jobs esgotados devem ir para DLQ ou estado equivalente investigável.
- DLQ deve ter runbook de reprocessamento.
- Reprocessamento deve preservar idempotência.

## 78. Regras para idempotência

- Toda operação com efeito colateral deve considerar chave idempotente.
- Webhooks, jobs e integrações externas devem tolerar duplicidade.
- Persistir resultado ou marcador quando repetição puder causar dano.

## 79. Regras para locks distribuídos

- Usar locks somente quando consistência exigir.
- Lock deve ter TTL, owner e liberação segura.
- Não usar lock para esconder modelagem incorreta.

## 80. Regras para outbox pattern

- Usar outbox quando evento externo depender de transação de banco.
- Publicação deve ser assíncrona, observável e reprocessável.
- Eventos publicados devem ter ID único e estado de entrega.

## 81. Regras para eventos fora de ordem

- Handlers devem checar versão, timestamp ou estado atual antes de aplicar mudança.
- Eventos antigos não devem sobrescrever estado mais novo.
- Quando ordenação for obrigatória, documentar mecanismo de garantia.

## 82. Regras para deduplicação

- Eventos e jobs devem possuir IDs estáveis.
- Consumidores devem manter registro de processamento quando duplicidade causar impacto.
- Deduplicação deve respeitar tenant e tipo de evento.

## 83. Regras para webhooks

- Validar assinatura e origem sempre que provider oferecer mecanismo.
- Responder rápido e processar pesado em fila.
- Garantir idempotência por event ID do provider.
- Registrar tentativas sem payload sensível.

## 84. Regras para integrações externas

- Toda integração deve passar por port e adapter.
- Definir timeout, retry, rate limit, circuit breaker e mapeamento de erro.
- Não espalhar SDK externo fora da infrastructure.

## 85. Regras para provider adapters

- Adapter deve encapsular autenticação, endpoint, payload e resposta do provider.
- Deve converter contrato externo para contrato interno.
- Deve lidar com versionamento do provider.

## 86. Regras para timeouts

- Toda chamada externa deve ter timeout explícito.
- Timeout deve ser menor que o timeout do request pai.
- Timeouts devem ser configuráveis por ambiente.

## 87. Regras para retries externos

- Retry externo deve ocorrer apenas em erros transitórios.
- Usar jitter e limite de tentativas.
- Não retry em erro 4xx definitivo, exceto casos documentados como rate limit.

## 88. Regras para circuit breaker

- Usar circuit breaker para providers críticos instáveis ou caros.
- Definir estado aberto, meio aberto e fechado com métricas.
- Fornecer fallback seguro quando possível.

## 89. Regras para rate limit

- Aplicar rate limit em endpoints públicos e integrações sensíveis.
- Rate limit deve considerar tenant, usuário, IP ou provider conforme risco.
- Retornar erro padronizado quando limite for excedido.

## 90. Regras para secrets

- Secrets nunca entram em código, logs, commits ou documentação pública.
- Usar gerenciador de secrets ou variáveis protegidas.
- Rotacionar secrets comprometidos imediatamente.

## 91. Regras para variáveis de ambiente

- Toda variável deve ter nome, descrição, obrigatoriedade e exemplo seguro.
- Validar configuração no startup.
- Valores ausentes devem falhar rápido quando críticos.

## 92. Regras para configuração

- Configuração deve ser centralizada e tipada.
- Não ler `process.env` de forma espalhada pelo código.
- Separar configuração por ambiente sem divergência semântica.

## 93. Regras para segurança

- Segurança é requisito de arquitetura, não etapa final.
- Aplicar menor privilégio.
- Validar entrada, autorização e escopo em todas as bordas.
- Proteger dados sensíveis em trânsito e repouso.

## 94. Regras OWASP

- Mitigar riscos OWASP aplicáveis: broken access control, injection, authentication failures, insecure design, misconfiguration, vulnerable components e logging inadequado.
- Revisar endpoints novos contra checklist OWASP.
- Dependências vulneráveis devem bloquear release conforme severidade.

## 95. Regras para autenticação

- Autenticação deve ser aplicada antes de acessar recursos protegidos.
- Tokens devem ser validados quanto a assinatura, expiração e emissor.
- Falhas de autenticação não devem revelar detalhes sensíveis.

## 96. Regras para autorização

- Autorização deve verificar ação, recurso, tenant e ator.
- Não confiar apenas em esconder botão no frontend.
- Casos sensíveis exigem teste negativo.

## 97. Regras para RBAC

- RBAC define permissões por papel quando suficiente.
- Papéis devem ser versionados e documentados.
- Mudanças em permissões exigem testes de regressão.

## 98. Regras para ABAC

- ABAC deve ser usado quando atributos de recurso, ator, tenant ou contexto influenciarem decisão.
- Políticas devem ser testáveis e auditáveis.
- Evitar políticas implícitas espalhadas.

## 99. Regras para PII

- Coletar apenas PII necessária.
- Classificar campos sensíveis.
- Limitar exposição por API, logs, eventos e exports.

## 100. Regras para LGPD

- Respeitar finalidade, minimização, retenção e direitos do titular.
- Registrar base legal quando aplicável.
- Implementar processos para exclusão, anonimização ou exportação de dados quando exigido.

## 101. Regras para criptografia

- Usar TLS para dados em trânsito.
- Criptografar dados sensíveis em repouso quando risco exigir.
- Não criar criptografia caseira.

## 102. Regras para masking

- Aplicar masking em logs, auditoria e telas quando dado completo não for necessário.
- Exemplos conceituais: exibir apenas últimos dígitos de telefone ou email parcialmente mascarado.
- Masking não substitui autorização.

## 103. Regras para sanitização

- Sanitizar entradas usadas em HTML, markdown, busca e comandos externos.
- Prevenir injection em SQL, NoSQL, shell, HTML e templates.
- Preferir APIs parametrizadas.

## 104. Regras para uploads

- Validar tipo, tamanho, extensão e conteúdo quando possível.
- Escanear malware quando risco justificar.
- Não servir upload com permissão pública por padrão.

## 105. Regras para arquivos

- Armazenar metadados mínimos e seguros.
- Controlar acesso por tenant e usuário.
- Definir retenção e exclusão.

## 106. Regras para storage

- Storage externo deve ser acessado por adapter.
- URLs assinadas devem ter expiração curta.
- Buckets/containers devem negar acesso público por padrão.

## 107. Regras para logs

- Logs devem ser estruturados.
- Logs devem ajudar diagnóstico sem vazar dados.
- Níveis devem ser consistentes: debug, info, warn, error, fatal.

## 108. Formato obrigatório de logs

Logs devem ser eventos estruturados em formato parseável, preferencialmente JSON, com nomes de campos estáveis e valores sanitizados.

## 109. Campos obrigatórios de log

Quando disponíveis, incluir:

- timestamp
- level
- message
- service
- environment
- module
- operation
- organizationId
- userId ou actorId
- correlationId
- traceId
- requestId
- eventId ou jobId
- errorCode
- durationMs

## 110. Regras para não logar dados sensíveis

- Não logar tokens, passwords, cookies, secrets, payload integral de webhook, documentos, dados financeiros ou mensagens privadas.
- Aplicar allowlist de campos logáveis.
- Sanitizar erro antes de expor ao cliente.

## 111. Regras para correlationId

- Toda requisição deve criar ou propagar `correlationId`.
- Jobs e eventos derivados devem carregar o mesmo correlationId quando fizer sentido.
- Logs devem incluir correlationId.

## 112. Regras para traceId

- `traceId` deve integrar tracing distribuído.
- Deve ser propagado para chamadas externas quando seguro.
- Não confundir traceId com identificador de negócio.

## 113. Regras para requestId

- Cada request HTTP/WebSocket/SSE deve possuir requestId único.
- requestId identifica uma interação técnica específica.
- Deve aparecer em logs de entrada, saída e erro.

## 114. Regras para eventId

- Eventos devem possuir eventId único e estável.
- eventId deve apoiar deduplicação, rastreabilidade e auditoria.
- Reprocessamentos devem preservar eventId original quando adequado.

## 115. Regras para observabilidade

- Novas funcionalidades críticas devem emitir logs, métricas e traces proporcionais ao risco.
- Observar latência, taxa de erro, throughput e saturação.
- Alertas devem ser acionáveis.

## 116. Regras para métricas

- Métricas devem ter nomes estáveis e baixa cardinalidade.
- Incluir tags como ambiente, serviço, módulo e operação.
- Evitar tags com PII, IDs únicos ou valores de alta cardinalidade.

## 117. Regras para tracing

- Criar spans em operações I/O, use cases críticos e workers.
- Propagar contexto entre HTTP, eventos e filas.
- Não anexar payload sensível ao span.

## 118. Regras para health checks

- Health checks devem representar estado técnico do serviço.
- Separar liveness de readiness.
- Incluir dependências críticas conforme ambiente.

## 119. Regras para readiness

- Readiness indica capacidade de receber tráfego.
- Deve falhar se dependências essenciais estiverem indisponíveis.
- Deve ser usada por orquestradores antes de rotear tráfego.

## 120. Regras para liveness

- Liveness indica se processo está vivo e recuperável.
- Não deve depender de todos os providers externos.
- Deve evitar reinícios em cascata por falha transitória externa.

## 121. Estratégia de tratamento de erros

- Erros devem ser tipados, rastreáveis e mapeados para resposta segura.
- Separar erro esperado de bug inesperado.
- Não expor stack trace ao cliente.

## 122. Tipos de erro

Categorias obrigatórias: business, validation, authentication, authorization, not found, conflict, rate limit, external provider, infrastructure, retryable e non-retryable.

## 123. Business errors

- Representam violação de regra de negócio.
- Devem ter código estável e mensagem segura.
- Geralmente não são retryable.

## 124. Validation errors

- Representam entrada inválida.
- Devem indicar campo, motivo e código.
- Não devem executar efeitos colaterais.

## 125. Authentication errors

- Representam ausência ou invalidade de identidade.
- Devem retornar resposta genérica.
- Não revelar se usuário existe.

## 126. Authorization errors

- Representam falta de permissão.
- Devem considerar tenant, recurso e ação.
- Devem ser auditáveis em operações sensíveis.

## 127. Not found errors

- Podem esconder existência de recurso quando segurança exigir.
- Devem respeitar tenant isolation.
- Não devem vazar IDs de outro tenant.

## 128. Conflict errors

- Representam concorrência, unicidade ou estado incompatível.
- Devem orientar ação segura do cliente.
- Podem ser retryable somente quando conflito for transitório.

## 129. Rate limit errors

- Devem retornar código estável e informação segura de tentativa futura quando aplicável.
- Não devem revelar política interna completa.
- Devem ser monitorados.

## 130. External provider errors

- Devem encapsular erro do provider sem vazar payload sensível.
- Devem indicar retryable ou non-retryable.
- Devem preservar referência segura para suporte.

## 131. Infrastructure errors

- Representam falha de banco, cache, fila, rede ou storage.
- Devem gerar log e métrica.
- Podem acionar retry conforme classificação.

## 132. Retryable errors

- Erros transitórios podem ser repetidos com limite e backoff.
- Marcar claramente retryable no contrato interno.
- Não repetir quando efeito colateral não for idempotente.

## 133. Non-retryable errors

- Erros definitivos não devem ser repetidos automaticamente.
- Devem ir para falha final, DLQ ou resposta ao cliente conforme fluxo.
- Exemplos conceituais: validação inválida e permissão negada.

## 134. Error codes padronizados

- Códigos devem ser estáveis, documentados e legíveis.
- Formato recomendado: `AREA_REASON`, por exemplo `AUTH_FORBIDDEN`.
- Não reutilizar código para significados diferentes.

## 135. Formato padrão de resposta de erro

Resposta de erro deve conter, no mínimo conceitual:

- `code`
- `message` segura
- `correlationId` ou `requestId`
- `details` sanitizado quando aplicável

## 136. Mapeamento de erro para HTTP

- Validation: 400 ou 422 conforme contrato.
- Authentication: 401.
- Authorization: 403.
- Not found: 404.
- Conflict: 409.
- Rate limit: 429.
- Erro inesperado: 500 com mensagem genérica.
- Provider indisponível: 502, 503 ou 504 conforme causa.

## 137. Estratégia de testes

- Testes devem ser proporcionais ao risco e à criticidade.
- Priorizar domínio, autorização, multi-tenant, idempotência e integrações.
- Bugs corrigidos devem receber teste de regressão.

## 138. Pirâmide de testes

- Base ampla de unit tests.
- Camada intermediária de integration e contract tests.
- Menor quantidade de E2E, smoke, load e security tests focados em fluxos críticos.

## 139. Unit tests

- Devem testar domínio e use cases sem infraestrutura real.
- Devem ser rápidos e determinísticos.
- Não depender de ordem global ou tempo real sem clock controlado.

## 140. Integration tests

- Devem validar adapters, banco, cache, filas e integrações internas.
- Usar ambiente isolado e dados controlados.
- Cobrir queries tenant-aware e transações críticas.

## 141. Contract tests

- Devem proteger contratos REST, eventos, webhooks e providers.
- Mudanças incompatíveis exigem versionamento ou migração.
- Consumidores críticos devem ser considerados.

## 142. E2E tests

- Devem cobrir jornadas principais de usuário e negócio.
- Devem ser estáveis, poucos e valiosos.
- Não substituir unit e integration tests.

## 143. Smoke tests

- Devem validar saúde básica após deploy.
- Devem ser rápidos e seguros em produção.
- Não devem criar dados sensíveis sem limpeza.

## 144. Load tests

- Devem validar endpoints e workers críticos sob carga esperada.
- Devem ter ambiente e massa de dados representativos.
- Resultados devem orientar budgets.

## 145. Security tests

- Devem cobrir autenticação, autorização, injection, upload, secrets e tenant isolation.
- Vulnerabilidades críticas bloqueiam release.
- Dependências devem ser auditadas no pipeline.

## 146. Testes multi-tenant

- Testar acesso permitido no tenant correto.
- Testar negação entre tenants diferentes.
- Testar queries, cache, jobs, eventos e exports com `organizationId`.

## 147. Testes de idempotência

- Reexecutar operação com mesma chave e verificar efeito único.
- Cobrir jobs, webhooks e providers.
- Verificar concorrência quando duplicidade simultânea for possível.

## 148. Testes de concorrência

- Testar conflitos de atualização, locks e transações críticas.
- Validar comportamento sob duplicidade de requests.
- Verificar ausência de double charge, double send ou double state transition.

## 149. Testes de filas

- Cobrir sucesso, retry, falha final, DLQ e payload inválido.
- Verificar que jobs carregam dados mínimos.
- Validar métricas e logs sem dados sensíveis quando possível.

## 150. Testes de webhooks

- Validar assinatura, idempotência, payload inválido, duplicidade e ordem.
- Responder rapidamente e mover processamento pesado para fila.
- Testar eventos desconhecidos com comportamento seguro.

## 151. Testes de migrations

- Validar aplicar e reverter quando suportado.
- Testar compatibilidade com dados existentes.
- Verificar tempo estimado e locks em tabelas grandes.

## 152. Testes de providers

- Usar contract tests e fakes confiáveis.
- Não depender de sandbox externo em unit tests.
- Cobrir timeout, retry, rate limit e erro do provider.

## 153. Cobertura mínima recomendada

- Recomenda-se cobertura mínima geral de 80% em código crítico.
- Domínio e application layer críticos devem buscar cobertura maior.
- Cobertura não substitui qualidade dos asserts.

## 154. Regras para mocks

- Mockar dependências externas ao comportamento sob teste.
- Não mockar a própria lógica que deveria ser validada.
- Evitar mocks frágeis baseados em detalhes internos.

## 155. Regras para fakes

- Fakes devem simular comportamento relevante com fidelidade suficiente.
- Devem ser mantidos junto aos contratos que representam.
- Não usar fake que esconda falhas de integração crítica.

## 156. Regras para test doubles

- Escolher stub, mock, fake ou spy conforme objetivo.
- Nomear test doubles de forma explícita.
- Manter test doubles simples e determinísticos.

## 157. Regras para dados de teste

- Dados de teste devem ser mínimos e claros.
- Não usar dados reais de clientes.
- Incluir cenários de tenant diferente e permissões negativas.

## 158. Regras para fixtures

- Fixtures devem representar contratos estáveis.
- Evitar fixtures enormes e difíceis de entender.
- Versionar fixtures de provider quando contrato mudar.

## 159. Regras para factories

- Factories devem criar dados válidos por padrão.
- Permitir override explícito para casos inválidos.
- Não esconder regras importantes em factory complexa.

## 160. Regras para snapshots

- Usar snapshots com parcimônia.
- Snapshots não devem conter dados sensíveis.
- Revisar mudanças de snapshot manualmente.

## 161. Estratégia de performance

- Performance deve ser considerada no design, não apenas após incidente.
- Medir antes de otimizar.
- Proteger rotas, queries e workers críticos com budgets.

## 162. Budgets de performance

- Definir orçamento de latência por endpoint crítico.
- Definir orçamento de tempo por job crítico.
- Revisar budgets com métricas reais.

## 163. Limites de query

- Toda query de lista deve ter limite máximo.
- Queries críticas devem ser indexadas.
- Operações analíticas pesadas devem ser isoladas.

## 164. Limites de payload

- Definir tamanho máximo de request e response.
- Rejeitar payloads grandes antes de processamento caro.
- Jobs não devem carregar snapshots grandes.

## 165. Limites de paginação

- Definir default e máximo por endpoint.
- Cursor pagination é preferida para grandes volumes.
- Não permitir paginação ilimitada.

## 166. Limites de timeout

- Definir timeout para HTTP, banco, cache, fila e providers.
- Timeout de operação filha deve caber no timeout do fluxo pai.
- Timeouts devem ser observáveis.

## 167. Limites de memória

- Evitar carregar grandes volumes em memória.
- Usar streaming ou paginação para exports.
- Monitorar workers que processam lotes.

## 168. Limites de concorrência

- Definir concorrência por worker e provider.
- Proteger recursos compartilhados com rate limit ou lock quando necessário.
- Evitar fan-out sem limite.

## 169. Regras para processamento em lote

- Processar em chunks com checkpoint.
- Permitir reprocessamento idempotente.
- Não bloquear requests síncronos com lote pesado.

## 170. Regras para streaming

- Usar streaming para payloads grandes quando apropriado.
- Controlar backpressure.
- Encerrar streams com tratamento de erro e limpeza.

## 171. Regras para exportações

- Exportações grandes devem ser assíncronas.
- Aplicar autorização e filtro tenant-aware.
- Mascarar PII conforme necessidade.
- Definir expiração de arquivos exportados.

## 172. Regras para operações pesadas

- Mover operações pesadas para fila ou job assíncrono.
- Fornecer status consultável.
- Aplicar limites, cancelamento e observabilidade.

## 173. Estratégia de frontend

- Frontend deve respeitar autorização, UX consistente, acessibilidade e segurança.
- Next.js deve seguir a documentação da versão instalada no projeto.
- O App Router é baseado em roteamento por arquivos e usa Server Components, Suspense e Server Functions conforme documentação local do Next.js.

## 174. Organização do frontend Next.js

- Separar rotas, componentes, hooks, services, validações e estilos.
- Manter lógica de negócio crítica no backend.
- Evitar duplicar regras de autorização como única barreira.
- Usar boundaries de erro e loading states por rota crítica.

## 175. Regras para componentes

- Componentes devem ser pequenos, compostos e testáveis.
- Componentes visuais não devem acessar providers diretamente.
- Props devem ser tipadas e mínimas.

## 176. Regras para Server Components

- Preferir Server Components para leitura e renderização sem interatividade local.
- Não usar APIs de browser em Server Components.
- Proteger dados sensíveis antes de enviar ao cliente.

## 177. Regras para Client Components

- Usar Client Components somente quando houver estado, evento de browser ou API cliente.
- Marcar fronteira cliente de forma intencional.
- Não colocar secrets ou regra crítica no bundle do cliente.

## 178. Regras para hooks

- Hooks devem encapsular estado e efeitos de UI.
- Não esconder chamada insegura ou regra de autorização crítica em hook.
- Hooks compartilhados devem ser genéricos e bem testados.

## 179. Regras para services de frontend

- Services de frontend devem chamar APIs por contratos tipados.
- Devem tratar erro padronizado e correlation/request context quando disponível.
- Não acessar banco, Redis ou providers diretamente.

## 180. Regras para estado global

- Usar estado global somente para estado realmente compartilhado.
- Preferir estado local ou cache de query para dados remotos.
- Não armazenar secrets ou PII desnecessária em estado global persistente.

## 181. Regras para cache de frontend

- Cache de frontend deve ter política clara de invalidação.
- Não assumir cache como autorização.
- Dados sensíveis não devem ser persistidos sem necessidade.

## 182. Regras para formulários

- Formulários devem validar no cliente para UX e no backend para segurança.
- Mensagens devem ser claras e acessíveis.
- Submissões com efeito colateral devem lidar com duplicidade.

## 183. Regras para validação no frontend

- Validação frontend melhora UX, mas não substitui validação backend.
- Manter schemas alinhados com contrato de API quando possível.
- Sanitizar entradas exibidas em HTML.

## 184. Regras para acessibilidade

- Páginas devem ter título único e descritivo.
- Componentes interativos devem ser navegáveis por teclado.
- Usar atributos ARIA corretamente e preferir HTML semântico.
- Respeitar contraste, foco visível e redução de movimento.

## 185. Regras para responsividade

- Interfaces devem funcionar em tamanhos suportados pelo produto.
- Não esconder ação essencial em viewport menor.
- Testar estados com conteúdo longo e internacionalização futura.

## 186. Regras para design system

- Preferir componentes do design system aprovado.
- Não criar variações visuais sem necessidade.
- Estados de erro, loading, disabled e empty devem ser consistentes.

## 187. Regras para permissões no frontend

- Frontend pode ocultar ações por UX, mas backend decide autorização.
- Permissões devem vir de contrato confiável.
- Testar ausência de permissão em UI e API.

## 188. Regras para tratamento de erros no frontend

- Mostrar mensagens seguras e acionáveis.
- Registrar contexto técnico sem PII.
- Usar boundaries para falhas inesperadas.

## 189. Regras para loading e empty states

- Toda tela assíncrona deve ter loading state.
- Listas vazias devem orientar próxima ação quando aplicável.
- Evitar skeletons enganosos em operações rápidas.

## 190. Regras para segurança no frontend

- Não expor secrets no bundle.
- Prevenir XSS com escape, sanitização e evitar HTML bruto.
- Proteger rotas client-side sem substituir proteção server-side.

## 191. Estratégia Git

- Histórico deve ser compreensível e rastreável.
- Commits devem representar unidades lógicas.
- Mudanças grandes devem ser divididas.

## 192. Branch strategy

- Usar branch curta por tarefa.
- Branch principal deve permanecer sempre deployable.
- Hotfix pode sair de tag ou branch de produção conforme processo.

## 193. Convenção de nomes de branch

- Formato recomendado: `type/short-description`.
- Exemplos conceituais: `feature/customer-import`, `fix/webhook-retry`, `docs/engineering-standards`.

## 194. Conventional Commits

- Usar Conventional Commits.
- Tipos comuns: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.
- Escopo deve indicar módulo quando útil.

## 195. Pull Requests

- PR deve ter objetivo, contexto, mudanças, testes e riscos.
- PR deve ser pequeno o suficiente para revisão efetiva.
- PR que altera arquitetura deve citar ADR/RFC quando aplicável.

## 196. Tamanho máximo recomendado de PR

- Recomendado até 400 linhas alteradas para revisão normal.
- Acima disso, justificar e dividir quando possível.
- PRs grandes exigem checklist mais rigoroso.

## 197. Checklist de PR

- Objetivo claro.
- Escopo limitado.
- Testes executados.
- Riscos e rollback descritos.
- Segurança e multi-tenant revisados.
- Observabilidade considerada.
- Documentação atualizada.

## 198. Regras de code review

- Revisar arquitetura, segurança, testes, legibilidade e operação.
- Comentários devem ser objetivos e respeitosos.
- Autor deve responder ou aplicar cada comentário.

## 199. Critérios de aprovação

- Todos os checks obrigatórios passam.
- Pelo menos um aprovador qualificado aprova.
- Mudanças sensíveis exigem aprovador de domínio ou segurança.
- Não há comentários bloqueantes abertos.

## 200. Regras para merge

- Merge somente após CI verde e aprovações necessárias.
- Não fazer merge de código com segredos ou testes críticos falhando.
- Preferir squash ou merge conforme política do repositório.

## 201. Regras para hotfix

- Hotfix deve ser mínimo, testado e rastreável.
- Após produção, portar correção para branches relevantes.
- Criar postmortem quando incidente justificar.

## 202. Regras para release

- Release deve ter changelog, versão e plano de rollback.
- Validar migrations, feature flags e compatibilidade.
- Executar smoke tests pós-deploy.

## 203. Versionamento semântico

- Usar SemVer quando houver pacote, API ou contrato versionado.
- Breaking changes exigem versão major ou plano de migração.
- Correções compatíveis usam patch.

## 204. Changelog

- Changelog deve destacar mudanças relevantes para usuários, operações e integrações.
- Incluir breaking changes, migrations e ações manuais.
- Não incluir detalhes internos irrelevantes.

## 205. Feature flags

- Usar feature flags para rollout gradual e risco operacional.
- Flags devem ter dono e data de remoção prevista.
- Não deixar flags antigas sem governança.

## 206. Estratégia de deploy

- Deploy deve ser automatizado, auditável e reversível quando possível.
- Separar build, migration e rollout.
- Monitorar métricas e logs após deploy.

## 207. Ambientes

- `local`: desenvolvimento individual, dados sintéticos.
- `development`: integração contínua de funcionalidades.
- `staging`: validação próxima de produção.
- `production`: ambiente de clientes reais, com controles máximos.

## 208. Regras para CI

- CI deve executar lint, format check, typecheck, testes e build conforme pacote.
- CI deve bloquear merge quando quality gates falharem.
- CI não deve depender de secrets de produção.

## 209. Regras para CD

- CD deve ser rastreável por commit e versão.
- Deploy em produção deve exigir gates definidos.
- Rollback deve ser documentado e testado.

## 210. Quality gates

- Lint sem erro.
- Formatação consistente.
- Typecheck sem erro.
- Testes obrigatórios verdes.
- Build aprovado.
- Segurança e dependências sem vulnerabilidade bloqueante.

## 211. Regras para lint

- Lint deve reforçar estilo, imports, ciclos e práticas inseguras.
- Não desabilitar regra sem justificativa local.
- Warnings críticos devem ser tratados como falha no pipeline quando configurado.

## 212. Regras para format

- Formatação deve ser automatizada.
- Não discutir estilo manual em code review quando ferramenta define padrão.
- Arquivos gerados devem seguir política própria.

## 213. Regras para typecheck

- Typecheck deve rodar no CI.
- Erro de tipo bloqueia merge.
- Não usar casts para esconder contrato incorreto.

## 214. Regras para build

- Build deve ser reproduzível.
- Build não deve depender de estado local não versionado.
- Artefatos devem ser identificáveis por commit.

## 215. Regras para testes no pipeline

- Pipeline deve executar testes proporcionais ao tipo de mudança.
- Testes lentos podem rodar em estágio separado, mas não devem ser ignorados para release crítico.
- Falhas intermitentes devem ser corrigidas, não aceitas como normais.

## 216. Regras para migrations no deploy

- Migrations devem rodar em etapa controlada.
- Avaliar compatibilidade backward/forward em deploy gradual.
- Rollback de aplicação deve considerar estado do banco.

## 217. Regras para rollback

- Toda mudança relevante deve ter estratégia de rollback.
- Rollback deve considerar migrations, filas, cache e eventos.
- Feature flags podem ser mecanismo preferencial quando adequado.

## 218. Regras para backup

- Dados críticos devem ter backup automatizado e monitorado.
- Testar restauração periodicamente.
- Backups devem ser protegidos e criptografados conforme sensibilidade.

## 219. Regras para disaster recovery

- Definir RPO e RTO por ambiente crítico.
- Manter runbook de recuperação.
- Testar cenários de perda de banco, fila, cache e provider crítico.

## 220. Regras para documentação técnica

- Documentação deve ser versionada junto ao código quando possível.
- Documentos devem ter objetivo, escopo, decisão e impactos.
- Documentação obsoleta deve ser atualizada ou removida.

## 221. ADRs

- ADRs registram decisões arquiteturais significativas.
- Devem conter contexto, decisão, alternativas e consequências.
- ADR aceito deve ser respeitado até substituição formal.

## 222. RFCs

- RFCs devem ser usados para mudanças grandes ou ambíguas.
- Devem coletar feedback antes da implementação.
- RFC aprovada pode originar ADRs e tarefas.

## 223. Runbooks

- Runbooks descrevem operação recorrente ou recuperação técnica.
- Devem conter pré-requisitos, passos, validação e rollback.
- Devem ser testados por alguém além do autor quando críticos.

## 224. Playbooks de incidente

- Playbooks orientam resposta rápida por tipo de incidente.
- Devem incluir severidade, comunicação, mitigação e escalonamento.
- Devem evitar comandos destrutivos sem confirmação explícita.

## 225. Postmortems

- Postmortems devem ser sem culpa e focados em aprendizado.
- Devem conter linha do tempo, impacto, causas, ações e donos.
- Ações devem ser acompanhadas até conclusão.

## 226. Definition of Ready

Uma tarefa está pronta quando possui objetivo, escopo, critérios de aceite, dependências, riscos conhecidos, impacto multi-tenant e expectativa de testes.

## 227. Definition of Done

Uma tarefa está concluída quando código, testes, documentação, observabilidade, segurança, revisão e deploy/rollback foram tratados conforme risco.

## 228. Checklist obrigatório antes de iniciar uma implementação

- Entendi domínio, tenant e permissões?
- Há ADR/RFC necessário?
- Sei quais camadas serão alteradas?
- Identifiquei efeitos colaterais e idempotência?
- Planejei testes proporcionais ao risco?
- Avaliei observabilidade e performance?

## 229. Checklist obrigatório antes de criar um PR

- Escopo está limitado?
- Lint, format, typecheck, testes e build relevantes passam?
- `organizationId` foi aplicado em operações tenant-aware?
- Logs estão sem PII e secrets?
- Erros têm códigos estáveis?
- Documentação foi atualizada?

## 230. Checklist obrigatório antes de fazer merge

- CI verde.
- Aprovações necessárias.
- Comentários bloqueantes resolvidos.
- Segurança, multi-tenant e rollback revisados.
- Feature flags e migrations revisadas quando aplicável.

## 231. Checklist obrigatório antes de deploy em produção

- Release notes/changelog preparados.
- Migrations avaliadas e backup confirmado.
- Plano de rollback conhecido.
- Smoke tests definidos.
- Métricas, logs e alertas acompanhados.

## 232. Anti-patterns proibidos

- God service ou manager genérico.
- Domínio anêmico com regra espalhada em controllers.
- Repository com regra de negócio.
- DTO usado como entidade.
- Dependência circular entre módulos.
- Query sem `organizationId` em dado tenant-aware.
- Retry infinito.
- Log de payload sensível.
- Provider SDK espalhado fora de adapter.

## 233. Exemplos de violações arquiteturais

- Entidade importando decorator NestJS.
- Use case chamando Prisma diretamente quando existe repository port.
- Controller decidindo se cliente pode ser criado por regra de negócio.
- Worker processando job sem idempotência.
- Cache Redis usado como única fonte para dado crítico.
- Evento carregando snapshot completo com PII.

## 234. Processo de exceção aos padrões

- Exceções exigem justificativa escrita, escopo, prazo e aprovador.
- Exceção deve explicar risco e mitigação.
- Exceção temporária deve ter tarefa de remoção.
- Segurança e tenant isolation exigem aprovação reforçada.

## 235. Governança do documento

- Este documento é obrigatório para novas implementações.
- Divergências devem ser resolvidas por ADR, RFC ou atualização deste manual.
- Revisões devem ocorrer periodicamente ou após incidentes relevantes.

## 236. Versionamento do documento

- Mudanças neste documento devem usar PR próprio quando significativas.
- Alterações incompatíveis com práticas atuais devem indicar plano de adoção.
- Histórico Git é a fonte de versionamento.

## 237. Responsável pela manutenção dos padrões

- A liderança técnica do Impulse CRM é responsável por manter estes padrões.
- Cada time contribui com melhorias e evidências práticas.
- Segurança, dados e operações devem revisar seções de alto risco.

## 238. Como atualizar os padrões

- Propor mudança por PR com motivação objetiva.
- Citar incidentes, ADRs, RFCs ou aprendizados quando aplicável.
- Diferenciar regra obrigatória de recomendação.
- Atualizar checklists impactados.

## 239. Resumo executivo final

O Impulse CRM deve evoluir com arquitetura limpa, domínio protegido, fronteiras explícitas, segurança por padrão, isolamento multi-tenant rigoroso, performance observável e testes proporcionais ao risco. Código futuro deve depender de abstrações internas, tratar efeitos colaterais com idempotência, evitar vazamento de dados sensíveis e manter operações previsíveis. Estes padrões são o contrato mínimo para escrever, revisar, testar, documentar e operar software no Impulse CRM.
