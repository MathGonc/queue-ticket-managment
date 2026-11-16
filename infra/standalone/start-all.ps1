# Sobe MongoDB, backend e frontend, cada um na sua janela, na ordem certa,
# e no final mostra o status. O que ja estiver rodando e mantido.

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Inicializacao'

function Start-Window([string]$Script) {
  $path = Join-Path $StandaloneDir $Script
  # Start-Process do PowerShell 5.1 nao poe aspas sozinho: caminhos com espaco
  $arguments = "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$path`""
  Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $RepoRoot | Out-Null
}

Assert-StandaloneDbConfig

Write-Step '1/3 MongoDB'
if (-not $DbIsLocal) {
  Write-Info "Banco remoto ($DbIp), nada a subir aqui."
} elseif (Test-Port '127.0.0.1' $DbPort) {
  Write-Ok 'Ja estava rodando'
} else {
  Start-Window 'start-mongo.ps1'
  if (-not (Wait-Port '127.0.0.1' $DbPort 60 'MongoDB')) { Write-Info 'Veja a janela "QTM - MongoDB".'; exit 1 }
  Write-Ok 'MongoDB no ar'
}

Write-Step '2/3 Backend'
$healthUrl = "http://127.0.0.1:$BackendPort/health"
if (Test-Http $healthUrl) {
  Write-Ok 'Ja estava rodando'
} else {
  Start-Window 'start-backend.ps1'
  if (-not (Wait-Http $healthUrl 90 'Backend')) { Write-Info 'Veja a janela "QTM - Backend".'; exit 1 }
  Write-Ok 'Backend no ar'
}

Write-Step '3/3 Frontend'
if (Test-Port '127.0.0.1' $FrontendPort) {
  Write-Ok 'Ja estava rodando'
} else {
  Start-Window 'start-frontend.ps1'
  # Pode levar mais na primeira vez se precisar refazer o build
  if (-not (Wait-Port '127.0.0.1' $FrontendPort 240 'Frontend')) { Write-Info 'Veja a janela "QTM - Frontend".'; exit 1 }
  Write-Ok 'Frontend no ar'
}

& (Join-Path $StandaloneDir 'status.ps1')
exit $LASTEXITCODE
