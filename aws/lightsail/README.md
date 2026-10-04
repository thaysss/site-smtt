# Backend no Amazon Lightsail

Opção vigente: uma instância Ubuntu 24.04 em São Paulo, plano micro_3_1,
1 GB, US$ 7/mês, com IP fixo, Docker e Caddy/HTTPS. Vercel e Supabase continuam
nos serviços atuais. S3 e demais serviços são cobrados à parte. A instância
única não fornece redundância; tarefas administrativas incluem atualizações
do sistema, snapshots e acompanhamento de memória/disco.

## Estado desta implantação

Instância: smtt-backend, região sa-east-1. IP fixo: 54.20.148.155.
O Docker foi instalado e a conexão TCP SMTP Brevo 587 respondeu com banner 220.
O banco Supabase, HTTPS público e leitura/gravação/limpeza no S3 foram validados.
A chave SMTP foi corrigida e a autenticação foi validada. Uma mensagem de teste
foi aceita pela Brevo para o endereço autorizado pelo usuário. Isso confirma
o aceite SMTP, não a leitura da mensagem ou sua chegada à caixa de entrada.
A Vercel foi publicada em produção e encaminha /api e /static/uploads para
https://api.smttpropria.com.br. O domínio https://smttpropria.com.br respondeu
200; uma consulta de notícias foi confirmada nos logs do Lightsail e uma foto
existente respondeu 200. Deployment Vercel: dpl_FPoRRvXMtVam9FZZLUuTj9Am2Jib.
Railway permanece ativo como alternativa de rollback. O Supabase não exige
SQL novo por esta mudança de hospedagem. Login/cadastro com recebimento na
caixa de entrada ainda precisam de uma conferência funcional do usuário.

## Configuração de produção

Configurado no Registro.br, registro A: nome api, valor 54.20.148.155. Não alterar os registros
do domínio raiz/www da Vercel. Um AAAA antigo no subdomínio api também precisa
ser removido ou atualizado para não direcionar parte dos clientes ao servidor
anterior. Não configurar AAAA enquanto apenas o IPv4 fixo estiver definido.

As variáveis de produção exportadas do Railway ficam em production.env neste diretório,
no formato KEY="value" (dotenv). Não publicar esse arquivo no Git ou no chat.
Preservar DATABASE_URL, SECRET_KEY e JWT_SECRET_KEY atuais, credenciais SMTP e
remetente Brevo, além de APIPLACAS_TOKEN se utilizado. O arquivo é ignorado pelo Git.
O .env de desenvolvimento existente não substitui essa configuração.

## Scripts

- create.ps1: prepara criação; -Create cria a instância. Rejeita planos acima de US$ 7.
- network.ps1: restringe SSH ao IP local e abre apenas HTTP/HTTPS; anexa IP fixo.
- ssh-access.ps1: obtém chave/certificado SSH temporários, com permissões locais restritas.
- prepare-env.py: valida variáveis e gera generated/runtime.env sem exibir valores.
- deploy.ps1: transfere imagem/configuração por SSH; -Start inicia e verifica /health.
- start.sh: carrega imagem e mantém tag anterior para rollback de código.

Os scripts atuais foram preparados para Windows/PowerShell. Arquivos shell
são transferidos sem BOM e com linhas LF. A configuração Compose usa env_file
raw (Compose >=2.30), preservando senhas com cifrões e aspas sem interpolação.
Docker Compose 2.40.3 está instalado no servidor desta implantação.

Para obter novo acesso SSH, executar ./aws/lightsail/ssh-access.ps1. Quando a
AWS ainda não informou hostKeys, a primeira conexão registra a chave do IP
confirmado pela API; as seguintes exigem a mesma chave (StrictHostKeyChecking=yes).
Não desabilitar verificação de host ou apagar known_hosts sem validar a troca.
Se o IP público da máquina local mudar, ajustar somente a regra SSH /32.

## Armazenamento

O bucket privado SMTT em São Paulo e o prefixo uploads foram reutilizados.
A configuração original confirmou STORAGE_BACKEND=s3 e o mesmo bucket;
nenhuma cópia ou exclusão de dados foi necessária. URLs antigas de fotos
continuam atendidas pelo proxy /static/uploads e pelo redirecionamento S3.

Lightsail não oferece a task role do ECS. O backend precisa de uma credencial
IAM exclusiva, sem acesso ao console e com somente s3:GetObject, s3:PutObject e
s3:DeleteObject em arn:aws:s3:::BUCKET/uploads/*. Não transferir credenciais root
nem a sessão temporária AWS CLI para a instância. Guardar a credencial no arquivo
runtime.env (modo 600 no servidor) e fazer rotação periódica.

## Validação e troca de tráfego

Após receber as variáveis e configurar credencial S3 restrita:

```powershell
./aws/lightsail/create-s3-credentials.ps1 # Apenas na criacao inicial, apos autorizacao
./aws/lightsail/build-image.ps1 # Em futuros deploys com alteracoes de codigo
python ./aws/lightsail/prepare-env.py
./aws/lightsail/deploy.ps1 -Start
./aws/switch-vercel.ps1 -BackendUrl 'https://api.smttpropria.com.br'
```

O script da Vercel exige /health saudável e ajusta os proxies /api e
/static/uploads, além da CSP. Publicar essa mudança na Vercel somente depois
que o backend estiver validado. Não basta existir uma instância running.

Testar conexão Supabase, login administrativo/cidadão, cadastro com código
entregue, upload/download/remoção e notícias com fotos antigas. Preservar
Railway durante a validação; desligá-lo só quando a troca estiver confirmada.

## Rollback

Tráfego: restaurar o rewrite/CSP anteriores e republicar Vercel. Railway deve
usar o mesmo bucket S3 para ter acesso aos uploads criados no Lightsail.
Código: usar a imagem smtt-backend:previous preservada por start.sh, mantendo
produção/S3, e recriar o container. Não rodar reset/migração PostgreSQL, apagar
volumes, remover objetos S3 ou recriar contas. Atualizar snapshots exige avaliar
custos; nenhum snapshot pago foi configurado automaticamente nesta preparação.

Fontes: https://aws.amazon.com/lightsail/pricing/
https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-regions-and-availability-zones-in-amazon-lightsail.html
https://repost.aws/knowledge-center/lightsail-port-25-throttle
