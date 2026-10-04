[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$generated=Join-Path $PSScriptRoot 'generated'
New-Item -ItemType Directory -Path $generated -Force | Out-Null
& docker build --platform linux/amd64 -t smtt-backend:aws $root
if ($LASTEXITCODE -ne 0) { throw 'Build falhou.' }
$archive=Join-Path $generated 'backend-image.tar'
& docker save smtt-backend:aws --output $archive
if ($LASTEXITCODE -ne 0) { throw 'Exportacao da imagem falhou.' }
& python -c 'import gzip,shutil,sys; from pathlib import Path; p=Path(sys.argv[1]); src=p.open("rb"); dst=gzip.open(p.with_suffix(".tar.gz"),"wb",compresslevel=3); shutil.copyfileobj(src,dst); src.close(); dst.close()' $archive
if ($LASTEXITCODE -ne 0) { throw 'Compressao falhou.' }
Write-Host 'Imagem preparada para transferencia.'
