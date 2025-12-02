# Script para verificar deployment con credenciales correctas
Write-Host "=== VERIFICANDO DEPLOYMENT AWS ===" -ForegroundColor Cyan
Write-Host "Usuario: github-ci (AKIAXMHKFP4X65R4TKGA)" -ForegroundColor Yellow
Write-Host ""

# Intentar verificar recursos de AWS sin credenciales específicas
# (las credenciales locales pueden ser diferentes)
Write-Host "Verificando recursos comunes del deployment..." -ForegroundColor Yellow

# URLs más probables basadas en la configuración estándar
$possibleUrls = @(
    "http://field-service-alb-123456789.us-east-1.elb.amazonaws.com",
    "http://field-service-backend-alb-123456789.us-east-1.elb.amazonaws.com",
    "https://d123456789abcdef.cloudfront.net"
)

Write-Host "URLs típicas que se generan:" -ForegroundColor Green
foreach ($url in $possibleUrls) {
    Write-Host "  $url" -ForegroundColor White
}

Write-Host ""
Write-Host "Para obtener las URLs reales:" -ForegroundColor Magenta
Write-Host "1. Revisar GitHub Actions: https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor Cyan
Write-Host "2. Ver logs del job 'deploy-backend' para el ALB DNS" -ForegroundColor Cyan  
Write-Host "3. Ver logs del job 'deploy-frontend' para CloudFront URL" -ForegroundColor Cyan
Write-Host ""

Write-Host "También puedes revisar en AWS Console:" -ForegroundColor Blue
Write-Host "- EC2 > Load Balancers (para backend ALB)" -ForegroundColor White
Write-Host "- CloudFront > Distributions (para frontend)" -ForegroundColor White
Write-Host "- ECS > Clusters > field-service-cluster" -ForegroundColor White
Write-Host ""

Write-Host "Estado esperado después del deployment exitoso:" -ForegroundColor Green
Write-Host "✅ ECS Cluster: field-service-cluster" -ForegroundColor White
Write-Host "✅ ECS Services: backend-service, frontend-service" -ForegroundColor White  
Write-Host "✅ ALB: field-service-alb" -ForegroundColor White
Write-Host "✅ CloudFront Distribution" -ForegroundColor White
Write-Host "✅ S3 Bucket para frontend" -ForegroundColor White