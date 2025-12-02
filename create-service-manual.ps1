# Script para crear ECS Service manualmente

Write-Host "=== CREANDO ECS SERVICE MANUALMENTE ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "PASO 1: Revisar Task Definitions" -ForegroundColor Green
Write-Host "Ve a: https://console.aws.amazon.com/ecs/v2/task-definitions" -ForegroundColor Cyan
Write-Host "Buscar: backend-service (debería existir)" -ForegroundColor White
Write-Host ""

Write-Host "PASO 2: Verificar imagen en ECR" -ForegroundColor Green  
Write-Host "Ve a: https://console.aws.amazon.com/ecr/repositories" -ForegroundColor Cyan
Write-Host "Buscar: field-service-backend (debería tener imágenes)" -ForegroundColor White
Write-Host ""

Write-Host "PASO 3: Crear Service manualmente" -ForegroundColor Green
Write-Host "1. Ve a: https://console.aws.amazon.com/ecs/v2/clusters/field-service-cluster/services" -ForegroundColor Cyan
Write-Host "2. Click 'Create service'" -ForegroundColor White
Write-Host "3. Configuración:" -ForegroundColor Blue
Write-Host "   • Family: backend-service" -ForegroundColor Gray
Write-Host "   • Service name: backend-service" -ForegroundColor Gray
Write-Host "   • Desired tasks: 1" -ForegroundColor Gray
Write-Host "   • Launch type: Fargate" -ForegroundColor Gray
Write-Host "4. Networking:" -ForegroundColor Blue
Write-Host "   • VPC: Default VPC" -ForegroundColor Gray
Write-Host "   • Subnets: Default subnets" -ForegroundColor Gray
Write-Host "   • Security group: Default" -ForegroundColor Gray
Write-Host "   • Public IP: ENABLED" -ForegroundColor Gray
Write-Host "5. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "ALTERNATIVA - Crear con task simple:" -ForegroundColor Blue
Write-Host "1. Ve al cluster: field-service-cluster" -ForegroundColor Cyan
Write-Host "2. Tab 'Tasks' -> 'Run new task'" -ForegroundColor White
Write-Host "3. Launch type: Fargate" -ForegroundColor White
Write-Host "4. Task definition: backend-service:1" -ForegroundColor White
Write-Host "5. VPC y subnets: default" -ForegroundColor White
Write-Host "6. Security group: default + permitir puerto 3000" -ForegroundColor White
Write-Host "7. Auto-assign public IP: ENABLED" -ForegroundColor White
Write-Host ""

Write-Host "URLs útiles:" -ForegroundColor Magenta
Write-Host "• ECS Clusters: https://console.aws.amazon.com/ecs/v2/clusters" -ForegroundColor Cyan
Write-Host "• Task Definitions: https://console.aws.amazon.com/ecs/v2/task-definitions" -ForegroundColor Cyan
Write-Host "• ECR Repositories: https://console.aws.amazon.com/ecr/repositories" -ForegroundColor Cyan