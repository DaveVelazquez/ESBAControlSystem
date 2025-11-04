@echo off
echo Construyendo imagen del frontend...
cd "C:\dev\Dev2\Sistema de Control\frontend-web"
"C:\Program Files\RedHat\Podman\podman.exe" build -t field-service-frontend .
if %ERRORLEVEL% EQU 0 (
    echo [OK] Imagen construida exitosamente
    echo.
    echo Iniciando contenedor...
    "C:\Program Files\RedHat\Podman\podman.exe" run -d --name frontend --network field-service-network -p 8081:80 field-service-frontend
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Frontend corriendo en http://localhost:8081
        echo.
        echo Credenciales:
        echo   Email: admin@fieldservice.com
        echo   Password: admin123
    ) else (
        echo [ERROR] No se pudo iniciar el contenedor
    )
) else (
    echo [ERROR] Build fallido
)
pause
