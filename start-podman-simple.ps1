# Script Simple para Iniciar con Podman
Write-Host "=== Sistema de Control - Podman ===" -ForegroundColor Cyan

# Verificar Podman
if (!(Get-Command podman -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Podman..." -ForegroundColor Yellow
    winget install -e --id RedHat.Podman
    Write-Host "IMPORTANTE: Reinicia PowerShell y ejecuta este script de nuevo" -ForegroundColor Yellow
    exit
}

Write-Host "1. Verificando Podman Machine..." -ForegroundColor Yellow
podman machine list
if ($LASTEXITCODE -ne 0) {
    Write-Host "Inicializando Podman Machine..." -ForegroundColor Cyan
    podman machine init
}

Write-Host "2. Iniciando Podman Machine..." -ForegroundColor Yellow
podman machine start

Write-Host "3. Creando red..." -ForegroundColor Yellow
podman network create field-service-network 2>$null

Write-Host "4. Limpiando contenedores antiguos..." -ForegroundColor Yellow
podman stop frontend backend postgres redis adminer 2>$null
podman rm frontend backend postgres redis adminer 2>$null

Write-Host "5. Iniciando PostgreSQL..." -ForegroundColor Yellow
podman run -d --name postgres --network field-service-network -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=field_service -p 5432:5432 docker.io/postgis/postgis:14-3.3

Write-Host "6. Iniciando Redis..." -ForegroundColor Yellow
podman run -d --name redis --network field-service-network -p 6379:6379 docker.io/redis:7-alpine

Write-Host "7. Construyendo Backend..." -ForegroundColor Yellow
cd backend
podman build -t field-service-backend .
podman run -d --name backend --network field-service-network -p 3000:3000 -e DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/field_service" -e REDIS_URL="redis://redis:6379" -e JWT_SECRET="secret-key-2024" field-service-backend
cd ..

Write-Host "Esperando migraciones..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "8. Construyendo Frontend..." -ForegroundColor Yellow
cd frontend-web
podman build -t field-service-frontend .
podman run -d --name frontend --network field-service-network -p 80:80 field-service-frontend
cd ..

Write-Host "9. Iniciando Adminer..." -ForegroundColor Yellow
podman run -d --name adminer --network field-service-network -p 8080:8080 docker.io/adminer

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host "Frontend:  http://localhost" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "Adminer:   http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login: admin@company.com / Test1234" -ForegroundColor Cyan
Write-Host ""

$open = Read-Host "Abrir en navegador? (S/N)"
if ($open -eq "S") {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost"
}
