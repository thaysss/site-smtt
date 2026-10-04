[CmdletBinding()]
param(
    [string]$Region='sa-east-1',
    [string]$InstanceName='smtt-backend',
    [string]$AvailabilityZone='sa-east-1a',
    [string]$BundleId='micro_3_1',
    [switch]$Create
)
$ErrorActionPreference='Stop'
function Invoke-AwsJson([string[]]$Arguments) {
    $data=& aws @Arguments --region $Region --output json --no-cli-pager --cli-connect-timeout 10 --cli-read-timeout 30
    if ($LASTEXITCODE -ne 0) { throw "AWS falhou: $($Arguments[0]) $($Arguments[1])" }
    if ($data) { $data | ConvertFrom-Json }
}
$identity=Invoke-AwsJson @('sts','get-caller-identity')
$bundles=Invoke-AwsJson @('lightsail','get-bundles')
$bundle=@($bundles.bundles | Where-Object { $_.bundleId -eq $BundleId -and $_.isActive })
if ($bundle.Count -ne 1 -or $bundle[0].price -gt 7 -or $bundle[0].ramSizeInGb -lt 1) { throw 'Plano deve estar ativo, ter pelo menos 1 GB e custar no maximo US$ 7.' }
$instances=Invoke-AwsJson @('lightsail','get-instances')
$existing=@($instances.instances | Where-Object name -eq $InstanceName)
if ($existing.Count) { throw 'Instancia ja existe; confira e reutilize, sem criar outra.' }
$adminIp=(Invoke-RestMethod 'https://checkip.amazonaws.com').Trim()
if ($adminIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw 'IP de administracao invalido.' }
$generated=Join-Path $PSScriptRoot 'generated'
New-Item -ItemType Directory -Path $generated -Force | Out-Null
$request=@{
    instanceNames=@($InstanceName); availabilityZone=$AvailabilityZone;
    blueprintId='ubuntu_24_04'; bundleId=$BundleId; ipAddressType='dualstack';
    userData=(Get-Content "$PSScriptRoot/user-data.sh" -Raw).TrimStart([char]0xfeff).Replace("`r`n","`n");
    tags=@(@{key='Project';value='SMTT'};@{key='Purpose';value='backend'})
}
$path=Join-Path $generated 'create-instance.json'
[IO.File]::WriteAllText($path,($request | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
$firewall=@{instanceName=$InstanceName;portInfos=@(
    @{fromPort=22;toPort=22;protocol='tcp';cidrs=@("$adminIp/32")};
    @{fromPort=80;toPort=80;protocol='tcp';cidrs=@('0.0.0.0/0');ipv6Cidrs=@('::/0')};
    @{fromPort=443;toPort=443;protocol='tcp';cidrs=@('0.0.0.0/0');ipv6Cidrs=@('::/0')}
)}
$firewallPath=Join-Path $generated 'firewall.json'
[IO.File]::WriteAllText($firewallPath,($firewall | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
& aws lightsail create-instances --cli-input-json "file://$path" --generate-cli-skeleton output --region $Region --no-cli-pager | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Configuracao invalida.' }
Write-Host "Conta $($identity.Account); $Region; $InstanceName; US$ $($bundle[0].price)/mes; SSH apenas $adminIp."
if (-not $Create) { Write-Host 'Preparacao concluida; nenhum recurso criado.'; return }
Invoke-AwsJson @('lightsail','create-instances','--cli-input-json',"file://$path") | Out-Null
Write-Host 'Instancia solicitada. Aguardar running antes de aplicar firewall e anexar IP estatico.'
