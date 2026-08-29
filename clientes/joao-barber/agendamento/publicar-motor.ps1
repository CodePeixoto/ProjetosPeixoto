<#
  publicar-motor.ps1  -  João Barber · agendamento

  Sobe o apps-script.gs pra conta Google do João e publica uma nova versão
  do App da Web MANTENDO a mesma URL /exec.

  Antes de usar (uma vez só): ver CLASP.md nessa pasta.
    1. npm install -g @google/clasp
    2. clasp login                      (no navegador, na conta do João)
    3. clasp clone <scriptId> --rootDir .    <-- CLONE, não "create":
       o motor já existe na conta do João. "create" faria um projeto novo,
       com URL nova, e o site continuaria apontando pro antigo.
    4. .deployment-id já vem preenchido com o deployment que está no ar
       (o id é o pedaço da URL entre /s/ e /exec).

  Uso no dia a dia:
    ./publicar-motor.ps1 -Nota "ajuste no cálculo de horário"
    ./publicar-motor.ps1 -SoPush         # só sobe o código, sem nova versão
    ./publicar-motor.ps1 -Status         # quem está logado + deployments
    ./publicar-motor.ps1 -PrimeiraVez    # SÓ pra projeto novo, do zero
#>

param(
  [string]$Nota = "",
  [switch]$SoPush,
  [switch]$Status,
  [switch]$PrimeiraVez
)

# De propósito SEM $ErrorActionPreference = "Stop": no PowerShell 5.1 a saída
# de erro de um executável vira erro de terminação e abortaria o script no
# meio (entre o push e o deploy, o pior lugar pra parar). Cada passo confere
# o próprio $LASTEXITCODE.
Set-Location $PSScriptRoot
$idFile = Join-Path $PSScriptRoot ".deployment-id"

function Erro($msg) { Write-Host "ERRO: $msg" -ForegroundColor Red; exit 1 }

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  Erro "clasp nao encontrado. Rode:  npm install -g @google/clasp   (ver CLASP.md)"
}
if (-not (Test-Path ".clasp.json")) {
  Erro ".clasp.json nao existe. Logado na conta do Joao, rode 'clasp clone <scriptId> --rootDir .' (ver CLASP.md, passo 2)."
}

if ($Status) {
  Write-Host "== Conta autorizada ==" -ForegroundColor Cyan
  clasp show-authorized-user
  Write-Host "`n== Deployments ==" -ForegroundColor Cyan
  clasp list-deployments
  if (Test-Path $idFile) {
    Write-Host "`ndeployment que este script atualiza (.deployment-id):" -ForegroundColor DarkGray
    Write-Host "  $(Get-Content $idFile)" -ForegroundColor DarkGray
  } else {
    Write-Host "`n.deployment-id nao existe: o script nao sabe qual deployment atualizar." -ForegroundColor Yellow
  }
  exit 0
}

Write-Host "== clasp push ==" -ForegroundColor Cyan
clasp push -f
if ($LASTEXITCODE -ne 0) { Erro "clasp push falhou." }

if ($SoPush) {
  Write-Host "OK: codigo atualizado no editor. Nenhuma versao nova publicada." -ForegroundColor Green
  exit 0
}

# A descricao comeca com a data, entao NUNCA usar ela pra achar numero de
# versao: "2026-08-29" viraria a versao 2026.
$carimbo = Get-Date -Format "yyyy-MM-dd HH:mm"
$desc = if ($Nota) { "$carimbo - $Nota" } else { "$carimbo - publicar-motor.ps1" }

# Le o maior numero de versao existente. E a fonte confiavel: nao depende
# do formato do texto que o create-version imprime.
function UltimaVersao {
  $saida = clasp list-versions
  if ($LASTEXITCODE -ne 0) { return 0 }
  $nums = [regex]::Matches(($saida | Out-String), '(?m)^\s*(\d+)\s') |
          ForEach-Object { [int]$_.Groups[1].Value }
  if ($nums.Count -eq 0) { return 0 }
  ($nums | Measure-Object -Maximum).Maximum
}

if ($PrimeiraVez) {
  if (Test-Path $idFile) {
    Erro ".deployment-id ja existe ($(Get-Content $idFile)). -PrimeiraVez criaria um SEGUNDO deployment, com outra URL, e o site continuaria no antigo. Use sem -PrimeiraVez."
  }
  Write-Host "== Criando o deployment estavel ==" -ForegroundColor Cyan
  $out = clasp create-deployment -d $desc | Out-String
  Write-Host $out
  if ($LASTEXITCODE -ne 0) { Erro "clasp create-deployment falhou." }
  $m = [regex]::Match($out, "AKfyc[A-Za-z0-9_\-]+")
  if (-not $m.Success) { Erro "Nao consegui achar o deploymentId na saida. Rode 'clasp list-deployments', copie o id (AKfyc...) e salve em .deployment-id na mao." }
  Set-Content -Path $idFile -Value $m.Value -Encoding ascii
  Write-Host "deploymentId salvo em .deployment-id: $($m.Value)" -ForegroundColor Green
  Write-Host "`nPegue a URL /exec com:  clasp list-deployments" -ForegroundColor DarkGray
  exit 0
}

if (-not (Test-Path $idFile)) {
  Erro "Sem .deployment-id. Se o motor JA esta no ar, copie o pedaco da URL entre /s/ e /exec pra dentro de .deployment-id. Se e um projeto novo, rode: ./publicar-motor.ps1 -PrimeiraVez"
}
$deployId = (Get-Content $idFile).Trim()

$antes = UltimaVersao

Write-Host "== Criando versao imutavel ==" -ForegroundColor Cyan
clasp create-version $desc
if ($LASTEXITCODE -ne 0) { Erro "clasp create-version falhou." }

$versao = UltimaVersao
if ($versao -le $antes) {
  Erro "A versao nao avancou (antes: $antes, agora: $versao). Confira com 'clasp list-versions'."
}

Write-Host "== Apontando o deployment $deployId pra versao $versao ==" -ForegroundColor Cyan
clasp update-deployment -V $versao -d $desc $deployId
if ($LASTEXITCODE -ne 0) { Erro "clasp update-deployment falhou." }

Write-Host "`nOK. Versao $versao no ar. A URL /exec continua a mesma." -ForegroundColor Green
