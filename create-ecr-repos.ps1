# Instrucciones para crear repositorios ECR manualmente

Write-Host "=== CREAR REPOSITORIOS ECR MANUALMENTE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ve a AWS Console y ejecuta estos pasos:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Ve a: https://console.aws.amazon.com/ecr/repositories" -ForegroundColor White
Write-Host "2. Región: us-east-1" -ForegroundColor White
Write-Host "3. Clic en 'Create repository'" -ForegroundColor White
Write-Host ""

Write-Host "REPOSITORIO 1:" -ForegroundColor Green
Write-Host "  Nombre: field-service-backend" -ForegroundColor White
Write-Host "  Tipo: Private" -ForegroundColor White
Write-Host "  Tag immutability: Disabled" -ForegroundColor White
Write-Host "  Scan on push: Enabled (opcional)" -ForegroundColor White
Write-Host ""

Write-Host "REPOSITORIO 2:" -ForegroundColor Green  
Write-Host "  Nombre: field-service-frontend" -ForegroundColor White
Write-Host "  Tipo: Private" -ForegroundColor White
Write-Host "  Tag immutability: Disabled" -ForegroundColor White
Write-Host "  Scan on push: Enabled (opcional)" -ForegroundColor White
Write-Host ""

Write-Host "ALTERNATIVA - Comando AWS CLI (si tienes credenciales admin):" -ForegroundColor Blue
Write-Host "aws ecr create-repository --repository-name field-service-backend --region us-east-1" -ForegroundColor Cyan
Write-Host "aws ecr create-repository --repository-name field-service-frontend --region us-east-1" -ForegroundColor Cyan
Write-Host ""

Write-Host "Una vez creados, ejecutar:" -ForegroundColor Magenta
Write-Host "git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "URLs útiles:" -ForegroundColor Blue
Write-Host "- ECR Console: https://console.aws.amazon.com/ecr/repositories" -ForegroundColor Cyan
Write-Host "- IAM Console: https://console.aws.amazon.com/iam/home#/users/github-ci" -ForegroundColor Cyan