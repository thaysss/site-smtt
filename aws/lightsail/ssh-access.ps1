[CmdletBinding()]
param([string]$Region='sa-east-1',[string]$InstanceName='smtt-backend')
$ErrorActionPreference='Stop'
$generated=Join-Path $PSScriptRoot 'generated'
New-Item -ItemType Directory -Path $generated -Force | Out-Null
$data=& aws lightsail get-instance-access-details --instance-name $InstanceName --protocol ssh --region $Region --output json --no-cli-pager --cli-connect-timeout 10 --cli-read-timeout 30
if ($LASTEXITCODE -ne 0) { throw 'Falha ao obter acesso temporario SSH.' }
$details=($data | ConvertFrom-Json).accessDetails
$keyPath=Join-Path $generated 'ssh-key'
$certPath=Join-Path $generated 'ssh-key-cert.pub'
$knownPath=Join-Path $generated 'known_hosts'
$principal=[Security.Principal.WindowsIdentity]::GetCurrent().Name
if (Test-Path $keyPath) {
    & icacls $keyPath /grant:r "${principal}:(R,W)" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao renovar permissoes da chave.' }
}
[IO.File]::WriteAllText($keyPath,$details.privateKey,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($certPath,$details.certKey + "`n",[Text.UTF8Encoding]::new($false))
$lines=@($details.hostKeys | ForEach-Object { "$($details.ipAddress) $($_.algorithm) $($_.publicKey)" })
if ($lines.Count) {
    [IO.File]::WriteAllText($knownPath,($lines -join "`n") + "`n",[Text.UTF8Encoding]::new($false))
} elseif (-not (Test-Path $knownPath)) {
    # First connection to the IP verified by the AWS API records the host key.
    # Preserve that key on subsequent refreshes; never disable host checking.
    [IO.File]::WriteAllText($knownPath,'',[Text.UTF8Encoding]::new($false))
}
$principal=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $keyPath /inheritance:r /grant:r "${principal}:(R)" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falha ao restringir permissoes da chave SSH.' }
$connection=@{ip=$details.ipAddress;username=$details.username;expiresAt=$details.expiresAt;region=$Region;instanceName=$InstanceName}
[IO.File]::WriteAllText((Join-Path $generated 'connection.json'),($connection | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Host "Acesso temporario SSH preparado para $($details.username)@$($details.ipAddress)."
