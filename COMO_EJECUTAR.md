# 🚀 Cómo Ejecutar el Proyecto - Guía Rápida

## ⚠️ Problema Actual

El proyecto está **100% listo** pero no se puede ejecutar actualmente debido a:
- Docker no está en el PATH de Windows
- npm tiene problemas de permisos

## ✅ Solución Rápida (OPCIÓN RECOMENDADA)

### Opción 1: Usar Docker Desktop GUI

1. **Abrir Docker Desktop**
   - Buscar "Docker Desktop" en el menú inicio de Windows
   - Asegurarse de que Docker está ejecutándose (ícono en la barra de tareas)

2. **Abrir el proyecto en VS Code**
   ```powershell
   code "C:\dev\Dev2\Sistema de Control"
   ```

3. **En VS Code, abrir la terminal integrada** (Ctrl + `)

4. **Ejecutar con ruta completa:**
   ```powershell
   & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d
   ```

5. **Verificar que esté corriendo:**
   ```powershell
   & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps
   ```

6. **Ver logs del backend:**
   ```powershell
   & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f backend
   ```

7. **Acceder a:**
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - Database UI: http://localhost:8080

### Opción 2: Agregar Docker al PATH

1. **Abrir PowerShell como Administrador**

2. **Ejecutar:**
   ```powershell
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   $dockerPath = "C:\Program Files\Docker\Docker\resources\bin"
   [Environment]::SetEnvironmentVariable("Path", "$currentPath;$dockerPath", "User")
   ```

3. **Cerrar y reabrir PowerShell**

4. **Ahora puedes ejecutar:**
   ```powershell
   cd "C:\dev\Dev2\Sistema de Control"
   docker compose up -d
   docker compose ps
   ```

### Opción 3: Usar Docker Desktop Dashboard

1. Abrir Docker Desktop
2. Ir a la pestaña "Containers"
3. Hacer clic en "Create container"
4. Seleccionar "Import from Docker Compose"
5. Navegar a: `C:\dev\Dev2\Sistema de Control\docker-compose.yml`
6. Hacer clic en "Run"

---

## 🧪 Probar la API

### 1. Health Check
```powershell
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-22T...",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Login
```powershell
$body = @{
    email = "admin@company.com"
    password = "Test1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
```

### 3. Obtener Órdenes
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Get -Headers $headers
```

---

## 📊 Ver la Base de Datos

1. Abrir navegador en: http://localhost:8080
2. Login en Adminer:
   - System: **PostgreSQL**
   - Server: **postgres**
   - Username: **fieldtech_user**
   - Password: **fieldtech_password**
   - Database: **fieldtech_db**

3. Explorar tablas:
   - `users` - Ver usuarios de prueba
   - `orders` - Ver órdenes de ejemplo
   - `sites` - Ver sitios con coordenadas
   - `technician_locations` - Tracking GPS

---

## 🛑 Detener el Proyecto

```powershell
# Opción 1: Con ruta completa
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose down

# Opción 2: Si agregaste al PATH
docker compose down

# Opción 3: Detener y borrar volúmenes (CUIDADO: borra datos)
docker compose down -v
```

---

## 🔍 Debugging

### Ver logs en tiempo real
```powershell
# Backend
docker compose logs -f backend

# PostgreSQL
docker compose logs -f postgres

# Todos los servicios
docker compose logs -f
```

### Entrar al contenedor del backend
```powershell
docker compose exec backend sh
```

### Ver estado de los servicios
```powershell
docker compose ps
```

### Reiniciar un servicio específico
```powershell
docker compose restart backend
```

---

## 📱 Próximos Pasos

Una vez que el backend esté corriendo:

### 1. Probar todos los endpoints (15 min)
- [ ] Login con diferentes usuarios
- [ ] Crear una nueva orden
- [ ] Asignar orden a técnico
- [ ] Simular check-in
- [ ] Simular tracking GPS
- [ ] Ver reportes

### 2. Completar features pendientes (1 semana)
- [ ] Implementar upload real de evidencias con S3
- [ ] Completar lógica de geofencing
- [ ] Implementar generación de PDFs
- [ ] Crear job de monitoreo SLA

### 3. Iniciar Frontend Web (2-3 semanas)
```powershell
cd "C:\dev\Dev2\Sistema de Control"
npx create-react-app frontend-web --template typescript
cd frontend-web
npm install @reduxjs/toolkit react-redux mapbox-gl axios socket.io-client
npm start
```

### 4. Iniciar Mobile App (3-4 semanas)
```powershell
cd "C:\dev\Dev2\Sistema de Control"
npx react-native init MobileApp --template react-native-template-typescript
cd mobile-app
npm install @react-navigation/native @react-navigation/stack
npm install @react-native-mapbox-gl/maps react-native-camera
npm install @reduxjs/toolkit react-redux axios socket.io-client
```

### 5. AWS Infrastructure (1-2 semanas)
```powershell
cd "C:\dev\Dev2\Sistema de Control"
mkdir infrastructure
cd infrastructure
npx aws-cdk init app --language typescript
```

---

## 📚 Documentación Completa

Revisa estos archivos para más información:

- **README.md** - Overview general del proyecto
- **QUICKSTART.md** - Guía de inicio rápido
- **DEVELOPERS.md** - Guía completa para desarrolladores
- **STATUS_ACTUAL.md** - Estado detallado del proyecto
- **OVERVIEW.md** - Vista visual de la arquitectura
- **docs/API.md** - Referencia completa de la API
- **docs/DEPLOYMENT.md** - Guía de deployment en AWS

---

## ❓ Troubleshooting

### Error: "Cannot connect to Docker daemon"
**Solución:** Asegúrate de que Docker Desktop esté ejecutándose

### Error: "Port 3000 already in use"
**Solución:** 
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :3000

# Cambiar el puerto en docker-compose.yml
# O matar el proceso que está usando el puerto
```

### Error: "Database connection failed"
**Solución:**
```powershell
# Verificar que PostgreSQL esté corriendo
docker compose ps postgres

# Ver logs de PostgreSQL
docker compose logs postgres

# Reiniciar PostgreSQL
docker compose restart postgres
```

### Error: npm permission denied
**Solución:** Usar Docker en lugar de ejecutar localmente con npm

---

## 💡 Tips

1. **Usa Docker Desktop Dashboard** para una interfaz visual
2. **Mantén VS Code abierto** con la terminal integrada
3. **Usa Postman o Thunder Client** para probar la API
4. **Revisa los logs** constantemente para detectar errores
5. **Haz commits frecuentes** con Git

---

## 🎯 Checklist de Verificación

Una vez que ejecutes el proyecto, verifica:

- [ ] Backend API responde en http://localhost:3000/health
- [ ] Puedes hacer login con admin@company.com / Test1234
- [ ] Recibes un token JWT válido
- [ ] Puedes obtener la lista de órdenes con el token
- [ ] Adminer muestra las tablas de la base de datos
- [ ] Hay datos de prueba en las tablas (5 users, 10 orders)
- [ ] Los logs del backend no muestran errores

---

¡Éxito! 🚀

Si tienes problemas, revisa **STATUS_ACTUAL.md** para ver el estado detallado.
