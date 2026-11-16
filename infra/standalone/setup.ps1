# Prepara (ou atualiza) o sistema no modo standalone:
#   - instala dependencias do backend e do frontend
#   - cria backend\.env (com JWT_SECRET aleatorio) e infra\standalone\.env
#   - gera o build do frontend
# Rode na primeira instalacao e sempre depois de atualizar o codigo.
#
#   setup.cmd                    uso normal
#   setup.cmd -ResetBackendEnv   recria backend\.env (faz backup do atual)

param([switch]$ResetBackendEnv)

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - Setup'

function Invoke-Npm([string]$Dir, [string[]]$NpmArgs) {
  Push-Location $Dir
  try {
    $code = Invoke-Native 'npm' $NpmArgs
    if ($code -ne 0) { throw "npm $($NpmArgs -join ' ') falhou em $Dir (codigo $code)" }
  } finally {
    Pop-Location
  }
}

try {
  Write-Step 'Node.js'
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js nao encontrado. Instale o Node.js 22 LTS (https://nodejs.org).'
  }
  $nodeVersion = (& node -v)
  $major = [int]($nodeVersion.TrimStart('v').Split('.')[0])
  if ($major -lt 20) { throw "Node.js $nodeVersion e antigo demais. Instale o Node.js 22 LTS." }
  Write-Ok "Node.js $nodeVersion"

  Write-Step 'Configuracao do standalone (infra\standalone\.env)'
  $standaloneEnvPath = Join-Path $StandaloneDir '.env'
  if (Test-Path -LiteralPath $standaloneEnvPath) {
    Write-Ok 'Ja existe, mantido'
  } else {
    Copy-Item (Join-Path $StandaloneDir '.env.example') $standaloneEnvPath
    Write-Ok 'Criado a partir do .env.example (revise MONGO_DBPATH)'
  }

  Write-Step 'Configuracao do backend (backend\.env)'
  $backendEnvPath = Join-Path $BackendDir '.env'
  if ($ResetBackendEnv -and (Test-Path -LiteralPath $backendEnvPath)) {
    $backup = "$backendEnvPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item -LiteralPath $backendEnvPath $backup
    Write-Info "Backup do .env anterior: $backup"
  }
  if (-not (Test-Path -LiteralPath $backendEnvPath)) {
    $template = Get-Content -LiteralPath (Join-Path $BackendDir '.env.example') -Raw
    $content = $template -replace '(?m)^JWT_SECRET=.*$', "JWT_SECRET=$(New-RandomHex)"
    Write-Utf8NoBom $backendEnvPath $content
    Write-Ok 'Criado com JWT_SECRET aleatorio (banco local sem usuario/senha)'
    Write-Info 'Se o MongoDB usa autenticacao, preencha DB_USER e DB_PASS em backend\.env'
  } else {
    $current = Read-EnvFile $backendEnvPath
    $problems = 0
    if (-not (Get-Setting $current 'JWT_SECRET' '')) {
      Write-Fail 'JWT_SECRET vazio em backend\.env (o backend nao inicia sem ele)'
      $problems++
    }
    $currentDbIp = Get-Setting $current 'DB_IP' '127.0.0.1:27017'
    if ($currentDbIp -like 'mongodb:*') {
      Write-Fail "DB_IP=$currentDbIp e o nome do container Docker; no standalone use 127.0.0.1:27017"
      $problems++
    }
    if ($problems -gt 0) {
      Write-Warn 'Corrija backend\.env ou rode: setup.cmd -ResetBackendEnv'
    } else {
      Write-Ok 'Ja existe, mantido'
    }
  }

  Write-Step 'Backend: dependencias (npm ci)'
  Invoke-Npm $BackendDir @('ci', '--no-audit', '--no-fund')
  Write-Ok 'Backend pronto'

  Write-Step 'Frontend: dependencias (npm ci)'
  Invoke-Npm $FrontendDir @('ci', '--no-audit', '--no-fund')
  Write-Ok 'Dependencias do frontend instaladas'

  Write-Step 'Frontend: build de producao'
  [void](Test-FrontendEnv)
  Invoke-Npm $FrontendDir @('run', 'build')
  Write-Ok 'Build gerado em frontend\dist'

  Write-Step 'Pronto'
  Write-Info 'Primeira instalacao (banco novo)? Crie o administrador:  create-admin.cmd'
  Write-Info 'Para subir tudo:                                         start-all.cmd'
} catch {
  Write-Fail $_.Exception.Message
  Write-Info 'Se o erro for EPERM/EBUSY, feche as janelas do sistema (backend/frontend) e rode de novo.'
  exit 1
}
