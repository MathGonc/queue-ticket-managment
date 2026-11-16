# Faz um backup do banco agora (o mesmo que a tarefa diaria executa).
# Pasta: BACKUP_DIR (padrao infra\standalone\backups), mantendo os ultimos
# BACKUP_KEEP (padrao 30). Historico das execucoes: infra\standalone\logs\backup.log
#
# Restaurar: veja "Backup do banco" no README desta pasta.

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Backup'

$logDir = Join-Path $StandaloneDir 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'backup.log'

function Write-BackupLog([string]$Text) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Text"
  Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
  Write-Host "  $Text"
}

Write-Step 'Backup do banco'
if (-not (Test-Path -LiteralPath (Join-Path $BackendDir 'node_modules'))) {
  Write-BackupLog 'ERRO: dependencias do backend nao instaladas (rode setup.cmd)'
  exit 1
}

Push-Location $BackendDir
$ErrorActionPreference = 'Continue'
$output = & node scripts\backup-db.js --dir $BackupDir --keep $BackupKeep 2>&1 | ForEach-Object { "$_" }
$code = $LASTEXITCODE
Pop-Location

foreach ($line in $output) { if ($line -match '^(Backup|ERRO)') { Write-BackupLog $line } }
if ($code -ne 0) { Write-BackupLog "FALHOU (codigo $code)"; exit 1 }
