# 🚀 Guía de Uso con Podman

## ¿Qué es Podman?

Podman es una alternativa a Docker que:
- ✅ No requiere daemon (sin procesos en segundo plano)
- ✅ Funciona sin privilegios de root
- ✅ Compatible con comandos de Docker
- ✅ Más seguro y ligero
- ✅ Ya está instalado en tu sistema ✅

---

## 🎯 Comandos Básicos

### Podman es compatible con Docker
Podman usa los mismos comandos que Docker. Solo cambia `docker` por `podman`:

```powershell
# Docker → Podman
docker run → podman run
docker compose → podman-compose
docker ps → podman ps
```

---

## 🚀 Iniciar la Aplicación

### Opción 1: Con Podman Compose (Recomendado)

```powershell
cd "C:\dev\Dev2\Sistema de Control"

# Instalar podman-compose (primera vez)
pip install podman-compose

# Levantar todos los servicios
podman-compose up --build -d

# Ver logs
podman-compose logs -f

# Detener servicios
podman-compose down
```

### Opción 2: Con Podman directamente

```powershell
# Crear red
podman network create field-service-network

# Iniciar PostgreSQL
podman run -d --name postgres --network field-service-network `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=field_service `
  -p 5432:5432 `
  postgis/postgis:14-3.3

# Iniciar Redis
podman run -d --name redis --network field-service-network `
  -p 6379:6379 `
  redis:7-alpine

# Construir y ejecutar Backend
podman build -t backend:latest ./backend
podman run -d --name backend --network field-service-network `
  -e DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/field_service `
  -e REDIS_URL=redis://redis:6379 `
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345 `
  -e NODE_ENV=production `
  -p 3000:3000 `
  backend:latest

# Construir y ejecutar Frontend
podman build -t frontend:latest ./frontend-web
podman run -d --name frontend --network field-service-network `
  -p 80:80 `
  frontend:latest

# Adminer (opcional)
podman run -d --name adminer --network field-service-network `
  -p 8080:8080 `
  adminer:latest
```

---

## 📊 Comandos Útiles

### Ver contenedores
```powershell
# Listar contenedores corriendo
podman ps

# Listar todos los contenedores
podman ps -a

# Ver estadísticas de recursos
podman stats
```

### Ver logs
```powershell
# Ver logs de un contenedor
podman logs backend

# Ver logs en tiempo real
podman logs -f backend

# Últimas 100 líneas
podman logs --tail=100 backend
```

### Gestionar contenedores
```powershell
# Iniciar contenedor
podman start backend

# Detener contenedor
podman stop backend

# Reiniciar contenedor
podman restart backend

# Eliminar contenedor
podman rm backend

# Eliminar contenedor forzadamente
podman rm -f backend
```

### Entrar a contenedores
```powershell
# Ejecutar shell en contenedor
podman exec -it backend sh

# Ejecutar comando específico
podman exec backend npm run migrate

# Acceder a PostgreSQL
podman exec -it postgres psql -U postgres -d field_service
```

### Gestionar imágenes
```powershell
# Listar imágenes
podman images

# Eliminar imagen
podman rmi backend:latest

# Limpiar imágenes no usadas
podman image prune -a

# Ver espacio usado
podman system df
```

### Gestionar redes
```powershell
# Listar redes
podman network ls

# Inspeccionar red
podman network inspect field-service-network

# Eliminar red
podman network rm field-service-network
```

---

## 🐍 Instalar Python y podman-compose

Si no tienes Python instalado:

```powershell
# Instalar Python con winget
winget install -e --id Python.Python.3.12

# Cerrar y reabrir PowerShell

# Verificar instalación
python --version

# Instalar podman-compose
pip install podman-compose

# Verificar instalación
podman-compose --version
```

---

## 🔧 Solución de Problemas

### Problema: "podman: command not found"
**Solución:** Reinicia PowerShell o agrega Podman al PATH:
```powershell
$env:Path += ";C:\Program Files\RedHat\Podman"
```

### Problema: "cannot connect to podman machine"
**Solución:** Inicializa la máquina de Podman:
```powershell
podman machine init
podman machine start
```

### Problema: Puerto ya en uso
**Solución:**
```powershell
# Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplaza PID)
taskkill /PID <número> /F
```

### Problema: Error de red
**Solución:**
```powershell
# Recrear red
podman network rm field-service-network
podman network create field-service-network
```

### Problema: Contenedor no inicia
**Solución:**
```powershell
# Ver logs completos
podman logs backend

# Reconstruir imagen
podman build --no-cache -t backend:latest ./backend
```

---

## 📱 Acceder a la Aplicación

Una vez que todos los contenedores estén corriendo:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend Web** | http://localhost | - |
| **Backend API** | http://localhost:3000 | - |
| **Base de Datos (Adminer)** | http://localhost:8080 | Sistema: PostgreSQL<br>Servidor: postgres<br>Usuario: postgres<br>Password: postgres123<br>Base: field_service |
| **API Docs** | http://localhost:3000/api-docs | - |

### Credenciales de la App:
```
Admin:
  Email: admin@company.com
  Password: Test1234

Dispatcher:
  Email: dispatcher@company.com
  Password: Test1234

Técnico:
  Email: tech1@company.com
  Password: Test1234
```

---

## 🚀 Script de Inicio Rápido

Guarda esto como `start-podman.ps1`:

```powershell
# Script de inicio con Podman
Write-Host "🚀 Iniciando Sistema de Control con Podman..." -ForegroundColor Cyan

# Verificar que Podman esté instalado
if (!(Get-Command podman -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Podman no está instalado" -ForegroundColor Red
    exit 1
}

# Navegar al directorio
cd "C:\dev\Dev2\Sistema de Control"

# Verificar si podman-compose está instalado
if (!(Get-Command podman-compose -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando podman-compose..." -ForegroundColor Yellow
    pip install podman-compose
}

# Inicializar máquina Podman (si no está iniciada)
$machineStatus = podman machine list --format "{{.Running}}" 2>$null
if ($machineStatus -ne "true") {
    Write-Host "🔧 Inicializando máquina Podman..." -ForegroundColor Yellow
    podman machine init 2>$null
    podman machine start
}

# Levantar servicios
Write-Host "🐳 Levantando servicios..." -ForegroundColor Green
podman-compose up --build -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Mostrar estado
Write-Host "`n📊 Estado de los servicios:" -ForegroundColor Cyan
podman ps

Write-Host "`n✅ Aplicación lista!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "🔌 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "💾 Base de Datos: http://localhost:8080" -ForegroundColor Cyan
Write-Host "`n📝 Credenciales: admin@company.com / Test1234" -ForegroundColor Yellow
```

---

## 🎯 Ventajas de Podman sobre Docker

| Característica | Podman | Docker |
|---------------|--------|--------|
| Daemon | ❌ No requiere | ✅ Requiere |
| Privilegios | ❌ No necesita root | ⚠️ Necesita privilegios |
| Seguridad | ✅ Más seguro | ⚠️ Menos seguro |
| Pods | ✅ Soporte nativo | ❌ No soporta |
| Systemd | ✅ Integración | ❌ No integra |
| Tamaño | ✅ Más ligero | ⚠️ Más pesado |
| Compatibilidad | ✅ 100% compatible | ✅ Estándar |

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://podman.io/docs
- **GitHub:** https://github.com/containers/podman
- **Podman Compose:** https://github.com/containers/podman-compose
- **Tutorial:** https://podman.io/getting-started/

---

## ✅ Checklist de Inicio

- [x] Podman instalado
- [ ] Máquina Podman inicializada (`podman machine init`)
- [ ] Máquina Podman iniciada (`podman machine start`)
- [ ] Python instalado (para podman-compose)
- [ ] podman-compose instalado (`pip install podman-compose`)
- [ ] Servicios levantados (`podman-compose up -d`)
- [ ] Frontend accesible en http://localhost
- [ ] Login funcional con admin@company.com

---

**¡Listo para usar Podman! 🚀**
