# Confere se MongoDB, backend e frontend estao respondendo e mostra os
# enderecos para acessar pela rede. Codigo de saida 0 = tudo ok.

. (Join-Path $PSScriptRoot '_common.ps1')

Write-Step 'Status'
Assert-StandaloneDbConfig
$failures = 0

if ($DbIsLocal) {
  if (Test-Port '127.0.0.1' $DbPort) { Write-Ok "MongoDB    127.0.0.1:$DbPort" }
  else { Write-Fail "MongoDB    nao responde em 127.0.0.1:$DbPort"; $failures++ }
} else {
  Write-Info "MongoDB    remoto ($DbIp), verificado pelo backend abaixo"
}

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/health" -TimeoutSec 4
  if ($health.mongodb -eq 'connected') { Write-Ok "Backend    porta $BackendPort (banco conectado)" }
  else { Write-Fail "Backend    porta $BackendPort responde, mas o banco esta: $($health.mongodb)"; $failures++ }
} catch {
  Write-Fail "Backend    nao responde em http://127.0.0.1:$BackendPort/health"
  $failures++
}

if (Test-Http "http://127.0.0.1:$FrontendPort/") { Write-Ok "Frontend   porta $FrontendPort" }
else { Write-Fail "Frontend   nao responde em http://127.0.0.1:$FrontendPort/"; $failures++ }

Write-Step 'Acesso pela rede'
$addresses = @()
try {
  $addresses = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -ExpandProperty IPAddress)
} catch { }
foreach ($ip in $addresses) { Write-Info "http://${ip}:$FrontendPort" }
Write-Info "(liberar no Firewall do Windows as portas TCP $FrontendPort e $BackendPort)"

if ($failures -gt 0) { exit 1 }
