# Sobe o MongoDB nesta janela. Se ja houver um MongoDB na porta (ex.: o
# servico do Windows), nao faz nada.

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

$mongod = Find-Mongod
if (-not $mongod) {
  Write-Fail 'mongod.exe nao encontrado.'
  Write-Info 'Opcoes: instale o MongoDB Community Server, ou extraia o zip portatil em'
  Write-Info "  $StandaloneDir\mongodb  (de forma que exista mongodb\bin\mongod.exe),"
  Write-Info '  ou informe o caminho em MONGOD_PATH no infra\standalone\.env'
  exit 1
}

if (-not (Test-Path -LiteralPath $MongoDbPath)) {
  New-Item -ItemType Directory -Force -Path $MongoDbPath | Out-Null
  Write-Warn "Pasta de dados nao existia e foi criada (banco VAZIO): $MongoDbPath"
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
