# Rebuild Frontend with API URL fixes

Write-Host ">> Reconstruyendo frontend con URLs relativas..." -ForegroundColor Cyan

# Change to frontend directory
Set-Location "C:\dev\Dev2\Sistema de Control\frontend-web"

# Build image without cache
Write-Host ">> Construyendo imagen (esto puede tomar 2-3 minutos)..." -ForegroundColor Yellow
& "C:\Program Files\RedHat\Podman\podman.exe" build -t field-service-frontend .

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Imagen construida exitosamente" -ForegroundColor Green
    
    # Stop and remove old container
    Write-Host ">> Deteniendo contenedor anterior..." -ForegroundColor Yellow
    & "C:\Program Files\RedHat\Podman\podman.exe" stop frontend 2>$null
    & "C:\Program Files\RedHat\Podman\podman.exe" rm frontend 2>$null
    
    # Start new container
    Write-Host ">> Iniciando nuevo contenedor..." -ForegroundColor Yellow
    & "C:\Program Files\RedHat\Podman\podman.exe" run -d --name frontend --network field-service-network -p 8081:80 field-service-frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Frontend corriendo en http://localhost:8081" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credenciales de acceso:" -ForegroundColor Cyan
        Write-Host "   Email: admin@fieldservice.com" -ForegroundColor White
        Write-Host "   Password: admin123" -ForegroundColor White
    } else {
        Write-Host "[ERROR] Error al iniciar contenedor" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] Error en el build" -ForegroundColor Red
    Write-Host "Revisa los logs arriba para mas detalles"
}

# Return to original directory
Set-Location "C:\dev\Dev2\Sistema de Control"
