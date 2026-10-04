[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SecretArn,
    [Parameter(Mandatory)][string]$BucketName,
    [string]$Region = 'sa-east-1',
    [switch]$Provision
)
$ErrorActionPreference = 'Stop'
function Invoke-AwsJson([string[]]$Arguments) {
    $data = & aws @Arguments --region $Region --output json --no-cli-pager
    if ($LASTEXITCODE -ne 0) { throw "AWS falhou: $($Arguments[0]) $($Arguments[1])" }
    if ($data) { return ($data | ConvertFrom-Json) }
}
function JsonFile($Object, [string]$Name) {
    $path = Join-Path $generated $Name
    [IO.File]::WriteAllText($path, ($Object | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
    return "file://$path"
}
$identity = Invoke-AwsJson @('sts','get-caller-identity')
$account = $identity.Account
if ($SecretArn -notlike "arn:aws:secretsmanager:${Region}:${account}:secret:*") { throw 'Secret deve pertencer a esta conta e regiao.' }
$generated = Join-Path $PSScriptRoot 'generated'
New-Item -ItemType Directory -Path $generated -Force | Out-Null
$taskTrust = JsonFile @{Version='2012-10-17';Statement=@(@{Effect='Allow';Principal=@{Service='ecs-tasks.amazonaws.com'};Action='sts:AssumeRole';Condition=@{StringEquals=@{'aws:SourceAccount'=$account};ArnLike=@{'aws:SourceArn'="arn:aws:ecs:${Region}:${account}:*"}}})} 'task-trust.json'
$infraTrust = JsonFile @{Version='2012-10-17';Statement=@(@{Effect='Allow';Principal=@{Service='ecs.amazonaws.com'};Action='sts:AssumeRole'})} 'infra-trust.json'
$secretPolicy = JsonFile @{Version='2012-10-17';Statement=@(@{Effect='Allow';Action='secretsmanager:GetSecretValue';Resource=$SecretArn})} 'secret-policy.json'
$s3Policy = JsonFile @{Version='2012-10-17';Statement=@(@{Effect='Allow';Action=@('s3:PutObject','s3:GetObject','s3:DeleteObject');Resource="arn:aws:s3:::${BucketName}/uploads/*"})} 's3-policy.json'
$settings = Get-Content -LiteralPath "$PSScriptRoot/settings.example.json" -Raw | ConvertFrom-Json
$settings.region=$Region; $settings.bucketName=$BucketName; $settings.secretArn=$SecretArn
$settings.executionRoleArn="arn:aws:iam::${account}:role/smtt-backend-execution"
$settings.infrastructureRoleArn="arn:aws:iam::${account}:role/smtt-backend-infrastructure"
$settings.taskRoleArn="arn:aws:iam::${account}:role/smtt-backend-task"
JsonFile $settings 'settings.prepared.json' | Out-Null
if (-not $Provision) { Write-Host 'Politicas e settings.prepared.json gerados; nenhum recurso criado.'; return }
# Fresh setup only: an existing role/repository causes an error rather than overwriting unrelated resources.
Invoke-AwsJson @('secretsmanager','describe-secret','--secret-id',$SecretArn) | Out-Null
Invoke-AwsJson @('s3api','head-bucket','--bucket',$BucketName) | Out-Null
Invoke-AwsJson @('iam','create-role','--role-name','smtt-backend-execution','--assume-role-policy-document',$taskTrust) | Out-Null
Invoke-AwsJson @('iam','attach-role-policy','--role-name','smtt-backend-execution','--policy-arn','arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy') | Out-Null
Invoke-AwsJson @('iam','put-role-policy','--role-name','smtt-backend-execution','--policy-name','ReadBackendSecret','--policy-document',$secretPolicy) | Out-Null
Invoke-AwsJson @('iam','create-role','--role-name','smtt-backend-infrastructure','--assume-role-policy-document',$infraTrust) | Out-Null
Invoke-AwsJson @('iam','attach-role-policy','--role-name','smtt-backend-infrastructure','--policy-arn','arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices') | Out-Null
Invoke-AwsJson @('iam','create-role','--role-name','smtt-backend-task','--assume-role-policy-document',$taskTrust) | Out-Null
Invoke-AwsJson @('iam','put-role-policy','--role-name','smtt-backend-task','--policy-name','BackendUploads','--policy-document',$s3Policy) | Out-Null
Invoke-AwsJson @('ecr','create-repository','--repository-name','smtt-backend','--image-tag-mutability','IMMUTABLE','--image-scanning-configuration','scanOnPush=true') | Out-Null
Write-Host 'Roles e repositorio criados. Aguarde a propagacao do IAM antes de implantar.'
Write-Host 'Copie generated/settings.prepared.json para settings.local.json e revise os valores.'
