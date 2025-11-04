# 🔧 SOLUCIÓN PERMANENTE: DNS CACHING EN NGINX

## 🔍 El Problema Recurrente

Cada vez que reconstruimos el **backend**, Podman le asigna una **nueva IP**. Nginx cachea la resolución DNS al iniciar, causando **502 Bad Gateway** hasta que se reinicia.

### Flujo del Problema:
```
1. Backend reconstruido → Nueva IP (ej: 10.89.0.15)
2. Nginx cacheado → IP antigua (ej: 10.89.0.12)
3. Nginx intenta conectar → Host unreachable
4. Resultado → 502 Bad Gateway
```

### Solución Temporal:
```powershell
podman restart frontend
```

---

## ✅ SOLUCIÓN PERMANENTE

Modificar `nginx.conf` para usar **resolución DNS dinámica** en lugar de cachear la IP al inicio.

### Archivo: `frontend-web/nginx.conf`

**CAMBIO NECESARIO:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # ✅ AGREGADO: DNS resolver dinámico
    resolver 127.0.0.11 valid=10s ipv6=off;
    resolver_timeout 5s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ✅ MODIFICADO: API proxy con variable para DNS dinámico
    location /api {
        set $backend_upstream backend:3000;
        proxy_pass http://$backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ✅ MODIFICADO: WebSocket proxy con variable
    location /socket.io {
        set $backend_upstream backend:3000;
        proxy_pass http://$backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Implementación

### 1. Actualizar nginx.conf
Agregar al inicio del bloque `server`:
```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
resolver_timeout 5s;
```

### 2. Modificar proxy_pass
En cada `location` con `proxy_pass`, cambiar:

**ANTES:**
```nginx
location /api {
    proxy_pass http://backend:3000;
    # ...
}
```

**DESPUÉS:**
```nginx
location /api {
    set $backend_upstream backend:3000;
    proxy_pass http://$backend_upstream;
    # ...
}
```

### 3. Reconstruir Frontend
```powershell
cd "C:\dev\Dev2\Sistema de Control\frontend-web"
podman build -t field-service-frontend .
podman stop frontend
podman rm frontend
podman run -d --name frontend --network field-service-network -p 8081:80 field-service-frontend
```

---

## 📊 Diferencia Entre Soluciones

### ❌ Sin DNS Dinámico (Actual):
```
Inicio nginx → Resuelve backend → Cachea IP
Backend reconstruido → Nueva IP
Nginx intenta conectar → IP antigua cacheada
Resultado → 502 hasta reiniciar nginx
```

### ✅ Con DNS Dinámico:
```
Cada request → Resuelve backend → IP actual
Backend reconstruido → Nueva IP
Nginx próximo request → Resuelve nueva IP
Resultado → Conecta automáticamente
```

---

## 🔍 ¿Qué hace `resolver 127.0.0.11`?

### 127.0.0.11:
- **DNS interno de Podman/Docker**
- Resuelve nombres de contenedores en la red
- Mantiene registro actualizado de IPs

### valid=10s:
- Cache DNS por **10 segundos**
- Balancea entre rendimiento y actualización
- Ajustable según necesidades

### ipv6=off:
- Deshabilita resolución IPv6
- Evita timeouts en redes sin IPv6
- Mejora velocidad de resolución

---

## 🎯 Ventajas de la Solución

### ✅ Ventajas:
- **No requiere reiniciar nginx** al reconstruir backend
- **DNS se resuelve en cada request** (o cada 10s con cache)
- **Funciona con IPs dinámicas** de contenedores
- **Ideal para desarrollo** con reconstrucciones frecuentes
- **También funciona en producción**

### ⚠️ Consideraciones:
- **Pequeño overhead**: Resolución DNS por request (mitigado por cache)
- **Requiere resolver válido**: 127.0.0.11 debe estar disponible
- **Solo funciona con variables**: Usar `set $var` + `proxy_pass http://$var`

---

## 📋 Estado Actual del Sistema

### Configuración Actual:
```
✅ Backend: Rate limiter configurado
✅ Backend: Trust proxy habilitado
✅ Frontend: Ícono PWA agregado
⚠️ Frontend: DNS estático (requiere restart manual)
```

### Después de Aplicar Fix:
```
✅ Backend: Rate limiter configurado
✅ Backend: Trust proxy habilitado
✅ Frontend: Ícono PWA agregado
✅ Frontend: DNS dinámico (auto-resolución)
```

---

## 🚀 Solución Temporal Mientras Tanto

Si reconstruyes el backend antes de aplicar el fix permanente:

```powershell
# Reiniciar frontend para resolver nueva IP
podman restart frontend

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Verificar logs
podman logs frontend --tail 10
```

---

## 🎉 RESUMEN

### Problema:
- Nginx cachea IPs al inicio
- Backend cambia de IP al reconstruir
- 502 Bad Gateway hasta reiniciar nginx

### Solución Temporal:
```powershell
podman restart frontend
```

### Solución Permanente:
1. Agregar `resolver 127.0.0.11` en nginx.conf
2. Usar variables en `proxy_pass`
3. Reconstruir frontend

### Resultado:
✅ No más 502 después de reconstruir backend  
✅ DNS se resuelve automáticamente  
✅ Sistema más robusto y flexible

---

## 📚 Referencias

- [Nginx DNS Resolution](http://nginx.org/en/docs/http/ngx_http_core_module.html#resolver)
- [Docker DNS](https://docs.docker.com/config/containers/container-networking/#dns-services)
- [Nginx Variables in proxy_pass](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)

---

*Documento creado: 4 de noviembre de 2025*  
*Solución para DNS caching en nginx con contenedores Podman*
