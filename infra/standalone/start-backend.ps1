# Sobe o backend (API + WebSocket) nesta janela. Reinicia sozinho se cair.

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Backend'

Write-Step 'Backend'

if (-not (Test-Path -LiteralPath (Join-Path $BackendDir 'node_modules'))) {
  Write-Fail 'Dependencias do backend nao instaladas. Rode setup.cmd primeiro.'
  exit 1
}
if (-not (Get-BackendSetting 'JWT_SECRET' '')) {
  Write-Fail 'JWT_SECRET nao definido (backend\.env ausente ou incompleto). Rode setup.cmd.'
  exit 1
}
Assert-StandaloneDbConfig

if ($DbIsLocal) {
  Write-Info "Aguardando o MongoDB em 127.0.0.1:$DbPort ..."
  if (-not (Wait-Port '127.0.0.1' $DbPort 90 'MongoDB')) {
    Write-Info 'Suba o banco antes (start-mongo.cmd ou servico do Windows).'
    exit 1
  }
}

Set-Location $BackendDir
Write-Info "API em http://0.0.0.0:$BackendPort  (Ctrl+C para parar)"
Write-Host ''

# Processo longo chamado direto (console real: cores, Ctrl+C). Continue:
# avisos no stderr nao podem derrubar o script (PowerShell 5.1).
$ErrorActionPreference = 'Continue'
while ($true) {
  & node server.js
  Write-Warn "Backend encerrou (codigo $LASTEXITCODE). Reiniciando em 5 s... (Ctrl+C para sair)"
  Start-Sleep -Seconds 5
}
