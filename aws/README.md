# Implantação AWS

A opção escolhida é **Lightsail de US$ 7/mês**. Veja [lightsail/README.md](lightsail/README.md) para o estado e os próximos passos.

O procedimento ECS abaixo permanece como alternativa; não foi provisionado.

# Backend SMTT na AWS

O frontend permanece na Vercel; PostgreSQL e contas permanecem no Supabase.
A proposta usa ECS Express Mode/Fargate, ECR, Secrets Manager e o bucket S3
existente. A imagem usa Python 3.11, Gunicorn, porta 5000 e health check /health.
App Runner deixou de aceitar novos clientes em 30/04/2026.

## Antes de provisionar

Revisar orçamento e região. A configuração inicial é 0,25 vCPU, 1 GiB,
uma tarefa, sem autoscaling. Isso reduz custo, mas não oferece redundância
entre tarefas. Deploys podem consumir capacidade adicional temporariamente.
Além do Fargate, há cobrança por ALB, IPv4 público, logs, ECR, Secrets Manager,
S3 e tráfego. Não assumir gratuidade por haver créditos na conta.
Aumentar maxTasks exige revisar o pool de conexões do Supabase; os limites
por IP da aplicação são em memória por processo, sem compartilhamento.

AWS CLI e Docker são necessários. Autenticar na conta pretendida e verificar
`aws sts get-caller-identity`. Os scripts usam o perfil ativo/default; para
outro perfil, definir AWS_PROFILE na sessão. Express Mode usa a VPC padrão
com subnets públicas; verificar a existência antes de criar o serviço.

## Segredos

Criar no Secrets Manager da mesma região um segredo JSON, com chave gerenciada
padrão do serviço, contendo:

- DATABASE_URL: conexão Supabase com SSL e pooler apropriado.
- SECRET_KEY e JWT_SECRET_KEY: preservar os valores atuais para manter tokens.
- MAIL_USERNAME: login SMTP Brevo.
- MAIL_PASSWORD: chave SMTP Brevo (diferente da chave API).
- MAIL_DEFAULT_SENDER: remetente verificado na Brevo.

Se APIPLACAS_TOKEN estiver em uso, adicionar ao segredo e à lista secretKeys
em deploy.ps1 antes de implantar. Não colocar valores de segredos em settings,
Git, Dockerfile, argumentos de terminal ou mensagens do chat. Os scripts
referenciam apenas o ARN do segredo e não leem seu conteúdo.

## Preparação e implantação

Executar no PowerShell, na raiz do repositório. Substituir apenas os marcadores:

```powershell
./aws/bootstrap.ps1 -SecretArn 'ARN_DO_SEGREDO' -BucketName 'BUCKET_EXISTENTE'
```

Esse comando apenas prepara políticas. Após revisar custos e políticas:

```powershell
./aws/bootstrap.ps1 -SecretArn 'ARN_DO_SEGREDO' -BucketName 'BUCKET_EXISTENTE' -Provision
Copy-Item ./aws/generated/settings.prepared.json ./aws/settings.local.json
./aws/deploy.ps1
./aws/deploy.ps1 -Deploy
```

bootstrap é para criação inicial: se recursos já existirem, interrompe; revisar
os recursos parciais antes de continuar. Não sobrescreve roles existentes.
O deploy gera a configuração e valida o esquema pela CLI. -Deploy compila,
publica no ECR e solicita criação/atualização do ECS. Esse retorno não confirma
que o serviço está saudável. Salvar serviceArn do retorno em settings.local.json
para os próximos deploys. Um serviceArn vazio significa criar novo serviço.

Monitorar `aws ecs describe-express-gateway-service --service-arn ARN --region REGIAO`
e aguardar status ACTIVE. Testar /health, cadastro/e-mail, login e uploads.
Em sa-east-1, confirmar conexão SMTP Brevo 587 na tarefa; migrar para AWS não
substitui a verificação real de conectividade e credenciais.

## Arquivos existentes

Se o Railway já usa o mesmo bucket S3, manter prefixo uploads e região.
Se usa disco/volume, exportar o diretório app/static/uploads do Railway e
copiar todos os arquivos para s3://BUCKET/uploads/ preservando subpastas:

```powershell
aws s3 sync 'PASTA_EXPORTADA_DO_RAILWAY' 's3://BUCKET/uploads/' --sse AES256 --dryrun
aws s3 sync 'PASTA_EXPORTADA_DO_RAILWAY' 's3://BUCKET/uploads/' --sse AES256
```

Validar quantidade, tamanho e amostras antes da troca. Não usar --delete.
Suspender gravações durante a cópia final para não perder arquivos novos.
Os caminhos antigos /static/uploads continuam funcionando com redirect para
S3; novos arquivos usam /api/uploads. Nenhuma alteração de schema ou dados
PostgreSQL é exigida por esta migração; não executar update_db_schema.py,
reset_production_db.py ou criar_admin.py como parte dela.

## Vercel e rollback

O frontend em produção usa /api; VITE_API_URL não seleciona o backend.
Após validar o novo backend:

```powershell
./aws/switch-vercel.ps1 -BackendUrl 'https://ENDPOINT_ECS'
```

O script exige /health saudável, atualiza o rewrite e a origem na CSP em
smtt_frontend/vercel.json. Revisar o diff e publicar na Vercel. Manter Railway
ativo durante a validação. Testar o domínio final, cadastro com entrega de
código, login, consultas e anexos. Só desligar Railway após esses testes.

Para rollback de tráfego, restaurar o rewrite e CSP anteriores da Vercel e
republicar. Antes disso, o Railway deve usar o mesmo bucket S3 para acessar
arquivos gravados na AWS. Não voltar a um volume antigo sem sincronizar dados.
Para rollback de código no ECS, usar a imagem ECR da versão anterior em uma
atualização do serviço. Nenhum script remove banco, bucket ou arquivos.

Fontes: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-getting-started.html
https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html

## Estimativa consultada em 02/10/2026

Para sa-east-1, Linux x86, uma tarefa 0,25 vCPU/1 GiB e 730 horas/mês:
Fargate US$ 18,25 + ALB base US$ 24,82 = US$ 43,07/mês.
Não inclui LCUs do ALB, IPv4 público, logs, ECR, Secrets Manager, S3,
tráfego, impostos, câmbio ou capacidade extra temporária durante deploy.
Preços obtidos pela API pública AWS Price List (AmazonECS e AWSELB).
Referências: https://aws.amazon.com/fargate/pricing/
https://aws.amazon.com/elasticloadbalancing/pricing/
