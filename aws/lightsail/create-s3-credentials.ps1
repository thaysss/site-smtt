[CmdletBinding()]
param([string]$BucketName='smtt-propria-uploads-501421114665',[string]$UserName='smtt-lightsail-uploads')
$ErrorActionPreference='Stop'
$generated=Join-Path $PSScriptRoot 'generated'
if (-not (Test-Path "$PSScriptRoot/production.env")) { throw 'Configuracao de producao ausente.' }
if (Test-Path "$generated/s3.env") { throw 'Credencial local ja preparada; reutilize ou planeje rotacao.' }
function Invoke-AwsJson([string[]]$Arguments) {
    $data=& aws @Arguments --output json --no-cli-pager --cli-connect-timeout 10 --cli-read-timeout 30
    if ($LASTEXITCODE -ne 0) { throw "AWS falhou: $($Arguments[0]) $($Arguments[1])" }
    if ($data) { $data | ConvertFrom-Json }
}
$users=(Invoke-AwsJson @('iam','list-users')).Users
if (@($users | Where-Object UserName -eq $UserName).Count) { throw 'Usuario IAM ja existe; revisar antes de alterar chaves.' }
New-Item -ItemType Directory -Path $generated -Force | Out-Null
$policy=@{Version='2012-10-17';Statement=@(@{Effect='Allow';Action=@('s3:GetObject','s3:PutObject','s3:DeleteObject');Resource="arn:aws:s3:::${BucketName}/uploads/*"})}
$policyPath=Join-Path $generated 'lightsail-s3-policy.json'
[IO.File]::WriteAllText($policyPath,($policy | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
$path=Join-Path $generated 's3.env'
[IO.File]::WriteAllText($path,'',[Text.UTF8Encoding]::new($false))
$principal=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $path /inheritance:r /grant:r "${principal}:(R,W)" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falha ao restringir as permissoes locais.' }
Invoke-AwsJson @('iam','create-user','--user-name',$UserName,'--tags','Key=Project,Value=SMTT','Key=Purpose,Value=LightsailUploads') | Out-Null
Invoke-AwsJson @('iam','put-user-policy','--user-name',$UserName,'--policy-name','SMTTUploadsOnly','--policy-document',"file://$policyPath") | Out-Null
$key=(Invoke-AwsJson @('iam','create-access-key','--user-name',$UserName)).AccessKey
[IO.File]::WriteAllText($path,"AWS_ACCESS_KEY_ID=$($key.AccessKeyId)`nAWS_SECRET_ACCESS_KEY=$($key.SecretAccessKey)`n",[Text.UTF8Encoding]::new($false))
$key=$null
Write-Host "Credencial de $UserName preparada. Valores nao exibidos."
