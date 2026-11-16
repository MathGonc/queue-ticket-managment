# Cria a tarefa agendada que roda o start-all na SESSAO do usuario (as
# janelas aparecem na tela). Serve para:
#   - subir o sistema sozinho quando o usuario faz logon (ex.: apos reboot);
#   - subir o sistema remotamente (SSH nao abre janelas na tela do usuario).
#
#   install-autostart.cmd             cria/atualiza (inicia no logon)
#   install-autostart.cmd -SemLogon   cria sem iniciar no logon (so manual)
#   install-autostart.cmd -Executar   cria/atualiza e ja dispara agora
#   install-autostart.cmd -Remover    remove a tarefa

param([switch]$SemLogon, [switch]$Executar, [switch]$Remover)

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Inicio automatico'

$TaskName = 'QTM - Sistema de Senhas'
$user = "$env:USERDOMAIN\$env:USERNAME"

Write-Step "Tarefa agendada '$TaskName'"

if ($Remover) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Ok 'Removida'
  return
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$StandaloneDir\start-all.ps1`"" `
  -WorkingDirectory $RepoRoot
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
$register = @{
  TaskName = $TaskName
  Action = $action
  Settings = $settings
  Description = "Sobe MongoDB, backend e frontend do sistema de senhas ($StandaloneDir\start-all.ps1)"
  Force = $true
}
if (-not $SemLogon) {
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
  $trigger.Delay = 'PT30S'   # da tempo da rede e do servico do Mongo subirem
  $register.Trigger = $trigger
}

# Privilegio normal (nao elevado), de proposito: janelas elevadas nao podem
# ser fechadas pelo stop-all.cmd aberto com duplo clique. O servico do MongoDB
# ja inicia sozinho com o Windows.
try {
  $register.Principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask @register -ErrorAction Stop | Out-Null
  Write-Ok "Criada para $user"
} catch {
  Write-Fail "Nao foi possivel criar a tarefa: $($_.Exception.Message)"
  exit 1
}

if ($SemLogon) { Write-Info 'Sem inicio no logon (dispare manualmente).' }
else { Write-Info 'Inicia sozinha 30 s apos o logon deste usuario.' }

if ($Executar) {
  Start-ScheduledTask -TaskName $TaskName
  Write-Ok 'Disparada: as janelas abrem na sessao do usuario logado.'
}
