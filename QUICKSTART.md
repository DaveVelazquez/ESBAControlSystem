# Quick Start Guide

## ⚡ Opción 1: Docker Compose (Recomendado)

### Requisitos Previos
- Docker Desktop instalado
- 4GB RAM disponible

### Pasos

```powershell
# 1. Ejecutar setup
.\setup.ps1

# 2. Levantar todos los servicios
docker-compose up -d

# 3. Ver logs
docker-compose logs -f backend

# 4. Verificar que todo esté corriendo
docker-compose ps
```

Servicios disponibles:
- 🚀 **Backend API**: http://localhost:3000
- 🏥 **Health Check**: http://localhost:3000/health
- 🗄️ **Database UI (Adminer)**: http://localhost:8080
- 🔴 **Redis**: localhost:6379

### Detener servicios
```powershell
docker-compose down
```

### Limpiar todo (⚠️ elimina datos)
```powershell
docker-compose down -v
```

---

## 🔧 Opción 2: Setup Manual

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional para desarrollo)

### 1. Configurar Base de Datos

```powershell
# Crear base de datos
createdb field_service

# Ejecutar migraciones
psql -U postgres -d field_service -f database\migrations\001_initial_schema.sql

# Cargar datos de prueba
psql -U postgres -d field_service -f database\seeds\dev_data.sql
```

### 2. Configurar Backend

```powershell
cd backend

# Copiar variables de entorno
copy .env.example .env

# Editar .env con tus configuraciones
# Importante: DATABASE_URL debe apuntar a tu PostgreSQL local

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

El backend estará corriendo en http://localhost:3000

---

## ✅ Verificar Instalación

### 1. Health Check
```powershell
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### 2. Test Login
```powershell
$body = @{
    email = "admin@company.com"
    password = "Test1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/auth/login `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "admin@company.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

---

## 🧪 Datos de Prueba

Después de ejecutar los seeds, tendrás:

### Usuarios
| Email | Password | Rol |
|-------|----------|-----|
| admin@company.com | Test1234 | Admin |
| dispatcher@company.com | Test1234 | Dispatcher |
| tech1@company.com | Test1234 | Technician |
| tech2@company.com | Test1234 | Technician |
| tech3@company.com | Test1234 | Technician |

### Datos
- ✅ 4 Clientes
- ✅ 4 Sitios
- ✅ 4 Tipos de servicio
- ✅ 3 Técnicos con perfiles
- ✅ 10 Órdenes de ejemplo

---

## 📚 Endpoints Disponibles

### Autenticación
```http
POST /api/auth/login
POST /api/auth/register
```

### Órdenes
```http
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
POST   /api/orders/assign
```

### Técnicos
```http
GET    /api/technicians
GET    /api/technicians/:id/orders
```

### Ubicaciones
```http
POST   /api/locations/ping
GET    /api/locations/technicians
```

Ver documentación completa en: `/docs/API.md`

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
```powershell
# Verificar que PostgreSQL está corriendo
Get-Service postgresql*

# O con Docker
docker-compose ps postgres
```

### Error: "Port 3000 already in use"
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar puerto en .env
# PORT=3001
```

### Error: "ECONNREFUSED Redis"
```powershell
# Si no usas Redis, comenta las líneas de Redis en el código
# O instala Redis con Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### Ver logs en tiempo real
```powershell
# Docker
docker-compose logs -f backend

# Manual
cd backend
npm run dev
```

---

## 🚀 Próximos Pasos

1. **Frontend Web**: Ver `/frontend-web/README.md`
2. **Mobile App**: Ver `/mobile-app/README.md`
3. **AWS Deployment**: Ver `/docs/DEPLOYMENT.md`
4. **API Documentation**: Ver `/docs/API.md`

---

## 📞 Soporte

- 📧 Email: tech-support@company.com
- 📖 Docs: `/docs`
- 🐛 Issues: GitHub Issues

---

## 🎯 Estado del Proyecto

- ✅ Backend API funcional
- ✅ Base de datos con migraciones
- ✅ Docker Compose setup
- ✅ Autenticación JWT
- ✅ CRUD Órdenes básico
- ✅ Tracking de ubicaciones
- 🚧 Frontend Web (pendiente)
- 🚧 Mobile App (pendiente)
- 🚧 AWS Infrastructure (pendiente)
