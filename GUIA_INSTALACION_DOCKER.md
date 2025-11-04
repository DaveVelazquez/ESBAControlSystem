# 🐳 Guía de Instalación de Docker Desktop

## Paso a Paso Completo

---

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ Windows 10 64-bit: Pro, Enterprise, o Education (Build 19041 o superior)
- ✅ Windows 11 64-bit: Cualquier edición

### Hardware
- ✅ Procesador de 64 bits con SLAT (Second Level Address Translation)
- ✅ 4GB RAM mínimo (8GB recomendado)
- ✅ Virtualización habilitada en BIOS/UEFI

### Verificar Virtualización
```powershell
# Ejecutar en PowerShell como Administrador
Get-ComputerInfo | Select-Object HyperVisorPresent, HyperVRequirementVirtualizationFirmwareEnabled

# Debe mostrar:
# HyperVisorPresent: True
# HyperVRequirementVirtualizationFirmwareEnabled: True
```

Si muestra `False`, debes habilitar virtualización en BIOS (busca "Intel VT-x" o "AMD-V").

---

## 🚀 Paso 1: Descargar Docker Desktop

### Opción A: Descarga Directa
1. **Ir a la página oficial:**
   - https://www.docker.com/products/docker-desktop

2. **Click en "Download for Windows"**
   - Se descargará `Docker Desktop Installer.exe` (~500 MB)

### Opción B: Desde Terminal
```powershell
# Abrir PowerShell como Administrador
Start-Process "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe"
```

---

## 📦 Paso 2: Instalar Docker Desktop

1. **Ejecutar el instalador como Administrador:**
   - Click derecho en `Docker Desktop Installer.exe`
   - Seleccionar "Ejecutar como administrador"

2. **Opciones de instalación:**
   - ✅ **Marcar:** "Use WSL 2 instead of Hyper-V" (recomendado)
   - ✅ **Marcar:** "Add shortcut to desktop"
   - Click en "OK"

3. **Esperar instalación (5-10 minutos)**
   - Se instalarán componentes de WSL 2
   - Se configurará Docker Engine

4. **Reiniciar el sistema**
   - **IMPORTANTE:** Es obligatorio reiniciar Windows

---

## 🔧 Paso 3: Instalar/Actualizar WSL 2

### Después del reinicio:

1. **Abrir PowerShell como Administrador**

2. **Instalar WSL 2:**
   ```powershell
   wsl --install
   ```

3. **Actualizar WSL 2:**
   ```powershell
   wsl --update
   ```

4. **Establecer WSL 2 como predeterminado:**
   ```powershell
   wsl --set-default-version 2
   ```

5. **Verificar instalación:**
   ```powershell
   wsl --status
   ```

---

## ✅ Paso 4: Iniciar Docker Desktop

1. **Buscar "Docker Desktop" en el menú de inicio**

2. **Ejecutar Docker Desktop**
   - Primera vez puede tardar 2-3 minutos

3. **Aceptar los términos de servicio**

4. **Esperar que Docker Engine inicie**
   - Verás el ícono de Docker en la bandeja del sistema (cerca del reloj)
   - Cuando esté verde, Docker está listo ✅

---

## 🧪 Paso 5: Verificar Instalación

### Abrir PowerShell normal (no necesita ser administrador):

```powershell
# Verificar versión de Docker
docker --version
# Debería mostrar: Docker version 24.x.x o superior

# Verificar Docker Compose
docker compose version
# Debería mostrar: Docker Compose version 2.x.x

# Ejecutar contenedor de prueba
docker run hello-world
```

Si ves el mensaje "Hello from Docker!", ¡la instalación fue exitosa! 🎉

---

## 🚀 Paso 6: Levantar la Aplicación

### Ahora sí, ejecuta tu aplicación:

```powershell
# Navegar al proyecto
cd "C:\dev\Dev2\Sistema de Control"

# Construir y levantar todos los servicios
docker compose up --build -d

# Esto hará:
# ✅ Construir imagen del backend (Node.js)
# ✅ Construir imagen del frontend (React + Vite)
# ✅ Descargar imagen de PostgreSQL + PostGIS
# ✅ Descargar imagen de Redis
# ✅ Descargar imagen de Adminer
# ✅ Crear red privada
# ✅ Iniciar todos los contenedores
```

**Primera vez:** Tomará 10-15 minutos (descarga imágenes + build)  
**Siguientes veces:** 30-60 segundos

---

## 🌐 Paso 7: Acceder a la Aplicación

Espera 1-2 minutos después de `docker compose up` y luego:

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

## 📊 Paso 8: Verificar Servicios

```powershell
# Ver contenedores ejecutándose
docker compose ps

# Debería mostrar:
# NAME                    STATUS              PORTS
# backend                 Up x minutes        0.0.0.0:3000->3000/tcp
# frontend                Up x minutes        0.0.0.0:80->80/tcp
# postgres                Up x minutes        5432/tcp
# redis                   Up x minutes        6379/tcp
# adminer                 Up x minutes        0.0.0.0:8080->8080/tcp

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Presiona Ctrl+C para salir de los logs
```

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores
```powershell
# Iniciar servicios (si están detenidos)
docker compose start

# Detener servicios (mantiene datos)
docker compose stop

# Detener y eliminar contenedores
docker compose down

# Detener, eliminar contenedores Y volúmenes (⚠️ borra datos de BD)
docker compose down -v

# Reconstruir servicios después de cambios en código
docker compose up --build -d

# Ver uso de recursos
docker stats
```

### Acceder a Contenedores
```powershell
# Entrar al contenedor del backend
docker compose exec backend sh

# Entrar al contenedor de PostgreSQL
docker compose exec postgres psql -U postgres -d field_service

# Ejecutar comando en contenedor
docker compose exec backend npm run migrate
```

### Limpieza
```powershell
# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes no usados
docker volume prune

# Ver espacio usado
docker system df
```

---

## 🐛 Solución de Problemas

### Problema 1: "Docker daemon is not running"
**Solución:**
- Abrir Docker Desktop desde el menú de inicio
- Esperar a que el ícono se ponga verde

### Problema 2: Puerto ya en uso (ej: 3000, 80)
**Solución:**
```powershell
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID)
taskkill /PID <número> /F

# O cambiar el puerto en docker-compose.yml
```

### Problema 3: Error de WSL
**Solución:**
```powershell
# Reiniciar WSL
wsl --shutdown
wsl

# Actualizar WSL
wsl --update
```

### Problema 4: Contenedor no inicia
**Solución:**
```powershell
# Ver logs completos
docker compose logs backend

# Ver logs con más detalle
docker compose logs --tail=100 backend

# Reconstruir desde cero
docker compose down -v
docker compose up --build
```

### Problema 5: Base de datos no se conecta
**Solución:**
```powershell
# Verificar que postgres esté corriendo
docker compose ps postgres

# Ver logs de postgres
docker compose logs postgres

# Reiniciar solo postgres
docker compose restart postgres

# Esperar 30 segundos y verificar conexión
docker compose exec backend npm run db:test
```

---

## 🎯 Configuración Recomendada de Docker Desktop

1. **Abrir Docker Desktop**

2. **Settings → General:**
   - ✅ Start Docker Desktop when you log in
   - ✅ Use the WSL 2 based engine

3. **Settings → Resources:**
   - **CPUs:** Mínimo 2, recomendado 4
   - **Memory:** Mínimo 4GB, recomendado 8GB
   - **Swap:** 1-2GB
   - **Disk:** 60GB+

4. **Settings → Docker Engine:**
   ```json
   {
     "builder": {
       "gc": {
         "enabled": true,
         "defaultKeepStorage": "20GB"
       }
     }
   }
   ```

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://docs.docker.com/desktop/windows/
- **WSL 2:** https://docs.microsoft.com/en-us/windows/wsl/
- **Docker Compose:** https://docs.docker.com/compose/
- **Troubleshooting:** https://docs.docker.com/desktop/troubleshoot/overview/

---

## ✅ Checklist de Instalación

- [ ] Verificar requisitos (Windows 10/11, virtualización)
- [ ] Descargar Docker Desktop Installer
- [ ] Instalar Docker Desktop como administrador
- [ ] Reiniciar Windows
- [ ] Instalar/actualizar WSL 2
- [ ] Iniciar Docker Desktop
- [ ] Verificar con `docker --version`
- [ ] Ejecutar `docker run hello-world`
- [ ] Navegar a proyecto
- [ ] Ejecutar `docker compose up --build -d`
- [ ] Esperar 10-15 minutos (primera vez)
- [ ] Abrir http://localhost
- [ ] Login con admin@company.com / Test1234
- [ ] ✅ ¡Aplicación funcionando!

---

## 🎉 Siguiente Paso

Una vez que Docker Desktop esté instalado y funcionando:

```powershell
cd "C:\dev\Dev2\Sistema de Control"
docker compose up --build -d
```

Luego ve a: **http://localhost** y disfruta tu aplicación! 🚀

---

**Tiempo estimado total:** 30-45 minutos (primera instalación)  
**¿Problemas?** Revisa la sección "Solución de Problemas" arriba.
