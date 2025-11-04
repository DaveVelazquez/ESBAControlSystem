# 🔧 Solución al Error de Conexión Frontend-Backend

## ❌ Problema Identificado

El frontend en el navegador intentaba conectarse directamente a `http://localhost:3000/api`, pero el backend está en un contenedor de Podman, no accesible desde `localhost` del navegador.

### Stack Trace del Error
```
xhr.js:198 - Error de conexión
POST http://localhost:3000/api/auth/login - Failed
```

## ✅ Solución Aplicada

### 1. Configuración de URLs Relativas
**Archivos modificados**:
- `frontend-web/src/services/api.ts`
- `frontend-web/src/services/socket.ts`

**Cambio**: Usar URLs relativas (`/api`) en lugar de absolutas (`http://localhost:3000/api`)

```typescript
// Antes
const API_URL = 'http://localhost:3000';

// Después
const API_URL = import.meta.env.VITE_API_URL || '';
baseURL: API_URL ? `${API_URL}/api` : '/api'
```

### 2. Nginx Proxy
El archivo `nginx.conf` ya estaba configurado correctamente para hacer proxy de `/api` al backend:

```nginx
location /api {
    proxy_pass http://backend:3000;
    # ... configuración de proxy
}
```

### 3. Archivos .env Creados

**`.env.production`** (para contenedores):
```env
VITE_API_URL=
VITE_SOCKET_URL=
```
Usa URLs relativas para aprovechar el proxy de nginx.

**`.env.development`** (para desarrollo local):
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```
Conecta directamente al backend local.

## 🔄 Rebuild del Frontend

Para aplicar los cambios, se debe reconstruir la imagen del frontend:

```powershell
# Detener y eliminar contenedor actual
podman stop frontend
podman rm frontend

# Reconstruir imagen
cd "C:\dev\Dev2\Sistema de Control\frontend-web"
podman build --no-cache -t field-service-frontend .

# Iniciar nuevo contenedor
podman run -d --name frontend --network field-service-network -p 8081:80 field-service-frontend
```

## 🌐 Flujo de Peticiones Corregido

### Antes (❌ Fallaba)
```
Navegador → http://localhost:3000/api → ❌ No alcanzaba el contenedor
```

### Después (✅ Funciona)
```
Navegador → http://localhost:8081/api → Nginx → http://backend:3000/api → Backend Container
```

## 🧪 Verificación

1. **Abrir navegador**: http://localhost:8081
2. **Intentar login**: admin@fieldservice.com / admin123
3. **Revisar Network tab**: Las peticiones deben ir a `/api/auth/login` (relativa)
4. **Ver logs de backend**: `podman logs -f backend`

## 📝 Comandos Útiles

### Ver logs en tiempo real
```powershell
# Frontend (nginx)
podman logs -f frontend

# Backend (Node.js)
podman logs -f backend
```

### Verificar conectividad de red
```powershell
# Listar redes
podman network ls

# Inspeccionar red
podman network inspect field-service-network

# Ver contenedores en la red
podman ps --filter network=field-service-network
```

### Probar backend desde dentro del contenedor frontend
```powershell
podman exec -it frontend wget -O- http://backend:3000/health
```

## ⚠️ Notas Importantes

1. **Rebuild necesario**: Cada cambio en el código frontend requiere rebuild de la imagen
2. **Cache de navegador**: Limpiar cache (Ctrl+Shift+R) después del rebuild
3. **Variables de entorno**: Vite solo procesa variables en build time, no en runtime
4. **CORS**: El backend debe aceptar peticiones desde http://localhost:8081

## 🔍 Debugging

Si el error persiste:

1. **Verificar que nginx está proxying**:
   ```powershell
   podman exec -it frontend cat /etc/nginx/conf.d/default.conf
   ```

2. **Verificar que el backend responde**:
   ```powershell
   podman exec -it frontend wget -O- http://backend:3000/api/health
   ```

3. **Ver logs de backend**:
   ```powershell
   podman logs backend --tail 100
   ```

4. **Verificar red**:
   ```powershell
   podman network inspect field-service-network
   ```

---

*Última actualización: 3 de noviembre de 2025*
