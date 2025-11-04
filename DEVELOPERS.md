# 👨‍💻 Guía para Desarrolladores

## Bienvenido al Proyecto

Este documento te guiará para configurar tu entorno de desarrollo y comenzar a contribuir al proyecto.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js 18+** - [Descargar](https://nodejs.org/)
- ✅ **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Descargar](https://git-scm.com/)
- ✅ **VS Code** (recomendado) - [Descargar](https://code.visualstudio.com/)

**Extensiones recomendadas para VS Code:**
- ESLint
- Prettier
- Docker
- PostgreSQL
- REST Client
- GitLens

---

## 🚀 Setup Inicial (5 minutos)

### 1. Clonar el Repositorio
```powershell
git clone <repository-url>
cd "Sistema de Control"
```

### 2. Ejecutar Setup Automático
```powershell
.\setup.ps1
```

Este script:
- ✅ Verifica Node.js y Docker
- ✅ Crea archivo `.env` desde el ejemplo
- ✅ Crea directorio de logs
- ✅ Muestra siguiente pasos

### 3. Iniciar Servicios con Docker
```powershell
docker-compose up -d
```

Esto levanta:
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- Backend API (puerto 3000)
- Adminer - DB UI (puerto 8080)

### 4. Verificar que Todo Funcione
```powershell
# Health check
curl http://localhost:3000/health

# Login de prueba
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@company.com","password":"Test1234"}'
```

---

## 🏗️ Estructura del Código

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, Redis, etc)
│   ├── controllers/     # Controladores (lógica HTTP)
│   ├── middleware/      # Middleware (auth, errors, etc)
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas Express
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades (logger, etc)
│   └── server.js        # Entry point
├── tests/               # Tests unitarios e integración
├── .env                 # Variables de entorno (no committed)
├── .env.example         # Template de variables
├── Dockerfile           # Configuración Docker
└── package.json         # Dependencias
```

### Convenciones de Código

**Nombres de archivos:**
- Controllers: `OrderController.js`
- Services: `OrderService.js`
- Routes: `orders.js`
- Middleware: `auth.js`
- Utils: `logger.js`

**Estilo de código:**
- Usar `const` por defecto, `let` cuando necesario
- Async/await sobre callbacks
- CamelCase para variables y funciones
- PascalCase para clases
- SCREAMING_SNAKE_CASE para constantes

---

## 🔧 Comandos Útiles

### Backend
```powershell
cd backend

# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
```

### Docker
```powershell
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart backend

# Reconstruir imágenes
docker-compose build

# Limpiar todo (⚠️ borra datos)
docker-compose down -v
```

### Base de Datos
```powershell
# Conectar a PostgreSQL (Docker)
docker-compose exec postgres psql -U postgres -d field_service

# Ejecutar migraciones
psql -d field_service -f database\migrations\001_initial_schema.sql

# Cargar datos de prueba
psql -d field_service -f database\seeds\dev_data.sql

# Backup
docker-compose exec postgres pg_dump -U postgres field_service > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres field_service < backup.sql
```

---

## 🧪 Testing

### Ejecutar Tests
```powershell
cd backend
npm test
```

### Escribir Tests

**Ejemplo de test unitario:**
```javascript
// tests/services/OrderService.test.js
const OrderService = require('../../src/services/OrderService');

describe('OrderService', () => {
  describe('validateAssignment', () => {
    it('should validate order assignment', async () => {
      const result = await OrderService.validateAssignment({
        orderId: 'uuid',
        technicianId: 'uuid',
        scheduledStart: '2025-10-30T10:00:00Z',
        scheduledEnd: '2025-10-30T12:00:00Z'
      });
      
      expect(result.isValid).toBe(true);
    });
  });
});
```

**Ejemplo de test de integración:**
```javascript
// tests/integration/orders.test.js
const request = require('supertest');
const { app } = require('../../src/server');

describe('Orders API', () => {
  let token;

  beforeAll(async () => {
    // Login y obtener token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@company.com',
        password: 'Test1234'
      });
    token = res.body.data.token;
  });

  it('should list orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

---

## 🐛 Debugging

### VS Code Launch Configuration

Crear `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

### Debugging con Docker
```powershell
# Ver logs en tiempo real
docker-compose logs -f backend

# Ejecutar comando dentro del container
docker-compose exec backend sh

# Inspeccionar proceso
docker-compose exec backend ps aux
```

### Tips de Debugging
- Usar `console.log()` durante desarrollo
- Revisar logs en `backend/logs/combined.log`
- Usar Postman o REST Client para probar endpoints
- Usar Adminer (http://localhost:8080) para inspeccionar BD

---

## 📝 Agregar Nuevas Features

### 1. Crear Nueva Ruta

```javascript
// backend/src/routes/myNewRoute.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Tu lógica aquí
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 2. Registrar Ruta en Server

```javascript
// backend/src/server.js
const myNewRoute = require('./routes/myNewRoute');
app.use('/api/my-new-route', myNewRoute);
```

### 3. Crear Service (Lógica de Negocio)

```javascript
// backend/src/services/MyService.js
const db = require('../config/database');

class MyService {
  static async doSomething(data) {
    const result = await db.query('SELECT * FROM table WHERE id = $1', [data.id]);
    return result.rows[0];
  }
}

module.exports = MyService;
```

### 4. Agregar Tests

```javascript
// backend/tests/services/MyService.test.js
describe('MyService', () => {
  it('should do something', async () => {
    const result = await MyService.doSomething({ id: 'test' });
    expect(result).toBeDefined();
  });
});
```

---

## 🔒 Variables de Entorno

### Archivo `.env` (Backend)

```env
# Requeridas
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/field_service
JWT_SECRET=your-secret-here

# Opcionales
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
MAPBOX_ACCESS_TOKEN=your-token
```

**⚠️ IMPORTANTE:** Nunca commitear `.env` al repositorio!

---

## 📊 Base de Datos

### Consultas Útiles

```sql
-- Ver todas las órdenes
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Ver técnicos activos
SELECT * FROM users WHERE role = 'technician' AND active = true;

-- Ver ubicaciones recientes
SELECT * FROM technician_locations 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Ver órdenes por SLA
SELECT 
  order_number, 
  status,
  CASE 
    WHEN sla_deadline < NOW() THEN 'overdue'
    WHEN sla_deadline < NOW() + INTERVAL '1 hour' THEN 'critical'
    ELSE 'ok'
  END as sla_status
FROM orders
WHERE status NOT IN ('completed', 'cancelled');
```

### Crear Nueva Migración

```sql
-- database/migrations/002_my_changes.sql
-- Descripción de los cambios

ALTER TABLE orders ADD COLUMN new_field VARCHAR(255);

CREATE INDEX idx_orders_new_field ON orders(new_field);
```

---

## 🚨 Troubleshooting Común

### Error: "Cannot connect to database"
```powershell
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Revisar logs
docker-compose logs postgres

# Verificar credenciales en .env
```

### Error: "Port 3000 already in use"
```powershell
# Encontrar proceso
netstat -ano | findstr :3000

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar puerto en .env
PORT=3001
```

### Error: "Module not found"
```powershell
# Reinstalar dependencias
cd backend
rm -rf node_modules
npm install
```

### Error: "Permission denied" en Docker
```powershell
# Ejecutar como administrador
# O verificar permisos de Docker Desktop
```

---

## 📚 Recursos de Aprendizaje

### Documentación Oficial
- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com/)

### Documentación del Proyecto
- `README.md` - Visión general
- `QUICKSTART.md` - Inicio rápido
- `docs/API.md` - API Reference
- `docs/DEPLOYMENT.md` - Deploy a AWS
- `PROJECT_STATUS.md` - Estado del proyecto

---

## 🤝 Contribuir

### Workflow de Git

```powershell
# 1. Crear branch para feature
git checkout -b feature/mi-nueva-feature

# 2. Hacer cambios y commits
git add .
git commit -m "Add: nueva funcionalidad X"

# 3. Push a remote
git push origin feature/mi-nueva-feature

# 4. Crear Pull Request en GitHub
```

### Convención de Commits

```
Add: nueva funcionalidad
Fix: corrección de bug
Update: actualización de código existente
Refactor: refactorización sin cambio de funcionalidad
Docs: cambios en documentación
Test: agregar o actualizar tests
Style: cambios de formato (no afectan código)
```

### Code Review Checklist
- [ ] Tests pasan
- [ ] Código sigue convenciones
- [ ] Documentación actualizada
- [ ] Sin console.logs innecesarios
- [ ] Variables de entorno documentadas
- [ ] Sin datos sensibles en código

---

## 💡 Tips y Mejores Prácticas

### Seguridad
- ✅ Nunca hardcodear credenciales
- ✅ Usar variables de entorno
- ✅ Validar todos los inputs
- ✅ Sanitizar datos de usuarios
- ✅ Usar prepared statements (evitar SQL injection)
- ✅ Mantener dependencias actualizadas

### Performance
- ✅ Usar índices en base de datos
- ✅ Cachear con Redis cuando sea posible
- ✅ Paginar resultados grandes
- ✅ Usar async/await correctamente
- ✅ Optimizar queries SQL
- ✅ Comprimir respuestas HTTP

### Código Limpio
- ✅ Funciones pequeñas y específicas
- ✅ Nombres descriptivos
- ✅ Comentar código complejo
- ✅ Evitar duplicación (DRY)
- ✅ Manejar errores correctamente
- ✅ Usar constantes para valores magic

---

## 📞 Soporte

¿Necesitas ayuda?

1. **Revisa la documentación** en `/docs`
2. **Busca en issues** de GitHub
3. **Pregunta al equipo** en Slack/Teams
4. **Crea un issue** con detalles del problema

---

## ✅ Checklist del Desarrollador

Antes de hacer commit:
- [ ] Código funciona localmente
- [ ] Tests pasan
- [ ] Linting sin errores
- [ ] Documentación actualizada
- [ ] Sin console.logs de debug
- [ ] Archivos `.env` no incluidos
- [ ] Commit message descriptivo

---

¡Happy Coding! 🚀
