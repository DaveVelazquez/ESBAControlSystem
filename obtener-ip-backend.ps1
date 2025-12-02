# Script para obtener IP del backend una vez completado el deployment

Write-Host "=== OBTENER IP DEL BACKEND ===" -ForegroundColor Green
Write-Host ""

Write-Host "MÉTODO 1: AWS Console (Recomendado)" -ForegroundColor Blue
Write-Host "1. Ve a: https://console.aws.amazon.com/ecs/v2/clusters/field-service-cluster" -ForegroundColor Cyan
Write-Host "2. Click en 'Services'" -ForegroundColor White
Write-Host "3. Click en 'backend-service'" -ForegroundColor White
Write-Host "4. Pestaña 'Tasks'" -ForegroundColor White
Write-Host "5. Click en la task activa (debería mostrar RUNNING)" -ForegroundColor White
Write-Host "6. Sección 'Network' → Copiar 'Public IP'" -ForegroundColor White
Write-Host ""

Write-Host "MÉTODO 2: GitHub Actions Logs" -ForegroundColor Blue
Write-Host "1. Ve a: https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor Cyan
Write-Host "2. Click en el workflow 'Create ECS Service Only' más reciente" -ForegroundColor White
Write-Host "3. Busca en los logs la línea con la Public IP" -ForegroundColor White
Write-Host ""

Write-Host "UNA VEZ QUE TENGAS LA IP:" -ForegroundColor Magenta
Write-Host "• Backend URL: http://[IP]:3000" -ForegroundColor Yellow
Write-Host "• Health Check: http://[IP]:3000/health" -ForegroundColor Yellow
Write-Host "• Probar en navegador que responda" -ForegroundColor Yellow
Write-Host ""

Write-Host "DESPUÉS PROBAR LOGIN:" -ForegroundColor Green
Write-Host "• Frontend: http://field-service-frontend-prod.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan
Write-Host "• Email: admin@fieldservice.com" -ForegroundColor White
Write-Host "• Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "El sistema estará 100% funcional una vez que obtengas la IP!" -ForegroundColor Green