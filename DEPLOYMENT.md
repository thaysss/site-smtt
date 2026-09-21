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

Migrações não rodam durante o boot da aplicação. Uploads precisam de volume persistente montado em `/app/app/static/uploads`; esse diretório é ignorado pelo Git e nunca deve ser empacotado como fonte.
