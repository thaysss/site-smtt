# Revisão de segurança

Implementado: segredos aleatórios em desenvolvimento; rejeição de chaves curtas ou placeholders em produção; limites de pooling PostgreSQL; rejeição de JSON inválido ou não objeto; limites de senhas; rollback no handler global; rastreamento em respostas antecipadas; validação do request ID; remoção de confiança em X-Forwarded-For; .env.example do frontend.

## Riscos e trabalho restante

- Limitador em memória por processo: requer armazenamento compartilhado e expiração de buckets para múltiplos workers. Configurar proxies confiáveis conforme a infraestrutura real; atualmente usuários atrás do proxy podem compartilhar o limite. Não confiar indiscriminadamente em headers do cliente.
- Revisar autorização por proprietário nos downloads /api/uploads e /static/uploads; separar documentos pessoais e mídia pública. URLs difíceis de adivinhar não substituem autorização.
- Revisar revogação e permissões atuais de administradores e isolamento dos tipos de JWT em todas as rotas.
- Tokens em localStorage ficam acessíveis a JavaScript. Avaliar cookies HttpOnly com CSRF e CSP.
- Extrair validações e casos de uso dos arquivos public.py/admin.py. Nenhum módulo de billing foi identificado.
- Completar validação por campo e tipo; proteção de JSON não valida todas as regras de negócio. Revisar conteúdo de uploads e análise antimalware.
- Revisar logs para impedir exposição de dados pessoais e segredos em caminhos e exceções.
- Usar pooler Supabase e TLS na DATABASE_URL; dimensionar conexões por workers e réplicas. Limites locais não configuram o pooler remoto.
- Conferir RLS/grants, backups, restauração e monitoração reais. Infraestrutura e banco em produção não foram acessados.

Nenhuma alteração de esquema ou dados: não há migração SQL. Esta revisão inicial não certifica prontidão para produção.
