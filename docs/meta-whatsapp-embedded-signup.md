# WhatsApp Embedded Signup — operação do Impulse CRM

> Auditoria em 30/07/2026. Referências normativas: somente documentação oficial da Meta: [Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup/), [Implementation](https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation/), [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/), [Tech Providers](https://developers.facebook.com/docs/whatsapp/solution-providers/tech-providers/) e [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions/). A interface do painel é alterada pela Meta; se um rótulo diferir, use a busca do App Dashboard e confirme a tela **Facebook Login for Business > Configurations**. Não copie IDs de outro app.

## Resultado da auditoria e arquitetura real

O frontend chama `POST /whatsapp/embedded-signup/session`; o backend resolve usuário e organização, gera 256 bits aleatórios, grava somente SHA-256 e validade de dez minutos e devolve apenas `authorizationUrl` e `expiresAt`. O navegador abre `https://www.facebook.com/{version}/dialog/oauth` com `client_id`, `redirect_uri`, `state`, `config_id`, `response_type=code` e escopos. Portanto a implementação atual é **Facebook Login for Business/Embedded Signup com `config_id`, iniciado por redirect OAuth (A+B+D)**, e não a variante popup do Facebook JavaScript SDK (C).

Fluxo textual:

1. ORG_ADMIN autenticado abre `/whatsapp` e clica **Conectar WhatsApp Oficial**.
2. API cria `WhatsappEmbeddedSignupState` para aquele usuário e tenant.
3. Meta autentica a pessoa e executa a variação WhatsApp da configuração FLB.
4. Meta volta ao backend `GET /whatsapp/embedded-signup/callback?code=...&state=...`.
5. O backend consome o state uma única vez (inclusive cancelamento), troca o code mantendo exatamente o mesmo `redirect_uri`, descobre business/WABA/número autorizados, cifra o token e App Secret com AES-256-GCM, faz upsert serializável, assina `/{WABA-ID}/subscribed_apps` e sincroniza templates.
6. A API responde 303 para `{FRONTEND_URL}/whatsapp?connection=success` ou um motivo público enumerado. Nenhum erro Graph/Prisma ou identificador técnico é mostrado.

**Limitação auditada importante:** a descoberta percorre `/me/businesses`, `owned_whatsapp_business_accounts` e escolhe o primeiro número retornado. Para um operador que administra vários ativos, isso não prova que o primeiro é o ativo escolhido no diálogo. A variante JS SDK entrega `waba_id` e `phone_number_id` no evento `WA_EMBEDDED_SIGNUP`; a implementação redirect não captura esse evento. Antes de clientes externos, deve-se validar em sandbox Meta que a configuração restringe o token aos ativos escolhidos ou migrar o lançamento para o SDK/evento e enviar os IDs ao backend vinculados ao state. Não considerar produção liberada sem esse teste.

## Pós-callback: matriz objetiva

| Etapa | Situação |
|---|---|
| code → access token, timeout/retry seguro | implementado |
| state hasheado, 10 min, uso único, usuário/organização ativos | implementado |
| descobrir business/WABA/phone e metadados | implementado, com limitação “primeiro ativo” acima |
| display phone, verified name, quality rating, status | implementado; status local fica ACTIVE |
| token e App Secret AES-256-GCM | implementado |
| duplicidade global de Phone Number ID e tenant | transação serializável; outro tenant é recusado |
| assinar App na WABA | implementado |
| URL/campos do webhook | configurados uma vez no App Dashboard; `subscribed_apps` é automático |
| sincronizar templates e redirect amigável | implementado |
| registrar/PIN do número | não há chamada separada; no fluxo Cloud API atual isso depende do resultado/provisionamento do Embedded Signup |
| validar token via `debug_token` | não implementado separadamente; as leituras Graph validam token/permissões na prática |

## Configuration ID (`META_CONFIG_ID`)

É obrigatório no código: sem ele a sessão responde 503 seguro. Ele vai no parâmetro oficial **`config_id`** (não `configuration_id`). É uma configuração de **Facebook Login for Business pertencente ao App IMPULSE CRM**, criada uma vez pelo Impulse; não é criada por cliente. Todos os tenants podem usar a mesma configuração SaaS, salvo se o Impulse deliberadamente criar variantes diferentes.

Caminho no painel atual:

1. [Meta for Developers > Apps](https://developers.facebook.com/apps/) > **IMPULSE CRM**.
2. Confirme que o App está associado ao portfólio empresarial do Impulse em **App settings > Basic > Business portfolio**.
3. Em **Use cases / Casos de uso**, abra **Facebook Login for Business** (em algumas contas: **Products > Facebook Login for Business**).
4. Abra **Configurations / Configurações** > **Create configuration**.
5. Nome: `Impulse CRM - WhatsApp Embedded Signup`; selecione a variação/login product **WhatsApp Embedded Signup** (não “Facebook Login” de consumidor).
6. Selecione `whatsapp_business_management` e `whatsapp_business_messaging`. Mantenha `business_management` somente enquanto o backend usa `/me/businesses` para descoberta.
7. Salve e copie o **Configuration ID** exibido nessa configuração para `META_CONFIG_ID` no backend. Nunca procure um ID por cliente e nunca o exponha como `NEXT_PUBLIC_*`.

Se a opção WhatsApp não aparecer, conclua primeiro **WhatsApp > API Setup/Quickstart** e o onboarding de **Tech Provider** indicado no caso de uso. O produto WhatsApp isoladamente não cria uma configuração FLB.

## Termos e requisitos SaaS

* **Business app/App empresarial**: tipo/caso de uso do App; necessário para gerenciar ativos empresariais.
* **Facebook Login for Business**: mecanismo de autorização granular e dono do Configuration ID; necessário para este fluxo.
* **Embedded Signup**: variação WhatsApp que permite criar/selecionar portfólio, WABA e número; necessária para UX self-service.
* **Tech Provider (Provedor de Tecnologia)**: empresa de software que hospeda a solução para empresas clientes. É o enquadramento aplicável ao Impulse para onboarding de clientes externos; conclua o processo oficial da Meta.
* **Solution Partner**: programa/parceria comercial distinta; não é requisito técnico básico para implementar Embedded Signup.

Em modo Development, somente pessoas com função no App (administrador, developer/tester e contas de teste elegíveis) devem testar. Testes internos não substituem Business Verification/App Review. Para clientes reais externos: portfólio do Impulse verificado quando solicitado, Tech Provider onboarding concluído, permissões/Advanced Access aprovados, Data Use Checkup aplicável e App em **Live**. Não declare aprovação antes de o painel mostrar esses estados.

## URLs e HTTPS

| Uso | Local | Produção |
|---|---|---|
| Frontend | `http://localhost:3000/whatsapp` | `https://APP-DOMINIO/whatsapp` |
| callback OAuth | `http://localhost:3001/whatsapp/embedded-signup/callback`* | `https://API-DOMINIO/whatsapp/embedded-signup/callback` |
| webhook | localhost não recebe Meta; use túnel HTTPS | `https://API-DOMINIO/webhooks/meta/whatsapp` |

\* O código aceita localhost HTTP, mas a aceitação do callback depende das regras atuais do painel Meta. A configuração operacional recomendada é um túnel HTTPS também no desenvolvimento. Callback deve permanecer no backend, pois ele usa App Secret. Cadastre a URL exata em **Facebook Login for Business > Settings > Valid OAuth Redirect URIs**. A string deve ser idêntica no início e na troca (esquema, host, porta, path e barra final). Produção e webhooks públicos usam HTTPS.

Em **WhatsApp > Configuration**, configure Callback URL `/webhooks/meta/whatsapp`, informe um verify token gerado/controlado pelo backend e assine pelo menos `messages` e eventos necessários ao produto. Atenção: hoje cada conexão gera verify token próprio; o painel Meta possui uma única configuração de callback por App. Antes do go-live, padronizar operacionalmente um verify token do App ou confirmar a estratégia multi-token com a configuração real.

## Variáveis definitivas (somente backend)

```dotenv
META_APP_ID=                         # obrigatório, mesmo ambiente Meta da configuração
META_APP_SECRET=                     # obrigatório/segredo
META_CONFIG_ID=                      # obrigatório; FLB Configuration ID do App
META_REDIRECT_URI=https://API-DOMINIO/whatsapp/embedded-signup/callback
META_GRAPH_API_VERSION=vXX.0         # obrigatório; versão suportada escolhida no painel/docs
META_TOKEN_ENCRYPTION_KEY=           # obrigatório; segredo aleatório >=32 caracteres
META_WHATSAPP_TIMEOUT_MS=10000       # opcional, default 10000; inteiro positivo
FRONTEND_URL=https://APP-DOMINIO     # obrigatório
```

Todos, exceto o timeout, são lidos e validados. Não há divergência de nomes. O fallback de timeout é seguro; o fallback legado da classe de criptografia (`SECRETS_ENCRYPTION_KEY`/`WHATSAPP_CREDENTIAL_SECRET`) não torna a integração configurada, pois Embedded Signup exige explicitamente `META_TOKEN_ENCRYPTION_KEY`. Nenhuma variável Meta deve ser `NEXT_PUBLIC_*`. `META_REDIRECT_URI` e `FRONTEND_URL` mudam entre local/staging/produção; App ID/Secret/Config ID também devem mudar se houver Apps Meta separados. Não fixe uma versão “mais nova” por suposição: consulte [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions/) e teste antes de alterar.

## Diagnóstico seguro

`GET /whatsapp/embedded-signup/diagnostics`, com JWT de usuário cujo papel persistido seja exatamente `GLOBAL_ADMIN`, retorna somente flags, versão, ambiente, acesso à tabela e warnings. Não retorna valores dos IDs, secrets, chaves ou tokens.

## Publicação e revisão

1. Complete informações básicas, domínio, Privacy Policy, Terms e Data Deletion no App.
2. Associe e verifique o portfólio do Impulse conforme pedido pelo painel.
3. Complete o onboarding **WhatsApp > Tech Provider**.
4. Em **App Review > Permissions and Features**, solicite Advanced Access para as permissões usadas; forneça screencast do clique até a conexão e credenciais de revisor.
5. Resolva Data Use Checkup e requisitos de negócio exibidos.
6. Teste com papéis do App em Development; depois altere para **Live** e faça piloto com tenant externo autorizado.

## Checklists

### Teste

- [ ] diagnóstico `configured=true`, tabela acessível e nenhum segredo no JSON
- [ ] URL contém `config_id`, state diferente por tentativa e redirect exato
- [ ] cancelamento, expiração e replay produzem somente mensagem amigável
- [ ] usuário sem `whatsapp:accounts:create` recebe 403
- [ ] dois tenants não podem assumir o mesmo Phone Number ID
- [ ] conta com múltiplos negócios conecta exatamente o ativo escolhido (bloqueador conhecido)
- [ ] token cifrado inicia `enc:v1:` e não aparece em logs/respostas
- [ ] `subscribed_apps`, webhook assinado e sincronização de templates funcionam

### Produção

- [ ] domínio/callback/webhook HTTPS estáveis e cadastrados
- [ ] App Live, verificação/revisão/Tech Provider aprovados
- [ ] segredo e chave em secret manager, rotação e backup definidos
- [ ] versão Graph oficialmente suportada e janela de upgrade monitorada
- [ ] estratégia única de verify token do webhook validada
- [ ] teste multiativo eliminou a limitação “primeiro ativo”

## Troubleshooting seguro

* **Não inicia:** GLOBAL_ADMIN consulta diagnostics; verificar flags, URI e versão sem imprimir secrets.
* **invalid config_id na Meta:** confirmar que ID veio de FLB Configurations do mesmo App/ambiente e que a variação é WhatsApp.
* **Autorização expirou:** state vale dez minutos e uma tentativa; reiniciar.
* **Permissão negada/no WABA:** conferir papel no negócio e permissões da configuração; não mostrar IDs ao usuário.
* **Webhook 401:** conferir assinatura `X-Hub-Signature-256`, App Secret cifrado e verify-token configurado.
* **Conectou ativo errado:** parar rollout e executar o item bloqueador do SDK/evento descrito acima.
