# Auditoria do módulo Configurações

## Rota efetiva

O frontend Next.js fica na raiz do repositório. Pela convenção do App Router, a
rota `/settings` é criada exclusivamente por `app/settings/page.tsx`. Essa página
importa diretamente `components/settings/SettingsView.tsx`; não há outra
`page.tsx` para o mesmo segmento, rota paralela, rewrite ou redirect.

O `app/layout.tsx` apenas envolve todas as páginas com `DashboardLayout`. Ele
preserva a navegação e a autenticação visual, mas renderiza o `children` recebido
e não troca a página de Configurações.

## Árvore de renderização

`SettingsView` é o único componente de domínio da rota e usa os componentes
compartilhados `Badge`, `Button`, `Card`, `Input`, `PageHeader`, `Select` e
`Table`. Dentro dele:

- `Permissions` renderiza a matriz de permissões usando títulos e descrições de
  negócio definidos em `PERMISSIONS`; códigos desconhecidos não são exibidos;
- `Notifications` renderiza os grupos e textos definidos em `NOTIFICATIONS`; as
  chaves do contrato são usadas somente para ler e salvar o formulário;
- `Security` renderiza recursos de proteção, sessões e os campos suportados pela
  API, todos com nomes voltados ao usuário;
- `Section` seleciona essas áreas e as demais seções sem importar ou delegar para
  uma implementação antiga.

## Duplicidade, cache e causa

Não existe outra implementação rastreada de Configurações, nem um diretório
`frontend` com uma segunda aplicação. Também não há service worker, provider de
Configurações, layout de segmento, middleware, `use cache` ou configuração de
`cacheComponents`. Artefatos `.next` são gerados e ignorados pelo Git, portanto
não fazem parte do código mesclado.

Antes desta auditoria, o PR #83 já havia substituído a renderização direta de
`code` e das chaves de notificação por textos de negócio no componente
`SettingsCenter`. Consequentemente, uma tela que ainda mostrava
`settings:self:read` ou `notifyEmail` não poderia ter sido produzida pelo commit
mesclado: o processo em execução estava servindo um bundle compilado antes do PR
#83. Sincronizar o Git sem reconstruir e reiniciar o processo Next.js não altera
os arquivos JavaScript já carregados/servidos pelo processo antigo.

Para tornar a fronteira inequívoca e eliminar a identidade do módulo legado, o
componente foi consolidado como `SettingsView`, o arquivo anterior foi removido e
a única página passou a importar o novo caminho explicitamente. Os testes agora
protegem tanto a topologia da rota quanto a proibição de renderizar identificadores
técnicos. A publicação ainda deve executar uma nova compilação e substituir o
processo em execução, como ocorre com qualquer alteração de frontend compilado.
