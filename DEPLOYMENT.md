# Implantação segura

## Variáveis obrigatórias

Defina `FLASK_ENV=production`, `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY` e `CORS_ALLOWED_ORIGINS`. Use segredos aleatórios distintos e nunca os grave no repositório. O backend falha ao iniciar se a configuração de produção estiver incompleta.

## Ordem da implantação

1. Faça backup do PostgreSQL.
2. Execute `RUN_DATABASE_MIGRATIONS=yes python update_db_schema.py` uma única vez, em um job de release isolado.
3. Inicie a nova imagem do backend e confirme `/health`.
4. Publique o frontend somente depois do backend saudável.

Migrações não rodam durante o boot da aplicação. Uploads precisam de volume persistente montado em `/app/app/static/uploads`; esse diretório é ignorado pelo Git e nunca deve ser empacotado como fonte.
