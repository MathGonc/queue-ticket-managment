# Funcoes e configuracoes compartilhadas pelos scripts do modo standalone.
# Compativel com Windows PowerShell 5.1 (Windows 10). Mantenha este arquivo
# em ASCII: o PowerShell 5.1 le .ps1 sem BOM como ANSI e estraga acentos.

$ErrorActionPreference = 'Stop'

# Saida do node/vite/mongod em UTF-8 (o console do Windows 10 usa a pagina
# de codigo OEM e mostraria acentos e simbolos quebrados)
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }

$StandaloneDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $StandaloneDir '..\..')).Path
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'

function Write-Info([string]$Message) { Write-Host "  $Message" }
function Write-Ok([string]$Message) { Write-Host "  [OK] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "  [AVISO] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "  [ERRO] $Message" -ForegroundColor Red }
function Write-Step([string]$Message) { Write-Host ""; Write-Host "== $Message" -ForegroundColor Cyan }

# Executa um programa externo (npm, node, mongod) e devolve o codigo de saida.
# No PowerShell 5.1, com ErrorActionPreference=Stop, avisos que o programa
# escreve no stderr podem virar erro fatal quando a saida esta redirecionada.
function Invoke-Native([string]$FilePath, [string[]]$Arguments) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    # Out-Host: a saida do programa vai para a tela, nao para o retorno
    & $FilePath @Arguments | Out-Host
    return $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previous
  }
}

function Set-Title([string]$Title) {
  try { $Host.UI.RawUI.WindowTitle = $Title } catch { }
}

# Le um arquivo KEY=VALUE (formato .env). Linhas vazias e # sao ignoradas.
function Read-EnvFile([string]$Path) {
  $vars = @{}
  if (Test-Path -LiteralPath $Path) {
    foreach ($line in Get-Content -LiteralPath $Path) {
      $text = $line.Trim()
      if ($text -eq '' -or $text.StartsWith('#')) { continue }
      $eq = $text.IndexOf('=')
      if ($eq -lt 1) { continue }
      $vars[$text.Substring(0, $eq).Trim()] = $text.Substring($eq + 1).Trim().Trim('"').Trim("'")
    }
  }
  return $vars
}

function Get-Setting([hashtable]$Vars, [string]$Name, [string]$Default) {
  if ($Vars.ContainsKey($Name) -and $Vars[$Name] -ne '') { return $Vars[$Name] }
  return $Default
}

# Grava texto em UTF-8 SEM BOM (o BOM quebraria a primeira linha no dotenv)
function Write-Utf8NoBom([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding $false))
}

function New-RandomHex([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  return -join ($buffer | ForEach-Object { $_.ToString('x2') })
}

function Test-Port([string]$HostName, [int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    if ($async.AsyncWaitHandle.WaitOne(700)) {
      $client.EndConnect($async)
      return $true
    }
    return $false
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-Port([string]$HostName, [int]$Port, [int]$TimeoutSec, [string]$Label) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-Port $HostName $Port) { return $true }
    Start-Sleep -Milliseconds 700
  }
  Write-Fail "$Label nao respondeu em ${HostName}:$Port apos $TimeoutSec s"
  return $false
}

function Test-Http([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
  } catch {
    return $false
  }
}

function Wait-Http([string]$Url, [int]$TimeoutSec, [string]$Label) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-Http $Url) { return $true }
    Start-Sleep -Seconds 1
  }
  Write-Fail "$Label nao respondeu em $Url apos $TimeoutSec s"
  return $false
}

# ---- Configuracao -----------------------------------------------------------
# infra/standalone/.env : mongod, pasta de dados, porta do frontend
# backend/.env          : conexao do banco, porta da API, JWT
# Variaveis de ambiente do processo tem prioridade sobre backend/.env
# (mesma regra do dotenv usado pelo backend).

$StandaloneEnv = Read-EnvFile (Join-Path $StandaloneDir '.env')
$BackendEnv = Read-EnvFile (Join-Path $BackendDir '.env')

function Get-BackendSetting([string]$Name, [string]$Default) {
  $fromProcess = [Environment]::GetEnvironmentVariable($Name)
  if ($fromProcess) { return $fromProcess }
  return (Get-Setting $BackendEnv $Name $Default)
}

$BackendPort = [int](Get-BackendSetting 'PORT' '3030')
$DbIp = Get-BackendSetting 'DB_IP' '127.0.0.1:27017'
$DbHost = ($DbIp -split ':')[0]
$DbPort = 27017
if ($DbIp -match ':(\d+)$') { $DbPort = [int]$Matches[1] }
$DbIsLocal = @('127.0.0.1', 'localhost', '::1') -contains $DbHost

# "mongodb" e o nome do container no Docker: backend\.env esta com config do
# modo Docker (ex.: gerado pela migracao). Encerra com instrucao clara.
function Assert-StandaloneDbConfig {
  if ($DbHost -eq 'mongodb') {
    Write-Fail "backend\.env usa DB_IP=$DbIp (nome do container do modo Docker)."
    Write-Info 'No standalone use DB_IP=127.0.0.1:27017, ou rode: setup.cmd -ResetBackendEnv'
    exit 1
  }
}

$MongodPathSetting = Get-Setting $StandaloneEnv 'MONGOD_PATH' ''
$MongoDbPath = Get-Setting $StandaloneEnv 'MONGO_DBPATH' 'C:\data\db'
$MongoBindIp = Get-Setting $StandaloneEnv 'MONGO_BIND_IP' '127.0.0.1'
$FrontendPort = [int](Get-Setting $StandaloneEnv 'FRONTEND_PORT' '8080')

# Procura o mongod.exe: MONGOD_PATH > portatil em infra\standalone\mongodb >
# PATH > instalacao padrao (versao mais nova)
function Find-Mongod {
  $candidates = @()
  if ($MongodPathSetting) { $candidates += $MongodPathSetting }
  $candidates += (Join-Path $StandaloneDir 'mongodb\bin\mongod.exe')
  $candidates += @(Get-ChildItem (Join-Path $StandaloneDir 'mongodb\*\bin\mongod.exe') -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
  $inPath = Get-Command mongod.exe -ErrorAction SilentlyContinue
  if ($inPath) { $candidates += $inPath.Source }
  $installed = @(Get-ChildItem 'C:\Program Files\MongoDB\Server\*\bin\mongod.exe' -ErrorAction SilentlyContinue)
  $installed = $installed | Sort-Object -Descending {
    try { [version]($_.Directory.Parent.Name) } catch { [version]'0.0' }
  }
  $candidates += @($installed | ForEach-Object { $_.FullName })

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
  }
  return $null
}

# Servico do Windows do MongoDB (instalacao padrao cria "MongoDB").
function Get-MongoService {
  return @(Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'MongoDB*' }) | Select-Object -First 1
}

# Se o MongoDB desta maquina e um servico do Windows, ele e a UNICA fonte do
# banco: nunca subimos outro mongod (poderia abrir um banco vazio).
# Retorna $null se nao ha servico; $true se o servico esta (ou ficou) rodando;
# $false se existe mas nao foi possivel iniciar (precisa de administrador).
function Start-MongoServiceIfPresent {
  $service = Get-MongoService
  if (-not $service) { return $null }
  if ($service.Status -eq 'Running') { return $true }
  Write-Warn "Servico '$($service.Name)' do MongoDB esta parado. Tentando iniciar..."
  try {
    Start-Service -Name $service.Name -ErrorAction Stop
    Write-Ok "Servico '$($service.Name)' iniciado"
    return $true
  } catch {
    Write-Fail "Nao foi possivel iniciar o servico '$($service.Name)': $($_.Exception.Message)"
    Write-Info "Inicie como administrador: services.msc, ou em um terminal de administrador: net start $($service.Name)"
    return $false
  }
}

# VITE_URL apontando para localhost faz OUTRAS maquinas chamarem o proprio
# localhost e nao acharem o backend.
function Test-FrontendEnv {
  $ok = $true
  foreach ($name in @('.env', '.env.local', '.env.production', '.env.production.local')) {
    $path = Join-Path $FrontendDir $name
    $vars = Read-EnvFile $path
    $url = Get-Setting $vars 'VITE_URL' ''
    if ($url -match 'localhost|127\.0\.0\.1') {
      Write-Warn "frontend\$name define VITE_URL=$url"
      Write-Warn "  Outras maquinas da rede nao vao achar o backend. Deixe VITE_URL vazio"
      Write-Warn "  (ou apague o arquivo) e rode o setup de novo para refazer o build."
      $ok = $false
    }
  }
  return $ok
}
