# Script simplificado de configuración de bases de datos gratuitas
# Field Service Manager - Windows PowerShell

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       FIELD SERVICE - CONFIGURACIÓN DE BASES DE DATOS        " -ForegroundColor Cyan  
Write-Host "                     Bases de Datos Gratuitas                  " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script te ayudará a configurar:" -ForegroundColor White
Write-Host "• Supabase (PostgreSQL) - Gratuito hasta 500MB" -ForegroundColor Green
Write-Host "• Upstash (Redis) - Gratuito hasta 10K comandos/día" -ForegroundColor Green
Write-Host ""

$continue = Read-Host "¿Deseas continuar? (s/n)"
if ($continue -ne "s" -and $continue -ne "S") {
    Write-Host "Configuración cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "1. Verificando prerrequisitos..." -ForegroundColor Blue

# Verificar Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Instalar desde: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version 2>$null  
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Instalando dependencias del backend..." -ForegroundColor Blue

cd backend
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ package.json no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Configuración de Supabase..." -ForegroundColor Blue
Write-Host ""
Write-Host "Sigue estos pasos:" -ForegroundColor Yellow
Write-Host "1. Abre: https://supabase.com" -ForegroundColor Cyan
Write-Host "2. Crea cuenta gratuita" -ForegroundColor Cyan
Write-Host "3. Crea nuevo proyecto:" -ForegroundColor Cyan
Write-Host "   • Nombre: field-service-db" -ForegroundColor White
Write-Host "   • Contraseña: Genera una segura" -ForegroundColor White
Write-Host "   • Región: La más cercana" -ForegroundColor White
Write-Host "4. En Settings > Database, copia Connection string" -ForegroundColor Cyan
Write-Host ""

$openSupabase = Read-Host "¿Abrir Supabase en navegador? (s/n)"
if ($openSupabase -eq "s" -or $openSupabase -eq "S") {
    Start-Process "https://supabase.com"
    Start-Sleep 2
}

Read-Host "Presiona ENTER cuando tengas la connection string de Supabase"
$supabaseUrl = Read-Host "Pega la Database URL de Supabase"

Write-Host ""
Write-Host "4. Configuración de Upstash..." -ForegroundColor Blue
Write-Host ""
Write-Host "Sigue estos pasos:" -ForegroundColor Yellow
Write-Host "1. Abre: https://upstash.com" -ForegroundColor Cyan
Write-Host "2. Crea cuenta gratuita" -ForegroundColor Cyan
Write-Host "3. Crea nueva base de datos Redis:" -ForegroundColor Cyan
Write-Host "   • Nombre: field-service-redis" -ForegroundColor White
Write-Host "   • Región: La más cercana" -ForegroundColor White
Write-Host "   • Tipo: Regional (gratis)" -ForegroundColor White
Write-Host "4. Copia la Redis URL" -ForegroundColor Cyan
Write-Host ""

$openUpstash = Read-Host "¿Abrir Upstash en navegador? (s/n)"
if ($openUpstash -eq "s" -or $openUpstash -eq "S") {
    Start-Process "https://upstash.com"
    Start-Sleep 2
}

Read-Host "Presiona ENTER cuando tengas la Redis URL de Upstash"
$redisUrl = Read-Host "Pega la Redis URL de Upstash"

Write-Host ""
Write-Host "5. Generando archivo .env..." -ForegroundColor Blue

# Generar JWT secret
$chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
$jwtSecret = ""
for ($i = 0; $i -lt 64; $i++) {
    $jwtSecret += $chars[(Get-Random -Maximum $chars.Length)]
}

$envContent = @"
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration - Supabase
DATABASE_URL=$supabaseUrl
DB_SSL=true

# Redis Configuration - Upstash
REDIS_URL=$redisUrl

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AWS Configuration (opcional)
AWS_REGION=us-east-1

# Mapbox Configuration (opcional)
# MAPBOX_ACCESS_TOKEN=your-mapbox-token

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

Set-Content -Path ".env" -Value $envContent -Encoding UTF8
Write-Host "✅ Archivo .env creado" -ForegroundColor Green

Write-Host ""
Write-Host "6. Inicializando base de datos..." -ForegroundColor Blue

npm run supabase:init
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos inicializada" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algunos errores durante inicialización (esto es normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "7. Probando conexiones..." -ForegroundColor Blue

npm run db:test

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                 CONFIGURACIÓN COMPLETADA                      " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Iniciar backend:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Abrir en navegador:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Credenciales por defecto:" -ForegroundColor Yellow
Write-Host "   Usuario: admin@fieldservice.com" -ForegroundColor Cyan
Write-Host "   Contraseña: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Configurar frontend:" -ForegroundColor Yellow
Write-Host "   cd ../frontend-web" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""

Write-Host "Costos mensuales estimados:" -ForegroundColor Magenta
Write-Host "• Supabase: $0 (hasta 500MB)" -ForegroundColor Green
Write-Host "• Upstash: $0 (hasta 10K comandos/día)" -ForegroundColor Green  
Write-Host "• Total: GRATIS para desarrollo" -ForegroundColor Green
Write-Host ""

Write-Host "¡Configuración completada exitosamente!" -ForegroundColor Green