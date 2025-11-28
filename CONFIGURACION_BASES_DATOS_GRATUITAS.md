# Configuración de Bases de Datos Gratuitas

Este documento explica cómo configurar y usar bases de datos gratuitas (Supabase y Upstash) en lugar de los servicios pagos de AWS.

## 🆓 Servicios Gratuitos Utilizados

### PostgreSQL - Supabase
- **Plan:** Free Tier
- **Límites:** 500MB de almacenamiento, 2 proyectos
- **Características:** PostgreSQL 14, PostGIS habilitado, Dashboard web, API REST automática
- **Costo:** $0/mes

### Redis - Upstash
- **Plan:** Free Tier  
- **Límites:** 10,000 comandos/día, 256MB de memoria
- **Características:** Redis 6.2, REST API, Dashboard web
- **Costo:** $0/mes

## 📋 Pasos de Configuración

### 1. Configurar Supabase (PostgreSQL)

#### 1.1 Crear cuenta y proyecto
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta gratuita
3. Crear nuevo proyecto:
   - **Nombre:** field-service-db
   - **Contraseña:** Generar una segura (guardarla)
   - **Región:** Seleccionar la más cercana

#### 1.2 Configurar la base de datos
1. En el dashboard de Supabase, ir a **SQL Editor**
2. Copiar y ejecutar el contenido de `backend/database/supabase-init.sql`
3. Esto creará todas las tablas, índices y funciones necesarias

#### 1.3 Obtener cadena de conexión
1. Ir a **Settings** > **Database**
2. Copiar la **Connection string** 
3. Reemplazar `[YOUR-PASSWORD]` con tu contraseña
4. La URL se verá así:
   ```
   postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
   ```

### 2. Configurar Upstash (Redis)

#### 2.1 Crear cuenta y base de datos
1. Ir a [upstash.com](https://upstash.com)
2. Crear cuenta gratuita
3. Crear nueva base de datos Redis:
   - **Nombre:** field-service-redis
   - **Región:** Seleccionar la más cercana
   - **Tipo:** Regional (gratis)

#### 2.2 Obtener cadena de conexión
1. En el dashboard, copiar la **Redis URL**
2. La URL se verá así:
   ```
   redis://default:[password]@[endpoint].upstash.io:6379
   ```

### 3. Configurar Variables de Entorno

#### 3.1 Para desarrollo local
Editar el archivo `backend/.env`:

```env
# Database - Supabase
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@[TU_PROJECT_REF].supabase.co:5432/postgres
DB_SSL=true

# Redis - Upstash  
REDIS_URL=redis://default:[TU_PASSWORD]@[TU_ENDPOINT].upstash.io:6379

# Resto de configuraciones...
NODE_ENV=development
PORT=3000
JWT_SECRET=tu-jwt-secret-seguro
```

#### 3.2 Para GitHub Actions (Producción)
Añadir en **Settings** > **Secrets and variables** > **Actions**:

```
DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
REDIS_URL=redis://default:[password]@[endpoint].upstash.io:6379
DB_SSL=true
```

### 4. Ejecutar Migraciones

#### 4.1 Localmente
```bash
cd backend
npm run migrate
```

#### 4.2 En Supabase (vía web)
1. Copiar contenido de `backend/database/supabase-init.sql`
2. Pegarlo en el **SQL Editor** de Supabase
3. Ejecutar el script

## 🔧 Código Actualizado

### Backend - Configuración de Base de Datos
El archivo `backend/src/config/database.js` se actualizó para:
- Detectar automáticamente Supabase por la URL
- Configurar SSL correctamente para conexiones remotas
- Optimizar pool de conexiones para tier gratuito

### Backend - Configuración de Redis
El archivo `backend/src/config/redis.js` se creó para:
- Soportar Upstash con SSL/TLS automático
- Manejar reconexiones y errores gracefully
- Funcionar sin Redis en desarrollo si no está disponible

### Variables de Entorno
El archivo `backend/.env.example` se actualizó con:
- Ejemplos para Supabase y Upstash
- Configuraciones locales alternativas
- Documentación inline

## 🚀 Deployment

### Con bases de datos gratuitas
Usar los archivos específicos para deployment gratuito:

```bash
# Configurar AWS (sin RDS/ElastiCache)
./aws/setup-aws-gratuito.sh

# Usar task definition optimizada
aws/ecs-task-definition-gratuito.json
```

### GitHub Actions
El pipeline automáticamente:
1. Detecta las variables de entorno
2. Usa las configuraciones correctas
3. Despliega a ECS con las conexiones externas

## 💡 Ventajas de esta Configuración

### Costo
- **Antes:** $85/mes (RDS $30 + ElastiCache $15 + ECS $40)
- **Ahora:** $32-40/mes (solo ECS + servicios básicos AWS)
- **Ahorro:** $45-53/mes (≈60% de reducción)

### Simplicidad
- Sin configuración de RDS/ElastiCache
- Setup más rápido (5-10 minutos vs 30-45 minutos)
- Menos recursos AWS que administrar

### Escalabilidad
- Supabase: Hasta 500MB gratis, luego $25/mes por proyecto
- Upstash: Hasta 10K comandos/día gratis, luego planes flexibles
- Fácil migración a planes pagos cuando sea necesario

## 🔍 Monitoreo

### Supabase Dashboard
- **Métricas:** Conexiones, queries, almacenamiento
- **Logs:** Logs de consultas y errores
- **API:** Explorer automático de la API REST

### Upstash Dashboard  
- **Métricas:** Comandos ejecutados, memoria usada
- **Logs:** Comandos Redis en tiempo real
- **Analytics:** Gráficos de uso diario/mensual

## 🐛 Troubleshooting

### Error de conexión a Supabase
```bash
# Verificar conectividad
telnet [tu-proyecto].supabase.co 5432

# Verificar SSL
psql "postgresql://postgres:[password]@[proyecto].supabase.co:5432/postgres?sslmode=require"
```

### Error de conexión a Upstash
```bash
# Probar conexión con redis-cli
redis-cli -u redis://default:[password]@[endpoint].upstash.io:6379

# Verificar desde Node.js
node -e "
const redis = require('redis');
const client = redis.createClient({url: 'redis://default:[password]@[endpoint].upstash.io:6379'});
client.connect().then(() => console.log('Connected to Upstash')).catch(console.error);
"
```

### Límites alcanzados
- **Supabase:** Upgrading a $25/mes por proyecto adicional
- **Upstash:** Plans desde $0.2 por 100K comandos adicionales

## 📞 Soporte

### Supabase
- **Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Discord:** Comunidad muy activa
- **GitHub:** Issues y discussions

### Upstash  
- **Docs:** [upstash.com/docs](https://upstash.com/docs)
- **Discord:** Soporte de la comunidad
- **Email:** team@upstash.com

## 🔄 Migración Futura a AWS

Si en el futuro quieres migrar a RDS/ElastiCache:

1. Usar `aws/setup-aws.sh` (script completo)
2. Usar `aws/ecs-task-definition.json` (task definition completa)
3. Exportar datos de Supabase usando `pg_dump`
4. Importar a RDS usando `pg_restore`
5. Actualizar variables de entorno

La aplicación soporta ambas configuraciones sin cambios en el código.