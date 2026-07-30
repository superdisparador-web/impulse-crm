# Auditoria — WhatsApp e Conexões

## Escopo auditado

Foram revisadas as rotas `/whatsapp` e `/connections`, os componentes de `components/whatsapp` e `components/connections`, o serviço e os tipos de WhatsApp, o menu lateral, autenticação/RBAC e todos os contratos HTTP referenciados no frontend.

## Inventário anterior à unificação

- **Duplicado:** listagem de contas, carregamento/polling, criação e edição por formulário técnico, arquivamento, ativação/desativação, teste e sincronização.
- **Exclusivo de WhatsApp:** filtros ativos/arquivados, restauração, definição da conta padrão, paginação via API e visualização do caminho do webhook.
- **Exclusivo de Conexões:** indicadores operacionais, qualidade e tier da Meta, busca e filtros locais, CSV, visualização em cards, painel detalhado, atualização automática e RBAC explícito.
- **Dados reais disponíveis:** status, qualidade, limite/tier, última sincronização, último teste, erro de conexão, inscrição do webhook, identificadores Meta, número, token configurado e final mascarado. Envio diário, latência e histórico de webhook não têm contrato; portanto, não são apresentados como métricas.
- **Ações existentes:** atualizar, editar, testar, sincronizar, ativar/desativar, tornar padrão, arquivar e restaurar. Todas permanecem disponíveis na experiência unificada, respeitando RBAC.
- **Contratos existentes:** `GET/POST /whatsapp/accounts`, `PATCH/DELETE /whatsapp/accounts/:id` e as ações `status`, `default`, `test-connection`, `sync` e `restore`; templates usam `/whatsapp/templates` e `/whatsapp/templates/sync`.

Não havia no frontend um fluxo funcional de Embedded Signup, callback OAuth, troca de authorization code ou armazenamento de tokens. O formulário manual enviava `accessToken` à API. Esse formulário deixou de ser um caminho de criação.

## Arquitetura unificada

- `/whatsapp` é a única tela e `/connections` executa redirect de servidor para ela.
- A criação chama `POST /whatsapp/embedded-signup/session`. O backend retorna somente uma URL oficial, temporária, da Meta; o navegador não recebe token, App Secret ou verify token.
- A sessão de signup deve vincular, no backend, `state`, organização, usuário, URL de retorno e expiração. O callback do backend é responsável por consumir o code uma única vez, trocar tokens, descobrir Business/WABA/Phone IDs, fazer upsert isolado por organização, assinar a WABA, configurar webhooks, testar, sincronizar conta/número/templates e persistir credenciais criptografadas.
- O backend retorna o usuário para `/whatsapp?signup=success` ou para um dos códigos seguros: `cancelled`, `permission_denied`, `no_business`, `no_waba`, `phone_in_use`, `failed`. Detalhes técnicos nunca são exibidos.
- O endpoint deve rejeitar state inválido/expirado, code já consumido, callback sem HTTPS fora do ambiente local e qualquer divergência de organização. Logs devem omitir query strings, authorization codes e credenciais.

## RBAC e segredos

Administradores da organização podem conectar e operar contas. Somente `GLOBAL_ADMIN` acessa configurações avançadas e edição operacional. Mesmo nessa área, App ID e identificadores são mascarados; App Secret, access token e verify token não são renderizados. A edição não aceita credenciais nem identificadores Meta.
