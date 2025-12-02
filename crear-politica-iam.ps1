# Instrucciones para crear la política IAM ECSExecutionRoleManagement

Write-Host "=== CREAR POLÍTICA IAM PERSONALIZADA ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "PASO 1: Ve al AWS IAM Console" -ForegroundColor Green
Write-Host "https://console.aws.amazon.com/iam/home#/policies" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 2: Crear nueva política" -ForegroundColor Green
Write-Host "1. Click 'Create policy'" -ForegroundColor White
Write-Host "2. Selecciona la pestaña 'JSON'" -ForegroundColor White
Write-Host "3. Borra todo el contenido existente" -ForegroundColor White
Write-Host "4. Pega este JSON:" -ForegroundColor White
Write-Host ""

Write-Host "JSON A COPIAR:" -ForegroundColor Blue
Get-Content "ecs-execution-role-policy.json"
Write-Host ""

Write-Host "PASO 3: Completar la política" -ForegroundColor Green
Write-Host "5. Click 'Next: Tags' (opcional)" -ForegroundColor White
Write-Host "6. Click 'Next: Review'" -ForegroundColor White
Write-Host "7. Name: ECSExecutionRoleManagement" -ForegroundColor White
Write-Host "8. Description: Permite crear y gestionar execution roles de ECS" -ForegroundColor White
Write-Host "9. Click 'Create policy'" -ForegroundColor White
Write-Host ""

Write-Host "PASO 4: Asignar al usuario github-ci" -ForegroundColor Green
Write-Host "1. Ve a: https://console.aws.amazon.com/iam/home#/users/github-ci" -ForegroundColor Cyan
Write-Host "2. Pestaña 'Permissions'" -ForegroundColor White
Write-Host "3. 'Add permissions' -> 'Attach policies directly'" -ForegroundColor White
Write-Host "4. Buscar: ECSExecutionRoleManagement" -ForegroundColor White
Write-Host "5. Seleccionar y 'Add permissions'" -ForegroundColor White
Write-Host ""

Write-Host "ALTERNATIVA RÁPIDA:" -ForegroundColor Magenta
Write-Host "Si prefieres, puedes usar la política AWS managed:" -ForegroundColor White
Write-Host "• AmazonECSTaskExecutionRolePolicy" -ForegroundColor Gray
Write-Host "• Pero esta no incluye crear roles, solo usarlos" -ForegroundColor Gray