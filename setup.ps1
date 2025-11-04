# Installation and Setup Script
# Run as Administrator

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Field Service System - Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✓ Docker found" -ForegroundColor Green
} else {
    Write-Host "⚠ Docker not found. Docker Compose setup won't work without it." -ForegroundColor Yellow
}

# Setup Backend
Write-Host ""
Write-Host "Setting up Backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" -Destination "backend\.env"
    Write-Host "✓ Created backend\.env file" -ForegroundColor Green
} else {
    Write-Host "✓ backend\.env already exists" -ForegroundColor Green
}

# Create logs directory
if (-not (Test-Path "backend\logs")) {
    New-Item -ItemType Directory -Path "backend\logs" | Out-Null
    Write-Host "Created logs directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env with your configuration" -ForegroundColor White
Write-Host "2. Option A - Docker Compose (Recommended):" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Option B - Manual setup:" -ForegroundColor White
Write-Host "   a) Install PostgreSQL locally" -ForegroundColor Cyan
Write-Host "   b) Run: cd backend; npm install" -ForegroundColor Cyan
Write-Host "   c) Run migrations: psql -f database/migrations/001_initial_schema.sql" -ForegroundColor Cyan
Write-Host "   d) Run seeds: psql -f database/seeds/dev_data.sql" -ForegroundColor Cyan
Write-Host "   e) Start: cd backend; npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points after startup:" -ForegroundColor Yellow
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  - API Health: http://localhost:3000/health" -ForegroundColor White
Write-Host "  - Database UI: http://localhost:8080 (Adminer)" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "  - Admin: admin@company.com / Test1234" -ForegroundColor White
Write-Host "  - Dispatcher: dispatcher@company.com / Test1234" -ForegroundColor White
Write-Host "  - Technician: tech1@company.com / Test1234" -ForegroundColor White
Write-Host ""
