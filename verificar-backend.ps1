# Script para verificar estado del backend

Write-Host "=== VERIFICANDO BACKEND API ===" -ForegroundColor Green
Write-Host "IP: 34.227.91.123" -ForegroundColor Yellow
Write-Host ""

$endpoints = @(
    "http://34.227.91.123:3000/health",
    "http://34.227.91.123:3000/api",
    "http://34.227.91.123:3000/"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Probando: $endpoint" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        if ($response.Content.Length -lt 500) {
            Write-Host "Response: $($response.Content)" -ForegroundColor White
        } else {
            Write-Host "Response: [Content too long - API working]" -ForegroundColor White
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "SIGUIENTE PASO:" -ForegroundColor Magenta
Write-Host "Si algún endpoint responde, probar login en:" -ForegroundColor White
Write-Host "http://field-service-frontend-prod.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Blue
Write-Host "Email: admin@fieldservice.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White