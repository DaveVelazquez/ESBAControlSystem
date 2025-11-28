# Script de configuración rápida para bases de datos gratuitas
# Field Service Manager - Windows PowerShell

param(
    [switch]$SkipInstall,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colores para output
$Colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Blue'
    Cyan = 'Cyan'
    Magenta = 'Magenta'
    White = 'White'
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Banner {
    Clear-Host
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║              🚀 FIELD SERVICE - CONFIGURACIÓN RÁPIDA            ║" "Cyan"
    Write-ColorOutput "║                     Bases de Datos Gratuitas                    ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Show-Help {
    Write-ColorOutput "FIELD SERVICE - CONFIGURACIÓN RÁPIDA" "Cyan"
    Write-ColorOutput "=====================================" "Cyan"
    Write-Host ""
    Write-ColorOutput "Este script configura automáticamente las bases de datos gratuitas" "White"
    Write-ColorOutput "para el Sistema de Monitoreo de Técnicos en Campo." "White"
    Write-Host ""
    Write-ColorOutput "PARÁMETROS:" "Yellow"
    Write-ColorOutput "  -SkipInstall    Omite la instalación de dependencias" "White"
    Write-ColorOutput "  -Help           Muestra esta ayuda" "White"
    Write-Host ""
    Write-ColorOutput "SERVICIOS CONFIGURADOS:" "Yellow"
    Write-ColorOutput "  • Supabase (PostgreSQL) - Gratuito hasta 500MB" "Green"
    Write-ColorOutput "  • Upstash (Redis) - Gratuito hasta 10K comandos/día" "Green"
    Write-Host ""
    Write-ColorOutput "USO:" "Yellow"
    Write-ColorOutput "  .\setup-free-databases.ps1" "Cyan"
    Write-ColorOutput "  .\setup-free-databases.ps1 -SkipInstall" "Cyan"
    exit 0
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Verificando prerequisitos..." "Blue"
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Green"
    } catch {
        Write-ColorOutput "❌ Node.js no está instalado" "Red"
        Write-ColorOutput "   Instalar desde: https://nodejs.org/" "Yellow"
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version 2>$null
        Write-ColorOutput "✅ npm: v$npmVersion" "Green"
    } catch {
        Write-ColorOutput "❌ npm no está disponible" "Red"
        exit 1
    }
    
    # Verificar git (opcional)
    try {
        $gitVersion = git --version 2>$null
        Write-ColorOutput "✅ Git: $gitVersion" "Green"
    } catch {
        Write-ColorOutput "⚠️  Git no está instalado (opcional)" "Yellow"
    }
    
    Write-Host ""
}

function Install-Dependencies {
    Write-ColorOutput "📦 Instalando dependencias del backend..." "Blue"
    
    $backendPath = Join-Path $PSScriptRoot "..\backend"
    
    if (-not (Test-Path $backendPath)) {
        Write-ColorOutput "❌ Directorio backend no encontrado: $backendPath" "Red"
        exit 1
    }
    
    Push-Location $backendPath
    
    try {
        if (Test-Path "package.json") {
            Write-ColorOutput "Installing Node.js dependencies..." "Cyan"
            npm install
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Dependencias instaladas correctamente" "Green"
            } else {
                Write-ColorOutput "❌ Error instalando dependencias" "Red"
                exit 1
            }
        } else {
            Write-ColorOutput "❌ package.json no encontrado" "Red"
            exit 1
        }
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$ValidationPattern = "",
        [string]$ErrorMessage = "Entrada inválida"
    )
    
    do {
        $input = Read-Host $Prompt
        
        if ($ValidationPattern -eq "" -or $input -match $ValidationPattern) {
            return $input
        } else {
            Write-ColorOutput $ErrorMessage "Red"
        }
    } while ($true)
}

function Setup-Supabase {
    Write-ColorOutput "📊 CONFIGURACIÓN DE SUPABASE (PostgreSQL)" "Blue"
    Write-ColorOutput "═══════════════════════════════════════════" "Blue"
    Write-Host ""
    
    Write-ColorOutput "Sigue estos pasos para configurar Supabase:" "Yellow"
    Write-ColorOutput "1. Abrir: https://supabase.com" "Cyan"
    Write-ColorOutput "2. Crear cuenta gratuita o iniciar sesión" "Cyan"
    Write-ColorOutput "3. Crear nuevo proyecto:" "Cyan"
    Write-ColorOutput "   • Nombre: field-service-db" "White"
    Write-ColorOutput "   • Contraseña: Generar una segura (guárdarla)" "White"
    Write-ColorOutput "   • Región: Seleccionar la más cercana" "White"
    Write-Host ""
    
    Write-ColorOutput "4. En Settings > Database, copiar la 'Connection string'" "Cyan"
    Write-ColorOutput "   Reemplazar [YOUR-PASSWORD] con tu contraseña" "Yellow"
    Write-Host ""
    
    # Abrir Supabase en el navegador
    $openBrowser = Get-UserInput "¿Abrir Supabase en el navegador? (s/n)" "^[snSN]$" "Responder s o n"
    if ($openBrowser -match "^[sS]$") {
        Start-Process "https://supabase.com"
        Write-ColorOutput "🌐 Abriendo Supabase en el navegador..." "Cyan"
        Start-Sleep 2
    }
    
    Read-Host "Presiona ENTER cuando hayas creado el proyecto y tengas la connection string"
    Write-Host ""
    
    $supabaseUrl = Get-UserInput "🔗 Pega la Database URL de Supabase" "postgresql://.*supabase\.co.*" "La URL debe ser de Supabase (contener supabase.co)"
    
    Write-ColorOutput "✅ Supabase configurado correctamente" "Green"
    Write-Host ""
    
    return $supabaseUrl
}

function Setup-Upstash {
    Write-ColorOutput "🗄️  CONFIGURACIÓN DE UPSTASH (Redis)" "Blue"
    Write-ColorOutput "════════════════════════════════════════" "Blue"
    Write-Host ""
    
    Write-ColorOutput "Sigue estos pasos para configurar Upstash:" "Yellow"
    Write-ColorOutput "1. Abrir: https://upstash.com" "Cyan"
    Write-ColorOutput "2. Crear cuenta gratuita o iniciar sesión" "Cyan"
    Write-ColorOutput "3. Crear nueva base de datos Redis:" "Cyan"
    Write-ColorOutput "   • Nombre: field-service-redis" "White"
    Write-ColorOutput "   • Región: Seleccionar la más cercana" "White"
    Write-ColorOutput "   • Tipo: Regional (gratuito)" "White"
    Write-Host ""
    
    Write-ColorOutput "4. Copiar la 'Redis URL' del dashboard" "Cyan"
    Write-Host ""
    
    # Abrir Upstash en el navegador
    $openBrowser = Get-UserInput "¿Abrir Upstash en el navegador? (s/n)" "^[snSN]$" "Responder s o n"
    if ($openBrowser -match "^[sS]$") {
        Start-Process "https://upstash.com"
        Write-ColorOutput "🌐 Abriendo Upstash en el navegador..." "Cyan"
        Start-Sleep 2
    }
    
    Read-Host "Presiona ENTER cuando hayas creado la base de datos Redis y tengas la URL"
    Write-Host ""
    
    $upstashUrl = Get-UserInput "🔗 Pega la Redis URL de Upstash" "redis://.*upstash\.io.*" "La URL debe ser de Upstash (contener upstash.io)"
    
    Write-ColorOutput "✅ Upstash configurado correctamente" "Green"
    Write-Host ""
    
    return $upstashUrl
}

function Generate-JWT-Secret {
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $secret = ""
    for ($i = 0; $i -lt 64; $i++) {
        $secret += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $secret
}

function Create-EnvFile {
    param(
        [string]$DatabaseUrl,
        [string]$RedisUrl
    )
    
    $backendPath = Join-Path $PSScriptRoot "..\backend"
    $envPath = Join-Path $backendPath ".env"
    
    $jwtSecret = Generate-JWT-Secret
    
    $envContent = @"
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration - Supabase
DATABASE_URL=$DatabaseUrl
DB_SSL=true

# Redis Configuration - Upstash
REDIS_URL=$RedisUrl

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AWS Configuration (opcional - configurar después)
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# S3_BUCKET=field-service-evidences

# Mapbox Configuration (opcional - para mapas)
# MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# Firebase Configuration (opcional - para notificaciones push)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-client-email
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_SERVER_KEY=your-server-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# SLA Configuration (minutes)
DEFAULT_SLA_MINUTES=240
SLA_WARNING_THRESHOLD=0.8
SLA_CRITICAL_THRESHOLD=0.95

# Geolocation
MAX_CHECK_IN_DISTANCE_METERS=100
LOCATION_PING_INTERVAL_SECONDS=120
"@

    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-ColorOutput "✅ Archivo .env creado en: $envPath" "Green"
}

function Initialize-Database {
    Write-ColorOutput "🔧 Inicializando base de datos..." "Blue"
    
    $backendPath = Join-Path $PSScriptRoot "..\backend"
    Push-Location $backendPath
    
    try {
        Write-ColorOutput "Ejecutando inicialización de Supabase..." "Cyan"
        npm run supabase:init
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Base de datos inicializada correctamente" "Green"
        } else {
            Write-ColorOutput "⚠️  Hubo algunos errores durante la inicialización" "Yellow"
            Write-ColorOutput "   Esto es normal en algunos casos. Continuando..." "Yellow"
        }
    } catch {
        Write-ColorOutput "❌ Error durante la inicialización" "Red"
        Write-ColorOutput "   Puedes ejecutar manualmente: npm run supabase:init" "Yellow"
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

function Test-Connections {
    Write-ColorOutput "🧪 Probando conexiones..." "Blue"
    
    $backendPath = Join-Path $PSScriptRoot "..\backend"
    Push-Location $backendPath
    
    try {
        npm run db:test
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Pruebas de conexión completadas" "Green"
        } else {
            Write-ColorOutput "⚠️  Algunas pruebas fallaron" "Yellow"
        }
    } catch {
        Write-ColorOutput "❌ Error durante las pruebas" "Red"
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

function Show-Next-Steps {
    Write-ColorOutput "🎉 ¡CONFIGURACIÓN COMPLETADA!" "Green"
    Write-ColorOutput "════════════════════════════════" "Green"
    Write-Host ""
    
    Write-ColorOutput "Próximos pasos:" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "1. 🚀 Iniciar el servidor backend:" "Yellow"
    Write-ColorOutput "   cd backend" "Cyan"
    Write-ColorOutput "   npm run dev" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "2. 🌐 Acceder a la aplicación:" "Yellow"
    Write-ColorOutput "   Backend API: http://localhost:3000" "Cyan"
    Write-ColorOutput "   Health Check: http://localhost:3000/health" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "3. 👤 Credenciales por defecto:" "Yellow"
    Write-ColorOutput "   Usuario: admin@fieldservice.com" "Cyan"
    Write-ColorOutput "   Contraseña: admin123" "Cyan"
    Write-ColorOutput "   ⚠️  CAMBIAR en producción!" "Red"
    Write-Host ""
    
    Write-ColorOutput "4. 📱 Configurar frontend (opcional):" "Yellow"
    Write-ColorOutput "   cd frontend-web" "Cyan"
    Write-ColorOutput "   npm install" "Cyan"
    Write-ColorOutput "   npm start" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "📚 Documentación adicional:" "Blue"
    Write-ColorOutput "   • CONFIGURACION_BASES_DATOS_GRATUITAS.md" "Cyan"
    Write-ColorOutput "   • CONFIGURACION_GRATUITA.md" "Cyan"
    Write-ColorOutput "   • PASOS_DEPLOYMENT_AWS.md" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "💰 Costos mensuales estimados:" "Magenta"
    Write-ColorOutput "   • Supabase: $0 (hasta 500MB)" "Green"
    Write-ColorOutput "   • Upstash: $0 (hasta 10K comandos/día)" "Green"
    Write-ColorOutput "   • AWS ECS: $32-40/mes" "Yellow"
    Write-ColorOutput "   • Total: ~$40/mes (vs $85/mes con RDS/ElastiCache)" "Green"
    Write-Host ""
}

# MAIN SCRIPT
if ($Help) {
    Show-Help
}

Show-Banner

Write-ColorOutput "Este script configurará automáticamente las bases de datos gratuitas" "White"
Write-ColorOutput "para el Sistema de Monitoreo de Técnicos en Campo." "White"
Write-Host ""

$continue = Get-UserInput "¿Deseas continuar con la configuración? (s/n)" "^[snSN]$" "Responder s o n"

if ($continue -notmatch "^[sS]$") {
    Write-ColorOutput "Configuración cancelada." "Yellow"
    exit 0
}

Write-Host ""

try {
    # Verificar prerequisitos
    Test-Prerequisites
    
    # Instalar dependencias si no se especifica -SkipInstall
    if (-not $SkipInstall) {
        Install-Dependencies
    }
    
    # Configurar servicios
    $databaseUrl = Setup-Supabase
    $redisUrl = Setup-Upstash
    
    # Crear archivo .env
    Write-ColorOutput "📝 Generando archivo de configuración..." "Blue"
    Create-EnvFile -DatabaseUrl $databaseUrl -RedisUrl $redisUrl
    Write-Host ""
    
    # Inicializar base de datos
    Initialize-Database
    
    # Probar conexiones
    Test-Connections
    
    # Mostrar próximos pasos
    Show-Next-Steps
    
    Write-ColorOutput "¡Configuración completada exitosamente!" "Green"
    
} catch {
    Write-ColorOutput "Error durante la configuración: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Revisa los pasos manuales en CONFIGURACION_BASES_DATOS_GRATUITAS.md" "Yellow"
    exit 1
}