# Sobe o MongoDB nesta janela. Regras de seguranca:
#  - se ja houver um MongoDB na porta, nao faz nada;
#  - se o MongoDB da maquina for um servico do Windows, so tenta iniciar o
#    servico (nunca sobe outro mongod, que poderia abrir um banco vazio);
#  - nunca cria a pasta de dados sozinho: banco novo so com -NovoBanco.
#
#   start-mongo.cmd              uso normal
#   start-mongo.cmd -NovoBanco   primeira instalacao: cria MONGO_DBPATH vazio

param([switch]$NovoBanco)

. (Join-Path $PSScriptRoot '_common.ps1')
Set-Title 'QTM - MongoDB'

Write-Step 'MongoDB'
Assert-StandaloneDbConfig

if (-not $DbIsLocal) {
  Write-Info "backend\.env aponta para um MongoDB em outra maquina ($DbIp). Nada a fazer aqui."
  return
}

if (Test-Port '127.0.0.1' $DbPort) {
  Write-Ok "Ja existe um MongoDB ouvindo em 127.0.0.1:$DbPort (servico do Windows ou outra janela)."
  return
}

$service = Start-MongoServiceIfPresent
if ($service -eq $true) {
  if (Wait-Port '127.0.0.1' $DbPort 60 'MongoDB (servico)') { Write-Ok 'MongoDB no ar pelo servico do Windows.'; return }
  exit 1
}
if ($service -eq $false) { exit 1 }

$mongod = Find-Mongod
if (-not $mongod) {
  Write-Fail 'mongod.exe nao encontrado.'
  Write-Info 'Opcoes: instale o MongoDB Community Server, ou extraia o zip portatil em'
  Write-Info "  $StandaloneDir\mongodb  (de forma que exista mongodb\bin\mongod.exe),"
  Write-Info '  ou informe o caminho em MONGOD_PATH no infra\standalone\.env'
  exit 1
}

if (-not (Test-Path -LiteralPath $MongoDbPath)) {
  if (-not $NovoBanco) {
    Write-Fail "A pasta de dados nao existe: $MongoDbPath"
    Write-Info 'Subir assim abriria um banco VAZIO (sem usuarios nem senhas).'
    Write-Info 'Se o banco atual esta em outra pasta, corrija MONGO_DBPATH em infra\standalone\.env.'
    Write-Info 'Se e mesmo a primeira instalacao: start-mongo.cmd -NovoBanco'
    exit 1
  }
  New-Item -ItemType Directory -Force -Path $MongoDbPath | Out-Null
  Write-Warn "Banco NOVO criado em: $MongoDbPath"
}

Write-Info "mongod : $mongod"
Write-Info "dados  : $MongoDbPath"
Write-Info "porta  : $DbPort (bind $MongoBindIp)"
Write-Info 'Feche esta janela (ou Ctrl+C) para parar o banco.'
Write-Host ''

# Processo longo chamado direto (console real: cores, Ctrl+C). Continue:
# avisos no stderr nao podem derrubar o script (PowerShell 5.1).
$ErrorActionPreference = 'Continue'
& $mongod --dbpath $MongoDbPath --port $DbPort --bind_ip $MongoBindIp
Write-Warn "mongod encerrou (codigo $LASTEXITCODE)."
