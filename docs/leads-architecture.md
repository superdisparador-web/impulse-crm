# Leads - notas arquiteturais finais

- E-mail é opcional. O domínio aceita leads com telefone, e-mail ou identidade externa.
- Criação por integrações não exige nome; nome nunca participa como bloqueio de deduplicação.
- Deduplicação segue a prioridade exata: identidade externa, documento, telefone E.164 e e-mail normalizado.
- `Lead.score` é snapshot de leitura para performance e não deve ser editado manualmente; atualização futura deve ocorrer exclusivamente por `LeadScoringService`.
- `LeadActivity` representa tarefas do corretor e toda alteração relevante gera `LeadEvent`.
- Não existe tabela de timeline. `TimelineService` é um serviço de leitura dinâmica que hoje agrega `LeadEvent` e futuramente consolidará WhatsApp, Pipeline, Campanhas, Agenda, Ligações e Automações.
- `Lead.status` representa estado geral da oportunidade; etapas comerciais detalhadas pertencem exclusivamente ao módulo futuro de Pipeline.
- Multi-tenancy usa `organizationId` como tenant em todas as novas entidades do domínio.
