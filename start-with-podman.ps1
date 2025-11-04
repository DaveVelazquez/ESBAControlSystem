# Script de Instalación y Ejecución con Podman
# Sistema de Monitoreo de Técnicos en Campo

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Sistema de Control - Podman  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un comando existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Paso 1: Verificar/Instalar Podman
Write-Host "[1/7] Verificando Podman..." -ForegroundColor Yellow

if (Test-Command "podman") {
    $podmanVersion = podman --version
    Write-Host "✅ Podman ya está instalado: $podmanVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Podman no encontrado. Instalando..." -ForegroundColor Red
    
    if (Test-Command "winget") {
        Write-Host "   Instalando Podman con winget..." -ForegroundColor Cyan
        winget install -e --id RedHat.Podman --accept-source-agreements --accept-package-agreements
        
        # Agregar Podman al PATH de la sesión actual
        $env:Path += ";C:\Program Files\RedHat\Podman"
        
        Write-Host "✅ Podman instalado correctamente" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Reinicia PowerShell y vuelve a ejecutar este script" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Presiona Enter para salir"
        exit
    } else {
        Write-Host "❌ winget no encontrado. Por favor instala Podman manualmente desde:" -ForegroundColor Red
        Write-Host "   https://github.com/containers/podman/releases" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""

# Paso 2: Verificar Podman Machine
Write-Host "[2/7] Verificando Podman Machine..." -ForegroundColor Yellow

$machineList = podman machine list 2>&1
if ($machineList -match "podman-machine-default") {
    Write-Host "✅ Podman Machine ya existe" -ForegroundColor Green
    
    # Verificar si está corriendo
    if ($machineList -match "Currently running") {
        Write-Host "✅ Podman Machine está corriendo" -ForegroundColor Green
    } else {
        Write-Host "   Iniciando Podman Machine..." -ForegroundColor Cyan
        podman machine start
        Start-Sleep -Seconds 5
        Write-Host "✅ Podman Machine iniciada" -ForegroundColor Green
    }
} else {
    Write-Host "   Inicializando Podman Machine (esto puede tardar 2-3 minutos)..." -ForegroundColor Cyan
    podman machine init --cpus 4 --memory 4096 --disk-size 50
    Write-Host "   Iniciando Podman Machine..." -ForegroundColor Cyan
    podman machine start
    Start-Sleep -Seconds 10
    Write-Host "✅ Podman Machine creada e iniciada" -ForegroundColor Green
}

Write-Host ""

# Paso 3: Probar conexión
Write-Host "[3/7] Probando conexión con Podman..." -ForegroundColor Yellow
$podmanInfo = podman info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexión con Podman exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ Error al conectar con Podman" -ForegroundColor Red
    Write-Host $podmanInfo
    exit 1
}

Write-Host ""

# Paso 4: Limpiar contenedores anteriores
Write-Host "[4/7] Limpiando contenedores anteriores..." -ForegroundColor Yellow
$containers = @("frontend", "backend", "postgres", "redis", "adminer")
foreach ($container in $containers) {
    $exists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^$container$"
    if ($exists) {
        Write-Host "   Eliminando contenedor: $container" -ForegroundColor Cyan
        podman stop $container 2>&1 | Out-Null
        podman rm $container 2>&1 | Out-Null
    }
}
Write-Host "✅ Limpieza completada" -ForegroundColor Green

Write-Host ""

# Paso 5: Crear red
Write-Host "[5/7] Configurando red..." -ForegroundColor Yellow
$networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^field-service-network$"
if ($networkExists) {
    Write-Host "   Red ya existe, recreando..." -ForegroundColor Cyan
    podman network rm field-service-network 2>&1 | Out-Null
}
podman network create field-service-network | Out-Null
Write-Host "✅ Red creada: field-service-network" -ForegroundColor Green

Write-Host ""

# Paso 6: Iniciar servicios
Write-Host "[6/7] Iniciando servicios..." -ForegroundColor Yellow
Write-Host ""

# PostgreSQL
Write-Host "   📦 Iniciando PostgreSQL + PostGIS..." -ForegroundColor Cyan
podman run -d `
    --name postgres `
    --network field-service-network `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres123 `
    -e POSTGRES_DB=field_service `
    -p 5432:5432 `
    docker.io/postgis/postgis:14-3.3

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ PostgreSQL iniciado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al iniciar PostgreSQL" -ForegroundColor Red
}

Start-Sleep -Seconds 5

# Redis
Write-Host "   📦 Iniciando Redis..." -ForegroundColor Cyan
podman run -d `
    --name redis `
    --network field-service-network `
    -p 6379:6379 `
    docker.io/redis:7-alpine

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Redis iniciado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al iniciar Redis" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Backend
Write-Host "   🔨 Construyendo Backend (esto puede tardar 3-5 minutos)..." -ForegroundColor Cyan
Set-Location "backend"
podman build -t field-service-backend . -q

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend construido" -ForegroundColor Green
    
    Write-Host "   📦 Iniciando Backend..." -ForegroundColor Cyan
    podman run -d `
        --name backend `
        --network field-service-network `
        -p 3000:3000 `
        -e NODE_ENV=production `
        -e PORT=3000 `
        -e DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/field_service" `
        -e REDIS_URL="redis://redis:6379" `
        -e JWT_SECRET="your-secret-key-change-in-production-2024" `
        -e JWT_EXPIRES_IN="7d" `
        field-service-backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend iniciado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al iniciar Backend" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Error al construir Backend" -ForegroundColor Red
}

Set-Location ..
Start-Sleep -Seconds 5

# Esperar a que el backend ejecute migraciones
Write-Host "   ⏳ Esperando migraciones de base de datos (30 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Frontend
Write-Host "   🔨 Construyendo Frontend (esto puede tardar 5-8 minutos)..." -ForegroundColor Cyan
Set-Location "frontend-web"
podman build -t field-service-frontend . -q

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend construido" -ForegroundColor Green
    
    Write-Host "   📦 Iniciando Frontend..." -ForegroundColor Cyan
    podman run -d `
        --name frontend `
        --network field-service-network `
        -p 80:80 `
        field-service-frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend iniciado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al iniciar Frontend" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Error al construir Frontend" -ForegroundColor Red
}

Set-Location ..
Start-Sleep -Seconds 3

# Adminer (opcional)
Write-Host "   📦 Iniciando Adminer (Admin BD)..." -ForegroundColor Cyan
podman run -d `
    --name adminer `
    --network field-service-network `
    -p 8080:8080 `
    docker.io/adminer:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Adminer iniciado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al iniciar Adminer" -ForegroundColor Red
}

Write-Host ""

# Paso 7: Verificar servicios
Write-Host "[7/7] Verificando servicios..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 5

$services = podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host $services

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  ✅ INSTALACIÓN COMPLETADA    " -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Mostrar información de acceso
Write-Host "🌐 URLs de Acceso:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Frontend Web:    " -NoNewline -ForegroundColor White
Write-Host "http://localhost" -ForegroundColor Yellow
Write-Host "   Backend API:     " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "   API Docs:        " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000/api-docs" -ForegroundColor Yellow
Write-Host "   Adminer (DB):    " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔐 Credenciales de Prueba:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Admin:" -ForegroundColor White
Write-Host "     Email:    admin@company.com" -ForegroundColor Yellow
Write-Host "     Password: Test1234" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Dispatcher:" -ForegroundColor White
Write-Host "     Email:    dispatcher@company.com" -ForegroundColor Yellow
Write-Host "     Password: Test1234" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Técnico:" -ForegroundColor White
Write-Host "     Email:    tech1@company.com" -ForegroundColor Yellow
Write-Host "     Password: Test1234" -ForegroundColor Yellow
Write-Host ""

Write-Host "🗄️  Base de Datos (Adminer):" -ForegroundColor Cyan
Write-Host "   Sistema:   PostgreSQL" -ForegroundColor Yellow
Write-Host "   Servidor:  postgres" -ForegroundColor Yellow
Write-Host "   Usuario:   postgres" -ForegroundColor Yellow
Write-Host "   Password:  postgres123" -ForegroundColor Yellow
Write-Host "   Base:      field_service" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Comandos Útiles:" -ForegroundColor Cyan
Write-Host "   Ver logs:         " -NoNewline -ForegroundColor White
Write-Host "podman logs -f backend" -ForegroundColor Yellow
Write-Host "   Listar servicios: " -NoNewline -ForegroundColor White
Write-Host "podman ps" -ForegroundColor Yellow
Write-Host "   Detener todo:     " -NoNewline -ForegroundColor White
Write-Host "podman stop frontend backend postgres redis adminer" -ForegroundColor Yellow
Write-Host "   Iniciar todo:     " -NoNewline -ForegroundColor White
Write-Host "podman start postgres redis backend frontend adminer" -ForegroundColor Yellow
Write-Host "   Ver estadísticas: " -NoNewline -ForegroundColor White
Write-Host "podman stats" -ForegroundColor Yellow
Write-Host ""

Write-Host "⏳ Espera 30-60 segundos para que todos los servicios terminen de iniciar" -ForegroundColor Yellow
Write-Host ""

# Preguntar si desea abrir el navegador
$openBrowser = Read-Host "¿Deseas abrir la aplicación en el navegador? (S/N)"
if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Write-Host ""
    Write-Host "🚀 Abriendo aplicación..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Start-Process "http://localhost"
}

Write-Host ""
Write-Host "Disfruta tu aplicacion!" -ForegroundColor Green
Write-Host ""
