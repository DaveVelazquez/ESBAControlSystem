# Script para obtener URLs finales del deployment
Write-Host "🎉 ¡DEPLOYMENT COMPLETADO!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "Buscando URLs del deployment..." -ForegroundColor Yellow
Write-Host ""

# Método 1: Revisar GitHub Actions logs
Write-Host "📋 MÉTODO 1: Revisar GitHub Actions" -ForegroundColor Cyan
Write-Host "1. Ve a: https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor White
Write-Host "2. Busca el workflow 'Deploy to AWS' más reciente" -ForegroundColor White
Write-Host "3. En los logs del job 'deploy-backend' busca líneas como:" -ForegroundColor White
Write-Host "   - 'Using Security Group: sg-xxxxx'" -ForegroundColor Gray
Write-Host "   - 'ECS Service created/updated'" -ForegroundColor Gray
Write-Host "4. En los logs del job 'deploy-frontend' busca:" -ForegroundColor White
Write-Host "   - 'S3 bucket: field-service-frontend-xxxxx'" -ForegroundColor Gray
Write-Host ""

# Método 2: AWS Console
Write-Host "🌐 MÉTODO 2: AWS Console" -ForegroundColor Cyan
Write-Host "Backend (ECS):" -ForegroundColor Blue
Write-Host "  - ECS Console: https://console.aws.amazon.com/ecs/v2/clusters" -ForegroundColor White
Write-Host "  - Buscar cluster: field-service-cluster" -ForegroundColor White
Write-Host "  - Ver servicio: backend-service" -ForegroundColor White
Write-Host "  - Anotar la IP pública de las tareas" -ForegroundColor White
Write-Host ""
Write-Host "Frontend (S3):" -ForegroundColor Blue  
Write-Host "  - S3 Console: https://console.aws.amazon.com/s3/" -ForegroundColor White
Write-Host "  - Buscar bucket: field-service-frontend-xxxxx" -ForegroundColor White
Write-Host "  - Properties → Static website hosting → URL" -ForegroundColor White
Write-Host ""

# URLs esperadas
Write-Host "📡 URLs ESPERADAS:" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 BACKEND API:" -ForegroundColor Yellow
Write-Host "  Format: http://[ECS-TASK-PUBLIC-IP]:3000" -ForegroundColor White
Write-Host "  Health: http://[ECS-TASK-PUBLIC-IP]:3000/health" -ForegroundColor White
Write-Host "  API Info: http://[ECS-TASK-PUBLIC-IP]:3000/api" -ForegroundColor White
Write-Host ""
Write-Host "🌐 FRONTEND WEB:" -ForegroundColor Yellow
Write-Host "  Format: http://[BUCKET-NAME].s3-website-us-east-1.amazonaws.com" -ForegroundColor White
Write-Host ""

# Credenciales
Write-Host "CREDENCIALES DE PRUEBA:" -ForegroundColor Green
Write-Host "  Email: admin@fieldservice.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "PROXIMOS PASOS:" -ForegroundColor Red
Write-Host "1. Obtener las URLs desde AWS Console o GitHub Actions" -ForegroundColor White
Write-Host "2. Probar health check del backend" -ForegroundColor White
Write-Host "3. Acceder al frontend y hacer login" -ForegroundColor White
Write-Host "4. Verificar funcionalidades del sistema" -ForegroundColor White