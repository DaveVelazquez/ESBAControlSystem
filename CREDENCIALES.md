# 🔐 Credenciales de Acceso - Sistema de Control de Técnicos

## 📋 Resumen de Servicios

| Servicio | URL | Estado |
|----------|-----|--------|
| Frontend Web | http://localhost:8081 | ✅ Running |
| Backend API | http://localhost:3000 | ✅ Running |
| Adminer (DB UI) | http://localhost:8080 | ✅ Running |
| PostgreSQL | localhost:5432 | ✅ Running |
| Redis | localhost:6379 | ✅ Running |

---

## 🌐 Frontend Web Dashboard

**URL**: http://localhost:8081

### 👤 Usuarios de Prueba Creados

#### Administrador
- **Email**: `admin@fieldservice.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador
- **Permisos**: Acceso completo al sistema

#### Técnico
- **Email**: `tech@fieldservice.com`
- **Contraseña**: `admin123`
- **Rol**: Técnico
- **Permisos**: Ver y actualizar órdenes asignadas

#### Despachador
- **Email**: `dispatcher@fieldservice.com`
- **Contraseña**: `admin123`
- **Rol**: Despachador
- **Permisos**: Gestionar órdenes y asignar técnicos

---

## 🗄️ Adminer (Gestión de Base de Datos)

**URL**: http://localhost:8080

### Credenciales PostgreSQL
- **Sistema**: `PostgreSQL`
- **Servidor**: `postgres` (nombre del contenedor)
- **Usuario**: `postgres`
- **Contraseña**: `postgres123`
- **Base de datos**: `field_service`

### Funcionalidades
- ✅ Ver y editar tablas
- ✅ Ejecutar consultas SQL
- ✅ Importar/Exportar datos
- ✅ Ver estructura de base de datos
- ✅ Gestionar índices y relaciones

---

## 🔌 Backend API

**URL**: http://localhost:3000

### Endpoints Principales

#### Autenticación
```bash
POST /api/auth/login
{
  "email": "admin@fieldservice.com",
  "password": "admin123"
}
```

#### Health Check
```bash
GET /api/health
# No requiere autenticación
```

#### Usuarios
```bash
GET /api/users
# Requiere: Authorization: Bearer <token>
```

#### Órdenes
```bash
GET /api/orders
POST /api/orders
GET /api/orders/:id
PUT /api/orders/:id
DELETE /api/orders/:id
# Todos requieren autenticación
```

---

## 🐘 PostgreSQL Database

### Conexión Directa
```bash
Host: localhost
Port: 5432
Database: field_service
Username: postgres
Password: postgres123
```

### Desde contenedor
```powershell
podman exec -it postgres psql -U postgres -d field_service
```

### Tablas Principales
- `users` - Usuarios del sistema
- `technician_profiles` - Perfiles de técnicos
- `clients` - Clientes
- `orders` - Órdenes de servicio
- `locations` - Ubicaciones
- `location_tracking` - Tracking de técnicos
- `order_events` - Eventos de órdenes
- `evidence` - Evidencias (fotos, firmas)
- `zones` - Zonas de servicio

---

## 🔴 Redis Cache

### Conexión
```bash
Host: localhost
Port: 6379
No password (por defecto)
```

### Desde contenedor
```powershell
podman exec -it redis redis-cli
```

### Uso
- Cache de sesiones
- Pub/Sub para real-time updates
- Rate limiting
- Datos temporales

---

## 🧪 Pruebas con curl/Postman

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fieldservice.com",
    "password": "admin123"
  }'
```

### Obtener perfil (con token)
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <tu-token-aqui>"
```

---

## 📊 Estructura de Base de Datos

### Tablas Creadas ✅
- ✅ users
- ✅ technician_profiles
- ✅ clients
- ✅ locations
- ✅ orders
- ✅ location_tracking
- ✅ order_events
- ✅ evidence
- ✅ zones

### Extensiones Habilitadas
- ✅ uuid-ossp (para UUIDs)
- ✅ postgis (para datos geoespaciales)

---

## 🔒 Seguridad

### Contraseñas Hash
Todas las contraseñas están hasheadas con **bcrypt** (cost factor: 10)

### JWT Tokens
- **Secret**: `secret-key-2024` (cambiar en producción)
- **Expiración**: 7 días
- **Algoritmo**: HS256

### CORS
Actualmente configurado para desarrollo:
- `http://localhost:3001`
- `http://localhost:8081`

---

## 📝 Notas Importantes

### Para Desarrollo
1. ✅ Base de datos inicializada con schema completo
2. ✅ 3 usuarios de prueba creados (admin, tech, dispatcher)
3. ✅ Todos con contraseña: `admin123`
4. ✅ PostgreSQL con PostGIS habilitado
5. ✅ Redis configurado para cache y pub/sub

### Para Producción
⚠️ **IMPORTANTE**: Cambiar estas configuraciones antes de producción:
- [ ] Cambiar contraseña de PostgreSQL
- [ ] Cambiar JWT_SECRET
- [ ] Configurar CORS específico
- [ ] Habilitar SSL/HTTPS
- [ ] Implementar rate limiting
- [ ] Configurar backups automáticos
- [ ] Usar variables de entorno seguras

---

## 🚀 Inicio Rápido

### 1. Acceder al Frontend
```
http://localhost:8081
```
Login: `admin@fieldservice.com` / `admin123`

### 2. Ver Base de Datos
```
http://localhost:8080
```
Servidor: `postgres`, Usuario: `postgres`, Password: `postgres123`

### 3. Probar API
```bash
curl http://localhost:3000/api/health
```

---

## 🛠️ Comandos Útiles

### Ver logs
```powershell
podman logs -f frontend
podman logs -f backend
podman logs -f postgres
```

### Reiniciar servicios
```powershell
podman restart frontend
podman restart backend
```

### Backup de base de datos
```powershell
podman exec postgres pg_dump -U postgres field_service > backup.sql
```

### Restaurar base de datos
```powershell
Get-Content backup.sql | podman exec -i postgres psql -U postgres -d field_service
```

---

## ✅ Verificación del Sistema

Puedes verificar que todo funciona correctamente:

1. **Frontend**: http://localhost:8081 - Debería mostrar página de login
2. **Backend Health**: http://localhost:3000/api/health - Debería retornar OK
3. **Adminer**: http://localhost:8080 - Debería mostrar login de base de datos
4. **Base de datos**: Conectar con Adminer y ver las tablas

---

*Última actualización: 3 de noviembre de 2025*
*Todos los servicios funcionando correctamente* ✅
