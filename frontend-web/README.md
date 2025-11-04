# Frontend Web - Field Service Manager

Aplicación web responsive para el Sistema de Monitoreo de Técnicos en Campo, desarrollada con React + TypeScript + Material-UI.

## 🚀 Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Material-UI (MUI)** - Framework de componentes
- **Redux Toolkit** - Gestión de estado
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **Socket.IO Client** - WebSockets para tiempo real
- **Mapbox GL** - Mapas y geolocalización
- **Recharts** - Gráficos y visualización de datos
- **React Hook Form + Yup** - Manejo de formularios y validación
- **date-fns** - Utilidades de fechas
- **Notistack** - Notificaciones toast

## 📁 Estructura del Proyecto

```
frontend-web/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/        # Componentes reusables
│   │   ├── Layout.tsx    # Layout principal con sidebar
│   │   └── PrivateRoute.tsx
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Login.tsx     # Página de login
│   │   ├── Dashboard.tsx # Dashboard principal
│   │   ├── Orders.tsx    # Gestión de órdenes
│   │   ├── Technicians.tsx
│   │   ├── Tracking.tsx  # Mapa en tiempo real
│   │   └── Reports.tsx
│   ├── services/          # Servicios API
│   │   ├── api.ts        # Cliente Axios configurado
│   │   ├── socket.ts     # Cliente Socket.IO
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── technician.service.ts
│   │   └── dashboard.service.ts
│   ├── store/             # Redux store
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── orderSlice.ts
│   │   └── technicianSlice.ts
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts
│   ├── hooks/             # Custom hooks
│   │   ├── useAppDispatch.ts
│   │   └── useResponsive.ts
│   ├── utils/             # Utilidades
│   │   ├── dateUtils.ts
│   │   ├── statusUtils.ts
│   │   └── formatters.ts
│   ├── theme.ts           # Tema de Material-UI
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globales
├── .env.example           # Ejemplo de variables de entorno
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd frontend-web
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_APP_NAME=Field Service Manager
VITE_APP_VERSION=1.0.0
```

**Obtener token de Mapbox:**
1. Crear cuenta en https://mapbox.com
2. Ir a Account > Access Tokens
3. Crear nuevo token o copiar el token por defecto

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3001

## 📱 Diseño Responsive

La aplicación está optimizada para:

- **📱 Móviles** (< 600px): Layout simplificado, menú hamburguesa
- **📱 Tablets** (600px - 900px): Layout adaptativo
- **💻 Desktop** (> 900px): Sidebar permanente, vistas completas

### Breakpoints

```typescript
xs: 0px      // Móvil pequeño
sm: 600px    // Móvil grande / Tablet pequeña
md: 900px    // Tablet
lg: 1200px   // Desktop
xl: 1536px   // Desktop grande
```

## 🎨 Características UI

### Tema Personalizado
- Colores primarios: Azul (#1976d2)
- Tipografía: Inter, Roboto
- Border radius consistente: 8-12px
- Sombras suaves para elevación
- Modo claro (dark mode planificado)

### Componentes Principales

#### Layout
- Sidebar responsive colapsable
- AppBar con notificaciones
- Menú de usuario
- Navegación activa resaltada

#### Dashboard
- 8 tarjetas de estadísticas (KPIs)
- Gráficos de estado de órdenes
- Estado de técnicos en tiempo real
- Animaciones suaves

#### Login
- Diseño centrado y atractivo
- Validación de formularios
- Manejo de errores
- Credenciales de prueba visibles

## 🔌 Integración con Backend

### Autenticación
- JWT almacenado en localStorage
- Interceptor de Axios para token automático
- Redirección automática en 401
- Logout limpia estado y token

### API Endpoints
```typescript
// Auth
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me

// Orders
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
POST   /api/orders/:id/assign
DELETE /api/orders/:id

// Technicians
GET  /api/technicians
GET  /api/technicians/:id
GET  /api/locations/active

// Dashboard
GET  /api/dashboard/stats
GET  /api/reports/performance
```

### WebSocket Events
```typescript
// Escuchar eventos
socket.on('location:update', (location) => {})
socket.on('order:update', (event) => {})
socket.on('order:assigned', (data) => {})
socket.on('technician:status', (data) => {})
socket.on('sla:alert', (data) => {})

// Emitir eventos
socket.emit('order:join', { orderId })
socket.emit('order:leave', { orderId })
```

## 🧪 Testing (Planeado)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Build para Producción

```bash
npm run build
```

Genera archivos optimizados en `/dist`:
- HTML, CSS, JS minificados
- Code splitting automático
- Tree shaking
- Source maps
- Assets optimizados

## 🚀 Deploy

### Opción 1: AWS S3 + CloudFront (Recomendado)

```bash
# Build
npm run build

# Deploy con AWS CLI
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Opción 2: Vercel

```bash
npm install -g vercel
vercel
```

### Opción 3: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🔧 Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "tsc && vite build",     // Build de producción
  "preview": "vite preview",        // Preview del build
  "lint": "eslint . --ext ts,tsx"   // Linter
}
```

## 🌐 PWA (Progressive Web App)

La aplicación está configurada como PWA:
- ✅ Instalable en dispositivos
- ✅ Caché de assets estáticos
- ✅ Funciona offline (básico)
- ✅ Service Worker automático

## 📊 Estado de Desarrollo

- [x] Configuración inicial del proyecto
- [x] Sistema de autenticación UI
- [x] Layout responsive con sidebar
- [x] Dashboard con KPIs
- [x] Redux store configurado
- [x] Servicios API
- [x] WebSocket client
- [x] Tema Material-UI personalizado
- [ ] Módulo completo de Órdenes
- [ ] Módulo completo de Técnicos
- [ ] Mapa de tracking con Mapbox
- [ ] Reportes y analytics
- [ ] Filtros avanzados
- [ ] Exportar a PDF/Excel
- [ ] Tests unitarios
- [ ] Tests E2E

## 🤝 Contribuir

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👥 Equipo

- Desarrollado con ❤️ por GitHub Copilot
- Fecha: 2025

## 📞 Soporte

Para soporte y preguntas, contactar al equipo de desarrollo.
