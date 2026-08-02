# Build Information e diagnóstico de versão

O Impulse CRM publica a identidade exata de cada compilação para impedir que um checkout atualizado seja confundido com um processo ou container antigo.

## Captura no build

Antes de `next dev` e `next build`, `scripts/prepare-build-information.mjs` executa `git rev-parse HEAD` e `git rev-parse --abbrev-ref HEAD`, registra a data UTC e lê as versões dos `package.json` do frontend e backend. A captura é gravada em `.impulse-build.json` (ignorado pelo Git) e incorporada ao bundle. Um `BUILD_ID` novo combina o commit, o instante do build e um UUID aleatório; `generateBuildId` faz o Next usar exatamente esse identificador. O arquivo evita que avaliações separadas de `next.config.ts` durante build e start produzam identidades divergentes. Builds reproduzidos em múltiplos containers podem definir `IMPULSE_COMMIT`, `IMPULSE_BRANCH`, `IMPULSE_BUILD_DATE` e `IMPULSE_BUILD_ID` para compartilhar uma identidade única.

`DEPLOYMENT_ENV` identifica o ambiente; na ausência dele são usados `VERCEL_ENV` ou `NODE_ENV`.

## Endpoints públicos

- `GET /api/version`: commit completo, branch, data, ambiente, Node, versões frontend/backend e `buildId`. A resposta usa `Cache-Control: no-store`.
- `GET /api/health`: uptime, RSS/heap, CPU do processo frontend, versão completa e conectividade do banco. O frontend consulta `GET /health` no backend, que executa `SELECT 1`; retorna HTTP 503 quando o banco/backend não responde.

Nenhum endpoint retorna segredo, URL de banco ou stack trace.

## Identificação visual e console

O rodapé da barra lateral mostra commit abreviado, branch e data local do build. No início de toda sessão do frontend, o console registra `Impulse CRM`, commit, branch, build e Build ID. A tela de login também registra no console, embora não mostre a barra lateral.

## Diagnóstico de deploy

Após publicar, compare o SHA esperado com:

```bash
curl -fsS https://SEU_HOST/api/version
curl -fsS https://SEU_HOST/api/health
```

Se o commit divergir, o navegador está conectado a outro build, container ou instância. Como as respostas não são cacheadas e os dados estão incorporados no bundle, um checkout atualizado sem rebuild continuará exibindo objetivamente o SHA antigo.

Para um build local limpo:

```bash
rm -rf .next
npm ci
npm run build
npm start
```
