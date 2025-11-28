# 🆓 CONFIGURACIÓN CON BASES DE DATOS GRATUITAS

He actualizado el proyecto para usar **bases de datos completamente gratuitas** en lugar de AWS RDS y ElastiCache.

---

## 🎯 **SERVICIOS GRATUITOS INTEGRADOS**

### **PostgreSQL Gratuito - Supabase**
- ✅ 500 MB de almacenamiento
- ✅ 2 proyectos gratuitos
- ✅ PostgreSQL con PostGIS incluido
- ✅ Dashboard web incluido
- ✅ Sin tarjeta de crédito requerida

### **Redis Gratuito - Upstash**
- ✅ 10,000 comandos/día
- ✅ 256 MB de memoria
- ✅ Redis 6.2 compatible
- ✅ Dashboard web incluido
- ✅ Sin tarjeta de crédito requerida

### **Alternativa: Railway (Todo en uno)**
- ✅ PostgreSQL + Redis en una plataforma
- ✅ $5 gratis al mes (suficiente para desarrollo)
- ✅ Deploy automático desde GitHub

---

## 🔧 **CONFIGURACIONES MANUALES ACTUALIZADAS (10 minutos)**

### **1. CONFIGURAR AWS CLI** ⏱️ 2 minutos
```powershell
aws configure
```
**Valores:**
```
AWS Access Key ID: AKIAXMHKFP4XXEPAI2U2
AWS Secret Access Key: [Ver paso 2]
Default region name: us-east-1
Default output format: json
```

### **2. OBTENER AWS SECRET ACCESS KEY** ⏱️ 3 minutos
1. **Ir a:** https://507297234735.signin.aws.amazon.com/console
2. **Navegar:** IAM → Users → github-ci → Security credentials
3. **Crear:** Create access key → CLI → Copiar Secret

### **3. OBTENER MAPBOX TOKEN** ⏱️ 2 minutos
1. **Registro:** https://account.mapbox.com/auth/signup/
2. **Token:** https://account.mapbox.com/access-tokens/
3. **Copiar:** Default public token (pk.eyJ...)

### **4. CONFIGURAR SUPABASE (PostgreSQL Gratuito)** ⏱️ 3 minutos
1. **Registro:** https://app.supabase.com/sign-up
2. **Crear proyecto:** New project → Elegir nombre
3. **Copiar credenciales:**
   - Database URL (postgres://...)
   - API URL
   - anon key

### **5. CONFIGURAR UPSTASH (Redis Gratuito)** ⏱️ 2 minutos
1. **Registro:** https://console.upstash.com/login
2. **Crear database:** Create database → Global → Elegir nombre
3. **Copiar:** UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN

### **6. CONFIGURAR GITHUB SECRETS** ⏱️ 5 minutos

**Ir a:** https://github.com/DaveVelazquez/ESBAControlSystem/settings/secrets/actions

**Agregar estos secrets:**

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIAXMHKFP4XXEPAI2U2` | Para ECS/S3 |
| `AWS_SECRET_ACCESS_KEY` | `[Del paso 2]` | Para AWS |
| `VITE_MAPBOX_TOKEN` | `[Del paso 3]` | Para mapas |
| `DATABASE_URL` | `[Supabase DB URL]` | PostgreSQL gratuito |
| `REDIS_URL` | `[Upstash Redis URL]` | Redis gratuito |
| `JWT_SECRET` | `[Generar random]` | Para autenticación |

### **7. EJECUTAR SCRIPT AWS SIN BASES DE DATOS** ⏱️ 15 minutos

**Usar el nuevo script optimizado:**
```bash
cd "C:\dev\Dev2\Sistema de Control"
bash aws/setup-aws-gratuito.sh
```

Este script crea **SOLO**:
- ✅ ECS Fargate (backend)
- ✅ S3 + CloudFront (frontend) 
- ✅ ALB (load balancer)
- ❌ ~~RDS~~ (usamos Supabase)
- ❌ ~~ElastiCache~~ (usamos Upstash)

### **8. CONFIGURAR URLs DESPUÉS DEL SCRIPT** ⏱️ 2 minutos

**Agregar en GitHub Secrets:**

| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `[URL del ALB generada]` |
| `VITE_SOCKET_URL` | `[Misma URL del ALB]` |

### **9. ACTIVAR PIPELINE** ⏱️ 1 minuto

```bash
git push origin main
```

---

## 💰 **COSTOS REDUCIDOS**

### **Antes (AWS completo):**
- ECS Fargate: $15/mes
- RDS PostgreSQL: $30/mes
- ElastiCache Redis: $15/mes
- ALB: $20/mes
- S3 + CloudFront: $5/mes
- **Total: $85/mes**

### **Ahora (Bases gratuitas):**
- ECS Fargate: $15/mes
- Supabase: **$0/mes**
- Upstash: **$0/mes** 
- ALB: $20/mes
- S3 + CloudFront: $5/mes
- **Total: $40/mes** 💰 **Ahorro: $45/mes**

### **Para desarrollo/testing:**
- Usar solo 1 ECS task: $7/mes
- **Total: $32/mes** 🎯

---

## 🔄 **ALTERNATIVA: RAILWAY (TODO GRATIS)**

Si prefieres una sola plataforma:

1. **Registro:** https://railway.app/login
2. **Conectar GitHub:** Autorizar repositorio
3. **Deploy:** Automático desde GitHub
4. **Costo:** $5 gratis/mes (suficiente para desarrollo)

**Ventajas Railway:**
- ✅ PostgreSQL + Redis incluidos
- ✅ Deploy automático desde GitHub
- ✅ SSL automático
- ✅ Logs centralizados
- ✅ Zero config

---

## 🎯 **ORDEN RECOMENDADO (Bases gratuitas)**

1. **AWS CLI** (pasos 1-2) ← Para ECS/S3
2. **Mapbox** (paso 3) ← Para mapas
3. **Supabase** (paso 4) ← Base de datos gratis
4. **Upstash** (paso 5) ← Redis gratis
5. **GitHub Secrets** (paso 6) ← Con bases gratuitas
6. **Script AWS reducido** (paso 7) ← Sin RDS/ElastiCache
7. **URLs finales** (paso 8) ← Después del script
8. **Activar pipeline** (paso 9) ← Final

---

## 📋 **ARCHIVOS ACTUALIZADOS**

✅ **aws/setup-aws-gratuito.sh** - Script sin bases de datos  
✅ **backend/src/config/database.js** - Compatible con Supabase  
✅ **backend/src/config/redis.js** - Compatible con Upstash  
✅ **docker-compose-dev.yml** - Para desarrollo local  
✅ **.env.example** actualizado con servicios gratuitos  

---

## 🆘 **SI PREFIERES TODO LOCAL (GRATIS)**

**Para desarrollo completo gratis:**
```bash
# Usar solo contenedores locales
docker-compose -f docker-compose-dev.yml up -d

# No necesitas AWS, Supabase ni Upstash
# Todo corre en tu máquina local
```

---

## ⏰ **TIEMPO TOTAL ESTIMADO**

- Configuraciones manuales: ~15 minutos
- Script AWS reducido: ~15 minutos  
- **Total: ~30 minutos** (vs 45 minutos antes)

---

**¿Qué opción prefieres?**
1. **Bases gratuitas** (Supabase + Upstash) + AWS ECS
2. **Railway** (todo en una plataforma)
3. **Local** (docker-compose, completamente gratis)

**Recomendación:** Opción 1 para producción, Opción 3 para desarrollo 🚀