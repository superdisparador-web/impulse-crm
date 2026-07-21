export const USER_PASSWORD_RESET_SECURITY_NOTES = [
  'A arquitetura atual emite JWT stateless com expiração configurada no AuthModule e não persiste jti, tokenVersion ou blacklist; portanto, não há invalidação imediata de access tokens já emitidos após reset de senha.',
  'Não há refresh token persistido, tabela de sessões ou mecanismo server-side de sessão neste projeto; consequentemente, não existe artefato compatível para revogação no reset de senha administrativo.',
  'O reset administrativo atual atualiza o hash da senha com bcrypt e faz com que novos logins dependam da nova senha; access tokens antigos seguem válidos até expirar.',
  'Risco residual documentado: caso um token antigo tenha sido comprometido, ele poderá ser usado até expirar. Para mitigação futura, adicionar tokenVersion/sessionVersion ao usuário e validar essa versão no JwtStrategy.',
] as const;
