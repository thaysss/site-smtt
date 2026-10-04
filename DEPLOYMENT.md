# Implantação segura

## Variáveis obrigatórias

Defina `FLASK_ENV=production`, `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY` e `CORS_ALLOWED_ORIGINS`. Use segredos aleatórios distintos e nunca os grave no repositório. O backend falha ao iniciar se a configuração de produção estiver incompleta.

## Ordem da implantação

1. Faça backup do PostgreSQL.
2. Execute `RUN_DATABASE_MIGRATIONS=yes python update_db_schema.py` uma única vez, em um job de release isolado.
3. Inicie a nova imagem do backend e confirme `/health`.
4. Publique o frontend somente depois do backend saudável.

## Reset deliberado do banco

Para zerar todos os registros de producao preservando schema, constraints e
RLS, execute o script abaixo apenas como job manual e remova a variavel de
confirmacao imediatamente depois:

`CONFIRM_DATABASE_RESET=DELETE_ALL_PRODUCTION_DATA python reset_production_db.py`

Depois do reset, execute `criar_admin.py` com as variaveis
`INITIAL_ADMIN_MATRICULA` e `INITIAL_ADMIN_PASSWORD`. O reset nao cria uma
senha padrao.

## Row Level Security

`update_db_schema.py` ativa RLS em todas as tabelas PostgreSQL. A aplicacao
continua acessando-as por meio do papel proprietario; outros papeis nao recebem
politicas de acesso por padrao.

Migrações não rodam durante o boot da aplicação.

## Uploads no Amazon S3

Em produção, configure `STORAGE_BACKEND=s3`, `S3_BUCKET`, `S3_REGION` e, opcionalmente, `S3_PREFIX`. Não torne o bucket público: o backend entrega downloads por URLs assinadas de curta duração. As credenciais seguem a cadeia padrão da AWS; prefira uma IAM role do container/instância em vez de chaves estáticas.

A role precisa apenas destas ações no prefixo configurado:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
  "Resource": "arn:aws:s3:::SEU_BUCKET/uploads/*"
}
```

Para desenvolvimento sem S3, mantenha `STORAGE_BACKEND=local`. Nesse modo, monte um volume persistente em `/app/app/static/uploads`; o diretório é ignorado pelo Git.

## Galeria de fotos das notícias

Antes de publicar o backend com suporte à galeria, execute o SQL completo de
`smtt_backend/sql/20261001_noticias_multiplas_fotos.sql` no SQL Editor do Supabase.
Depois publique o backend e o frontend, nesta ordem. A capa permanece em
`imagem_url` e as fotos extras ficam em `imagens_urls`. O cadastro permite uma
capa e até nove fotos extras (PNG/JPEG), com seleção múltipla e remoção da galeria.
O rollback em `smtt_backend/sql/20261001_noticias_multiplas_fotos_rollback.sql`
recusa remover a coluna se houver fotos extras, evitando perda de dados.

## Migração do backend para AWS

A implantação escolhida usa Lightsail. O estado e os scripts estão em
`aws/lightsail/README.md`; ECS/Fargate permanece apenas como alternativa.
Nesta migração o frontend permanece na Vercel e o banco no Supabase; não
execute migrações de banco ou reset apenas por mudar a hospedagem.
