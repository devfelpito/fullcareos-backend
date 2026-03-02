Write-Host "=================================================="
Write-Host " DEBUG LOGIN FULLCAREOS (PowerShell)"
Write-Host "=================================================="

Write-Host ""
Write-Host "1) Ambiente atual"
Write-Host "PWD: $((Get-Location).Path)"
Write-Host "Node: $(node -v)"
Write-Host "NPM: $(npm -v)"

Write-Host ""
Write-Host "2) Arquivos de env"

if (Test-Path ".env") {
  Write-Host "[OK] .env encontrado"
  Write-Host "Conteúdo (mascarando JWT_SECRET):"
  (Get-Content ".env") -replace '^(JWT_SECRET=).+$','$1***MASKED***' | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "[ERRO] .env NÃO encontrado na raiz do backend"
}

if (Test-Path "frontend/.env.local") {
  Write-Host "[OK] frontend/.env.local encontrado"
  Get-Content "frontend/.env.local" | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "[ERRO] frontend/.env.local NÃO encontrado"
}

Write-Host ""
Write-Host "3) Porta esperada"
$port = 3000
if (Test-Path ".env") {
  $line = Get-Content ".env" | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1
  if ($line) { $port = ($line -split '=',2)[1] }
}
Write-Host "Porta esperada do backend: $port"

Write-Host ""
Write-Host "4) Healthcheck backend"
try {
  $hc = Invoke-WebRequest -Uri "http://localhost:$port/" -Method GET -UseBasicParsing
  Write-Host "Status: $($hc.StatusCode)"
} catch {
  Write-Host "[ERRO] Backend não respondeu em http://localhost:$port/"
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "5) Teste login direto no backend"
$body = @{ email = "admin@fullcareos.com"; password = "Fullcare123" } | ConvertTo-Json
try {
  $resp = Invoke-WebRequest -Uri "http://localhost:$port/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
  Write-Host "Status login: $($resp.StatusCode)"
  Write-Host $resp.Content
} catch {
  if ($_.Exception.Response) {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "Status login: $status"
  } else {
    Write-Host "[ERRO] Falha de conexão no /api/auth/login"
  }
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "6) Rodando seed"
npm run seed

Write-Host ""
Write-Host "7) Re-teste login pós-seed"
try {
  $resp2 = Invoke-WebRequest -Uri "http://localhost:$port/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
  Write-Host "Status login pós-seed: $($resp2.StatusCode)"
  Write-Host $resp2.Content
} catch {
  if ($_.Exception.Response) {
    $status2 = $_.Exception.Response.StatusCode.value__
    Write-Host "Status login pós-seed: $status2"
  } else {
    Write-Host "[ERRO] Falha de conexão no /api/auth/login pós-seed"
  }
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "8) Dica frontend"
Write-Host "NEXT_PUBLIC_API_URL=http://localhost:$port/api"

Write-Host "=================================================="
Write-Host " FIM"
Write-Host "=================================================="
