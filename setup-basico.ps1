Write-Host "================================================"
Write-Host "    FIELD SERVICE - CONFIGURACION RAPIDA"
Write-Host "         Bases de Datos Gratuitas"
Write-Host "================================================"
Write-Host ""

Write-Host "Este script configura:"
Write-Host "- Supabase (PostgreSQL) - Gratuito"
Write-Host "- Upstash (Redis) - Gratuito"
Write-Host ""

$continue = Read-Host "Continuar? (s/n)"
if ($continue -ne "s") {
    Write-Host "Configuracion cancelada."
    exit 0
}

Write-Host ""
Write-Host "1. Verificando Node.js..."

try {
    $nodeVersion = node --version
    Write-Host "OK Node.js: $nodeVersion"
} catch {
    Write-Host "ERROR: Node.js no encontrado"
    Write-Host "Instalar desde: https://nodejs.org/"
    exit 1
}

Write-Host ""
Write-Host "2. Instalando dependencias..."

Set-Location backend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR instalando dependencias"
    exit 1
}

Write-Host "OK Dependencias instaladas"

Write-Host ""
Write-Host "3. Configurar Supabase"
Write-Host ""
Write-Host "Pasos:"
Write-Host "1. Abrir: https://supabase.com"
Write-Host "2. Crear cuenta gratuita"
Write-Host "3. Crear proyecto: field-service-db"
Write-Host "4. En Settings > Database copiar Connection string"
Write-Host ""

$openSupa = Read-Host "Abrir Supabase? (s/n)"
if ($openSupa -eq "s") {
    Start-Process "https://supabase.com"
}

Read-Host "Presiona ENTER cuando tengas la URL de Supabase"
$dbUrl = Read-Host "Pega la Database URL"

Write-Host ""
Write-Host "4. Configurar Upstash"
Write-Host ""
Write-Host "Pasos:"
Write-Host "1. Abrir: https://upstash.com"
Write-Host "2. Crear cuenta gratuita"
Write-Host "3. Crear Redis database: field-service-redis"
Write-Host "4. Copiar Redis URL"
Write-Host ""

$openUpstash = Read-Host "Abrir Upstash? (s/n)"
if ($openUpstash -eq "s") {
    Start-Process "https://upstash.com"
}

Read-Host "Presiona ENTER cuando tengas la URL de Redis"
$redisUrl = Read-Host "Pega la Redis URL"

Write-Host ""
Write-Host "5. Generando archivo .env..."

# Crear contenido del archivo .env
$envLines = @(
    "NODE_ENV=development",
    "PORT=3000",
    "HOST=0.0.0.0",
    "",
    "DATABASE_URL=$dbUrl",
    "DB_SSL=true",
    "",
    "REDIS_URL=$redisUrl",
    "",
    "JWT_SECRET=mi-jwt-secret-super-seguro-cambiar-en-produccion",
    "JWT_EXPIRES_IN=7d",
    "",
    "AWS_REGION=us-east-1", 
    "",
    "CORS_ORIGIN=http://localhost:3001",
    "",
    "RATE_LIMIT_WINDOW_MS=900000",
    "RATE_LIMIT_MAX_REQUESTS=100",
    "",
    "LOG_LEVEL=debug",
    "LOG_FILE=logs/app.log",
    "",
    "DEFAULT_SLA_MINUTES=240"
)

$envLines | Out-File -FilePath ".env" -Encoding utf8
Write-Host "OK Archivo .env creado"

Write-Host ""
Write-Host "6. Inicializando base de datos..."

npm run supabase:init

Write-Host ""  
Write-Host "7. Probando conexiones..."

npm run db:test

Write-Host ""
Write-Host "================================================"
Write-Host "           CONFIGURACION COMPLETADA"
Write-Host "================================================"
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host ""
Write-Host "1. Iniciar backend:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2. Probar API:"
Write-Host "   http://localhost:3000/health"
Write-Host ""
Write-Host "3. Credenciales por defecto:"
Write-Host "   Usuario: admin@fieldservice.com"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "COSTOS: GRATIS para desarrollo!"
Write-Host ""