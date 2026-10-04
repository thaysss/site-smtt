[CmdletBinding()]
param(
    [string]$SettingsPath = "$PSScriptRoot/settings.local.json",
    [switch]$Deploy
)
$ErrorActionPreference = 'Stop'
$settings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json
foreach ($key in 'region','serviceName','repositoryName','bucketName','secretArn','executionRoleArn','infrastructureRoleArn','taskRoleArn') {
    if (-not $settings.$key -or $settings.$key -like 'PREENCHER*') { throw "Preencha $key em $SettingsPath." }
}
function Invoke-AwsJson([string[]]$Arguments) {
    $result = & aws @Arguments --region $settings.region --output json --no-cli-pager
    if ($LASTEXITCODE -ne 0) { throw "AWS falhou: $($Arguments[0]) $($Arguments[1])." }
    if ($result) { return ($result | ConvertFrom-Json) }
}
function Write-JsonFile($Value, [string]$Path) {
    [IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
}
$identity = Invoke-AwsJson @('sts','get-caller-identity')
$account = $identity.Account
$repository = "$account.dkr.ecr.$($settings.region).amazonaws.com/$($settings.repositoryName)"
$tag = Get-Date -Format 'yyyyMMddHHmmss'
$image = "${repository}:$tag"
$generated = Join-Path $PSScriptRoot 'generated'
New-Item -ItemType Directory -Path $generated -Force | Out-Null
$environment = @{
    FLASK_ENV='production'; PORT='5000'; WEB_CONCURRENCY='2'; STORAGE_BACKEND='s3';
    S3_BUCKET=$settings.bucketName; S3_REGION=$settings.region; S3_PREFIX='uploads';
    CORS_ALLOWED_ORIGINS=$settings.corsAllowedOrigins; DB_POOL_SIZE='3'; DB_MAX_OVERFLOW='0';
    MAIL_SERVER='smtp-relay.brevo.com'; MAIL_PORT='587'; MAIL_USE_TLS='true';
    MAIL_USE_SSL='false'; MAIL_SUPPRESS_SEND='false'; MAIL_TIMEOUT='10'
}
$secretKeys = @('DATABASE_URL','SECRET_KEY','JWT_SECRET_KEY','MAIL_USERNAME','MAIL_PASSWORD','MAIL_DEFAULT_SENDER')
$container = @{
    image=$image; containerPort=5000;
    environment=@($environment.GetEnumerator() | Sort-Object Name | ForEach-Object { @{name=$_.Key; value=[string]$_.Value} });
    secrets=@($secretKeys | ForEach-Object { @{name=$_; valueFrom="$($settings.secretArn):${_}::"} })
}
$request = @{
    primaryContainer=$container; healthCheckPath='/health';
    cpu=[string]$settings.cpu; memory=[string]$settings.memory;
    executionRoleArn=$settings.executionRoleArn; taskRoleArn=$settings.taskRoleArn;
    scalingTarget=@{ minTaskCount=[int]$settings.minTasks; maxTaskCount=[int]$settings.maxTasks }
}
if ($settings.serviceArn) { $request.serviceArn=$settings.serviceArn; $operation='update-express-gateway-service' }
else { $request.serviceName=$settings.serviceName; $request.infrastructureRoleArn=$settings.infrastructureRoleArn; $operation='create-express-gateway-service' }
$requestPath = Join-Path $generated 'service.json'
Write-JsonFile $request $requestPath
# Offline CLI schema validation; does not provision resources.
& aws ecs $operation --cli-input-json "file://$requestPath" --generate-cli-skeleton output --region $settings.region --no-cli-pager | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Configuracao ECS rejeitada pela CLI.' }
Write-Host "Conta: $account; regiao: $($settings.region); imagem: $image"
Write-Host "Configuracao validada: $requestPath"
if (-not $Deploy) { Write-Host 'Modo preparacao: nenhum recurso criado. Use -Deploy depois da revisao.'; return }
Invoke-AwsJson @('ecr','describe-repositories','--repository-names',$settings.repositoryName) | Out-Null
Invoke-AwsJson @('secretsmanager','describe-secret','--secret-id',$settings.secretArn) | Out-Null
Invoke-AwsJson @('s3api','head-bucket','--bucket',$settings.bucketName) | Out-Null
$registry = "$account.dkr.ecr.$($settings.region).amazonaws.com"
$password = & aws ecr get-login-password --region $settings.region
if ($LASTEXITCODE -ne 0) { throw 'Falha ao autenticar no ECR.' }
$password | & docker login --username AWS --password-stdin $registry
$password = $null
if ($LASTEXITCODE -ne 0) { throw 'Docker login falhou.' }
$repoRoot = Split-Path $PSScriptRoot -Parent
& docker build --platform linux/amd64 -t $image $repoRoot
if ($LASTEXITCODE -ne 0) { throw 'Build falhou.' }
& docker push $image
if ($LASTEXITCODE -ne 0) { throw 'Push falhou.' }
$result = Invoke-AwsJson @('ecs',$operation,'--cli-input-json',"file://$requestPath")
Write-JsonFile $result (Join-Path $generated 'deployment.json')
Write-Host "Implantacao iniciada: $($result.service.serviceArn)"
Write-Host 'Salve o serviceArn em settings.local.json para atualizar este mesmo servico.'
Write-Host 'Aguarde ACTIVE e teste /health antes de alterar a Vercel.'
