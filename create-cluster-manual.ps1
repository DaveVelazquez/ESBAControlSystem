# Script para crear infraestructura ECS manualmente
Write-Host "=== CREANDO CLUSTER ECS MANUALMENTE ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Metodo 1: AWS CLI (recomendado)" -ForegroundColor Green
Write-Host "1. Crear cluster ECS:"
Write-Host "   aws ecs create-cluster --cluster-name field-service-cluster --region us-east-1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Crear log group:"
Write-Host "   aws logs create-log-group --log-group-name /ecs/backend-service --region us-east-1" -ForegroundColor Cyan
Write-Host ""

Write-Host "Metodo 2: AWS Console" -ForegroundColor Green  
Write-Host "1. Ve a: https://console.aws.amazon.com/ecs/v2/clusters" -ForegroundColor Cyan
Write-Host "2. Click 'Create cluster'" -ForegroundColor White
Write-Host "3. Cluster name: field-service-cluster" -ForegroundColor White
Write-Host "4. Infrastructure: AWS Fargate (serverless)" -ForegroundColor White
Write-Host "5. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "Despues de crear el cluster:" -ForegroundColor Blue
Write-Host "git push origin main" -ForegroundColor Cyan
Write-Host "(para reintentar el deployment)"
Write-Host ""

Write-Host "O ejecutar deployment directo:" -ForegroundColor Blue
Write-Host "aws ecs run-task --cluster field-service-cluster --task-definition backend-service --launch-type FARGATE ..." -ForegroundColor Cyan