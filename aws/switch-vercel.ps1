[CmdletBinding()]
param([Parameter(Mandatory)][uri]$BackendUrl)
$ErrorActionPreference = 'Stop'
if ($BackendUrl.Scheme -ne 'https' -or $BackendUrl.AbsolutePath -ne '/' -or $BackendUrl.Query -or $BackendUrl.Fragment -or $BackendUrl.UserInfo) {
    throw 'Informe apenas a origem HTTPS do backend, sem caminho, credenciais ou parametros.'
}
$origin = $BackendUrl.GetLeftPart([UriPartial]::Authority)
$health = Invoke-RestMethod -Uri "$origin/health" -TimeoutSec 20
if ($health.status -ne 'healthy') { throw 'Backend ainda nao esta saudavel.' }
$path = Join-Path (Split-Path $PSScriptRoot -Parent) 'smtt_frontend/vercel.json'
$config = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
$proxy = @($config.rewrites | Where-Object source -eq '/api/:path*')
if ($proxy.Count -ne 1) { throw 'Proxy API ambiguo no vercel.json.' }
$oldOrigin = ([uri]$proxy[0].destination).GetLeftPart([UriPartial]::Authority)
$proxy[0].destination = "$origin/api/:path*"
$legacyProxy = @($config.rewrites | Where-Object source -eq '/static/uploads/:path*')
if ($legacyProxy.Count -gt 1) { throw 'Proxy de uploads ambiguo.' }
if ($legacyProxy.Count -eq 1) { $legacyProxy[0].destination = "$origin/static/uploads/:path*" }
else {
    $config.rewrites = @([pscustomobject]@{source='/static/uploads/:path*';destination="$origin/static/uploads/:path*"}) + @($config.rewrites)
}
foreach ($entry in $config.headers) {
    foreach ($header in $entry.headers) {
        if ($header.key -eq 'Content-Security-Policy') {
            $header.value = $header.value.Replace($oldOrigin, $origin)
        }
    }
}
[IO.File]::WriteAllText($path, ($config | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
Write-Host 'Proxy atualizado localmente. Revise o diff e publique o frontend na Vercel.'
