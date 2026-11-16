# Para o backend e o frontend (fecha as janelas "QTM - Backend/Frontend").
# O MongoDB nao e parado: se for servico do Windows, continua; se estiver na
# janela "QTM - MongoDB", feche-a manualmente quando quiser.
# Processos de OUTRO sistema nas mesmas portas sao apenas informados.

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Parar'

Write-Step 'Parando backend e frontend'
# Pela linha de comando (start-backend/start-frontend desta instalacao) e,
# como reserva, pelo titulo da janela (a linha de comando de processos
# elevados nao e visivel para um terminal comum)
$targets = @{}
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object {
  $_.CommandLine -match 'start-(backend|frontend)\.ps1' -and $_.CommandLine -like "*$StandaloneDir*"
} | ForEach-Object { $targets[[int]$_.ProcessId] = [regex]::Match($_.CommandLine, 'start-\w+\.ps1').Value }
Get-Process -Name powershell -ErrorAction SilentlyContinue | Where-Object {
  $_.MainWindowTitle -in @('QTM - Backend', 'QTM - Frontend')
} | ForEach-Object { if (-not $targets.ContainsKey($_.Id)) { $targets[$_.Id] = $_.MainWindowTitle } }

if ($targets.Count -eq 0) { Write-Info 'Nenhuma janela do sistema encontrada.' }
# taskkill escreve no stderr quando falha; nao pode derrubar o script (PS 5.1)
$ErrorActionPreference = 'Continue'
foreach ($id in $targets.Keys) {
  $output = & taskkill.exe /T /F /PID $id 2>&1
  if ($LASTEXITCODE -eq 0) { Write-Ok "Fechado: $($targets[$id]) (PID $id)" }
  else { Write-Fail "Sem permissao para fechar $($targets[$id]) (PID $id). Rode o stop-all como administrador." }
}

Start-Sleep -Seconds 2
$busy = 0
foreach ($port in @($BackendPort, $FrontendPort)) {
  $owner = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($owner) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.OwningProcess)"
    Write-Warn "Porta $port ainda ocupada por PID $($owner.OwningProcess) ($($proc.Name)) $($proc.CommandLine)"
    if (-not $proc.CommandLine) { Write-Info '  (processo elevado ou de outro usuario: rode o stop-all como administrador)' }
    $busy++
  }
}
if ($busy -eq 0) { Write-Ok "Portas $BackendPort e $FrontendPort livres" } else { exit 1 }
