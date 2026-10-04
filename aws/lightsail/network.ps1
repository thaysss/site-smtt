[CmdletBinding()]
param([string]$Region='sa-east-1',[string]$InstanceName='smtt-backend')
$ErrorActionPreference='Stop'
function Invoke-AwsJson([string[]]$Arguments) {
    $data=& aws @Arguments --region $Region --output json --no-cli-pager --cli-connect-timeout 10 --cli-read-timeout 30
    if ($LASTEXITCODE -ne 0) { throw "AWS falhou: $($Arguments[0]) $($Arguments[1])" }
    if ($data) { $data | ConvertFrom-Json }
}
$instance=(Invoke-AwsJson @('lightsail','get-instance','--instance-name',$InstanceName)).instance
if ($instance.state.name -ne 'running') { throw 'Aguarde a instancia ficar running.' }
$generated=Join-Path $PSScriptRoot 'generated'
$firewall=Join-Path $generated 'firewall.json'
if (-not (Test-Path $firewall)) { throw 'Arquivo de firewall ausente; execute a preparacao primeiro.' }
Invoke-AwsJson @('lightsail','put-instance-public-ports','--cli-input-json',"file://$firewall") | Out-Null
$ipName="$InstanceName-ip"
$ips=(Invoke-AwsJson @('lightsail','get-static-ips')).staticIps
$existing=@($ips | Where-Object name -eq $ipName)
if (-not $existing.Count) { Invoke-AwsJson @('lightsail','allocate-static-ip','--static-ip-name',$ipName) | Out-Null }
$ip=(Invoke-AwsJson @('lightsail','get-static-ip','--static-ip-name',$ipName)).staticIp
if ($ip.isAttached -and $ip.attachedTo -ne $InstanceName) { throw 'IP ja anexado a outra instancia.' }
if (-not $ip.isAttached) { Invoke-AwsJson @('lightsail','attach-static-ip','--static-ip-name',$ipName,'--instance-name',$InstanceName) | Out-Null }
$info=@{instanceName=$InstanceName;region=$Region;staticIpName=$ipName;ip=$ip.ipAddress;apiDomain='api.smttpropria.com.br';monthlyInstanceUSD=7}
[IO.File]::WriteAllText((Join-Path $generated 'instance.json'),($info | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Host "IP fixo: $($ip.ipAddress). Registro DNS A: api -> $($ip.ipAddress)."
