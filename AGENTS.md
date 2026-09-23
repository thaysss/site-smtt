# Instruções do projeto

## Migrações de banco de dados

- Este projeto usa PostgreSQL no Supabase.
- Sempre que uma alteração exigir migração de esquema ou de dados, forneça ao usuário o SQL completo e pronto para execução no **SQL Editor do Supabase**, inclusive em conversas futuras neste repositório.
- Não entregue apenas comandos de ORM, scripts Python ou instruções genéricas de migração; o SQL do Supabase deve acompanhar a implementação.
- Sempre que aplicável, inclua transação, criação ou alteração de tabelas, índices, chaves estrangeiras, configuração de RLS, grants/revokes e uma consulta de verificação pós-migração.
- Inclua um rollback seguro quando ele for viável e não implicar perda silenciosa de dados.
- Prefira comandos idempotentes quando isso não mascarar divergências de esquema.
- Nunca inclua senhas, chaves ou URLs de conexão reais nos comandos ou na documentação.
