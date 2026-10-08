[CmdletBinding()]
param([string]$ApiDomain='api.smttpropria.com.br',[switch]$Start)
$ErrorActionPreference='Stop'
if ($ApiDomain -notmatch '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$') { throw 'Dominio invalido.' }
$generated=Join-Path $PSScriptRoot 'generated'
$connection=Get-Content "$generated/connection.json" -Raw | ConvertFrom-Json
$key=Join-Path $generated 'ssh-key'
$cert=Join-Path $generated 'ssh-key-cert.pub'
$known=Join-Path $generated 'known_hosts'

function Update-DeploySshAccess {
    # Lightsail certificates are temporary; refresh before opening a new connection.
    & "$PSScriptRoot/ssh-access.ps1" -Region $script:connection.region -InstanceName $script:connection.instanceName
    $script:connection=Get-Content "$generated/connection.json" -Raw | ConvertFrom-Json
    $script:target="$($script:connection.username)@$($script:connection.ip)"
    $script:sshOptions=@('-i',$key,'-o',"CertificateFile=$cert",'-o','IdentitiesOnly=yes','-o',"UserKnownHostsFile=$known",'-o','StrictHostKeyChecking=yes','-o','BatchMode=yes','-o','ConnectTimeout=10')
}

Update-DeploySshAccess
$envPath=Join-Path $generated 'runtime.env'
if (-not (Test-Path $envPath)) { throw 'Execute prepare-env.py antes de transferir.' }
& ssh @sshOptions $target 'test -f /opt/smtt/bootstrap-ready && umask 077 && touch /opt/smtt/production.env && chmod 600 /opt/smtt/production.env'
if ($LASTEXITCODE -ne 0) { throw 'Servidor ainda nao esta preparado.' }
[IO.File]::WriteAllText((Join-Path $generated 'domain.env'),"API_DOMAIN=$ApiDomain`n",[Text.UTF8Encoding]::new($false))
foreach ($file in 'compose.yml','Caddyfile','start.sh') {
    $source=Join-Path $PSScriptRoot $file
    $content=(Get-Content $source -Raw).TrimStart([char]0xfeff).Replace("`r`n","`n")
    [IO.File]::WriteAllText((Join-Path $generated $file),$content,[Text.UTF8Encoding]::new($false))
}
$files=@{
    'runtime.env'='production.env'; 'domain.env'='.env'; 'compose.yml'='compose.yml';
    'Caddyfile'='Caddyfile'; 'start.sh'='start.sh'; 'backend-image.tar.gz'='backend-image.tar.gz'
}
foreach ($entry in $files.GetEnumerator()) {
    $source=Join-Path $generated $entry.Key
    if (-not (Test-Path $source)) { throw "Arquivo ausente: $($entry.Key)" }
    Update-DeploySshAccess
    if ($entry.Key -eq 'backend-image.tar.gz') {
        $localHash=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
        $remoteHash=& ssh @sshOptions $target 'sha256sum /opt/smtt/backend-image.tar.gz 2>/dev/null'
        if ($LASTEXITCODE -eq 0 -and $remoteHash -and ($remoteHash -split ' ')[0] -eq $localHash) {
            Write-Host 'Imagem ja transferida e hash confirmado.'
            continue
        }
    }
    & scp @sshOptions $source "${target}:/opt/smtt/$($entry.Value)"
    if ($LASTEXITCODE -ne 0) { throw "Transferencia falhou: $($entry.Key)" }
}
if ($Start) {
    Update-DeploySshAccess
    & ssh @sshOptions $target 'sh /opt/smtt/start.sh'
    if ($LASTEXITCODE -ne 0) { throw 'Implantacao nao ficou saudavel; manter Railway.' }
} else { Write-Host 'Arquivos transferidos. Use -Start para iniciar apos validar DNS e uploads.' }
