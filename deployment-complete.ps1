Write-Host "=== DEPLOYMENT COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para obtener las URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. GitHub Actions:" -ForegroundColor Cyan
Write-Host "   https://github.com/DaveVelazquez/ESBAControlSystem/actions"
Write-Host ""
Write-Host "2. AWS Console - ECS:" -ForegroundColor Cyan
Write-Host "   https://console.aws.amazon.com/ecs/v2/clusters"
Write-Host "   Buscar: field-service-cluster"
Write-Host ""
Write-Host "3. AWS Console - S3:" -ForegroundColor Cyan
Write-Host "   https://console.aws.amazon.com/s3/"
Write-Host "   Buscar bucket que empiece con: field-service-frontend"
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Green
Write-Host "Email: admin@fieldservice.com"
Write-Host "Password: admin123"