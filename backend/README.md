# Backend API - Field Service System

API REST para el sistema de monitoreo de técnicos en campo.

## Stack

- Node.js 18+
- Express.js
- PostgreSQL 14+ con PostGIS
- Redis (cache)
- JWT Authentication
- Socket.IO (real-time)

## Instalación Rápida

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones

# Ejecutar migraciones (requiere PostgreSQL corriendo)
npm run migrate

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## Variables de Entorno Requeridas

Ver `.env.example` para la lista completa.

Las más críticas:
- `DATABASE_URL`: Conexión a PostgreSQL
- `JWT_SECRET`: Secret para tokens JWT
- `AWS_*`: Credenciales AWS para S3
- `MAPBOX_ACCESS_TOKEN`: Token de Mapbox

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Órdenes
- `GET /api/orders` - Listar órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Detalle de orden
- `POST /api/orders/assign` - Asignar orden

### Técnicos
- `GET /api/technicians` - Listar técnicos
- `GET /api/technicians/:id/orders` - Órdenes del técnico

### Check-in/out
- `POST /api/orders/:id/checkin` - Registrar llegada
- `POST /api/orders/:id/checkout` - Registrar salida

### Evidencias
- `POST /api/orders/:id/evidences/photo` - Subir foto
- `POST /api/orders/:id/evidences/signature` - Guardar firma
- `GET /api/orders/:id/evidences` - Listar evidencias

### Ubicaciones
- `POST /api/locations/ping` - Actualizar ubicación
- `GET /api/locations/technicians` - Ubicaciones en tiempo real

## Testing

```bash
npm test              # Ejecutar tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Estructura

```
backend/
├── src/
│   ├── config/         # Configuraciones
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middleware (auth, errors, etc)
│   ├── models/         # Modelos
│   ├── routes/         # Rutas Express
│   ├── services/       # Lógica de negocio
│   ├── utils/          # Utilidades
│   └── server.js       # Entry point
├── tests/              # Tests
├── logs/               # Logs (generados)
├── .env.example        # Variables de entorno ejemplo
├── Dockerfile          # Docker config
└── package.json
```

## Socket.IO Events

### Cliente emite:
- `join-order` - Unirse a room de orden
- `location-update` - Actualizar ubicación

### Servidor emite:
- `technician-location` - Nueva ubicación de técnico
- `order-updated` - Orden actualizada
- `sla-alert` - Alerta de SLA

## Deployment

Ver documentación en `/docs/deployment.md`
