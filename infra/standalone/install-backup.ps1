# Cria a tarefa agendada de backup diario do banco.
#
#   install-backup.cmd             cria/atualiza (todo dia em BACKUP_TIME, padrao 20:00)
#   install-backup.cmd -Executar   cria/atualiza e ja faz um backup agora
#   install-backup.cmd -Remover    remove a tarefa
#
# Como administrador, a tarefa roda mesmo sem ninguem logado. Sem
# administrador, roda so com o usuario logado. Se o PC estiver desligado no
# horario, o backup e feito assim que ele ligar.

param([switch]$Executar, [switch]$Remover)

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Backup automatico'

$TaskName = 'QTM - Backup do banco'
$user = "$env:USERDOMAIN\$env:USERNAME"

Write-Step "Tarefa agendada '$TaskName'"

if ($Remover) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Ok 'Removida'
  return
}

$at = [datetime]::ParseExact($BackupTime, 'HH:mm', $null)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StandaloneDir\backup.ps1`"" `
  -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $at
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
$register = @{
  TaskName = $TaskName; Action = $action; Trigger = $trigger; Settings = $settings; Force = $true
  Description = "Backup diario do banco do sistema de senhas em $BackupDir (mantem $BackupKeep)"
}

# S4U: roda sem ninguem logado e sem guardar senha (precisa de administrador)
$mode = $null
foreach ($logonType in @('S4U', 'Interactive')) {
  try {
    $register.Principal = New-ScheduledTaskPrincipal -UserId $user -LogonType $logonType -RunLevel Limited
    Register-ScheduledTask @register -ErrorAction Stop | Out-Null
    $mode = $logonType
    break
  } catch { }
}
if (-not $mode) { Write-Fail 'Nao foi possivel criar a tarefa.'; exit 1 }
if ($mode -eq 'S4U') { Write-Ok "Criada: todo dia as $BackupTime, mesmo sem usuario logado" }
else { Write-Warn "Criada: todo dia as $BackupTime, so com $user logado (rode como administrador para rodar sempre)" }
Write-Info "Pasta: $BackupDir (mantem os ultimos $BackupKeep)"

if ($Executar) {
  Start-ScheduledTask -TaskName $TaskName
  Write-Ok 'Backup disparado agora (resultado em infra\standalone\logs\backup.log)'
}
