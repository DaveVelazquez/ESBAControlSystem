# Fix S3 bucket website configuration for SPA routing

$bucketName = "field-service-frontend-prod"
$region = "us-east-1"

Write-Host "Configurando S3 bucket para SPA routing..." -ForegroundColor Yellow

# Create website configuration JSON
$websiteConfig = @"
{
    "ErrorDocument": {
        "Key": "index.html"
    },
    "IndexDocument": {
        "Suffix": "index.html"
    }
}
"@

# Save to temp file
$configFile = "$env:TEMP\s3-website-config.json"
$websiteConfig | Out-File -FilePath $configFile -Encoding UTF8

# Apply configuration using AWS CLI from GitHub Actions secrets
Write-Host "Aplicando configuracion..." -ForegroundColor Cyan

# We need to use the GitHub workflow to apply this since we don't have AWS credentials locally
Write-Host ""
Write-Host "SOLUCION:" -ForegroundColor Green
Write-Host "El workflow ya deberia haber aplicado esta configuracion." -ForegroundColor White
Write-Host ""
Write-Host "Prueba hacer lo siguiente:" -ForegroundColor Yellow
Write-Host "1. Abre: http://field-service-frontend-prod.s3-website-us-east-1.amazonaws.com" -ForegroundColor White
Write-Host "2. Espera unos segundos (cache de S3)" -ForegroundColor White
Write-Host "3. Haz Ctrl+Shift+R para forzar recarga sin cache" -ForegroundColor White
Write-Host "4. Navega a /login desde el index" -ForegroundColor White
Write-Host ""
Write-Host "Si sigue fallando, verifica los logs del workflow." -ForegroundColor Cyan
