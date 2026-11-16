# Serve o frontend na rede nesta janela.
#   start-frontend.cmd          build de producao (refaz o build se o codigo mudou)
#   start-frontend.cmd -Build   forca um build novo antes de servir
#   start-frontend.cmd -Dev     servidor de desenvolvimento (hot reload)

param([switch]$Dev, [switch]$Build)

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Frontend'

Write-Step 'Frontend'

if (-not (Test-Path -LiteralPath (Join-Path $FrontendDir 'node_modules'))) {
  Write-Fail 'Dependencias do frontend nao instaladas. Rode setup.cmd primeiro.'
  exit 1
}

[void](Test-FrontendEnv)
Set-Location $FrontendDir

# Processo longo chamado direto (console real: cores, Ctrl+C). Continue:
# avisos no stderr nao podem derrubar o script (PowerShell 5.1).
$ErrorActionPreference = 'Continue'

if ($Dev) {
  Write-Info "Modo desenvolvimento em http://0.0.0.0:$FrontendPort"
  & npm run dev -- --port $FrontendPort
  exit $LASTEXITCODE
}

# Refaz o build se nao existir ou se algum fonte for mais novo que ele
# (ex.: depois de um git pull sem rodar o setup)
$distIndex = Join-Path $FrontendDir 'dist\index.html'
if (-not $Build) {
  if (-not (Test-Path -LiteralPath $distIndex)) {
    $Build = $true
  } else {
    $builtAt = (Get-Item -LiteralPath $distIndex).LastWriteTime
    $sources = @(Get-ChildItem -LiteralPath (Join-Path $FrontendDir 'src') -Recurse -File)
    $sources += @(Get-ChildItem -LiteralPath $FrontendDir -File | Where-Object { $_.Name -match '^(index\.html|package(-lock)?\.json|vite\.config\.js|\.env.*)$' })
    $newer = $sources | Where-Object { $_.LastWriteTime -gt $builtAt } | Select-Object -First 1
    if ($newer) {
      Write-Info "Codigo mudou desde o ultimo build ($($newer.Name)). Refazendo o build..."
      $Build = $true
    }
  }
}
if ($Build) {
  & npm run build
  if ($LASTEXITCODE -ne 0) { Write-Fail 'Build do frontend falhou.'; exit 1 }
}

Write-Info "Frontend em http://0.0.0.0:$FrontendPort  (Ctrl+C para parar)"
Write-Host ''

while ($true) {
  & npm run preview -- --port $FrontendPort
  Write-Warn "Frontend encerrou (codigo $LASTEXITCODE). Reiniciando em 5 s... (Ctrl+C para sair)"
  Start-Sleep -Seconds 5
}
