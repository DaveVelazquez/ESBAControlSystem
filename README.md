# Sistema de Monitoreo de Técnicos en Campo

Sistema completo para gestión y monitoreo de técnicos en campo con tracking en tiempo real, gestión de órdenes de servicio, captura de evidencias y generación de reportes.

## 🎯 Características Principales

### Backend API
- ✅ Asignación de órdenes a técnicos
- ✅ Tracking de ubicación en tiempo real
- ✅ Check-in/Check-out con geolocalización
- ✅ Upload de fotos y evidencias
- ✅ Firma digital de clientes
- ✅ Generación de reportes PDF
- ✅ Sistema de alertas SLA
- ✅ Notificaciones push (Firebase)
- ✅ Soporte offline-first

### Web Dashboard ✅ **IMPLEMENTADO**
- ✅ Dashboard con 8 KPIs en tiempo real
- ✅ Layout responsive (móvil, tablet, desktop)
- ✅ Sidebar colapsable con navegación
- ✅ Sistema de autenticación con JWT
- ✅ Redux para gestión de estado
- ✅ WebSockets configurados
- ⏳ Mapa en tiempo real con técnicos y órdenes (pendiente)
- ⏳ Reportes y métricas (pendiente)
- ⏳ Filtros avanzados por estado, técnico, zona (pendiente)

### App Móvil
- 📱 Bandeja de órdenes (Hoy, Pendientes, Completadas)
- 🗺️ Navegación con Mapbox
- 📸 Captura de fotos con categorización
- ✍️ Firma digital del cliente
- 📍 Check-in/out con validación geográfica
- 📴 Modo offline con sincronización automática
- 🔔 Push notifications

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  CloudFront  │───▶│     ALB      │───▶│   ECS Fargate│  │
│  │     (CDN)    │    │ (Load Bal.)  │    │  (Backend)   │  │
│  └──────────────┘    └──────────────┘    └───────┬──────┘  │
│                                                    │         │
│  ┌──────────────┐    ┌──────────────┐            │         │
│  │      S3      │    │     RDS      │◀───────────┘         │
│  │  (Storage)   │    │ (PostgreSQL) │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Secrets    │    │  CloudWatch  │                      │
│  │   Manager    │    │  (Monitoring)│                      │
│  └──────────────┘    └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
    ┌─────────┐                          ┌─────────┐
    │   Web   │                          │ Mobile  │
    │Dashboard│                          │   App   │
    └─────────┘                          └─────────┘
```

## 📁 Estructura del Proyecto

```
field-service-system/
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── config/            # Configuraciones
│   │   ├── controllers/       # Controladores
│   │   ├── services/          # Lógica de negocio
│   │   ├── models/            # Modelos de datos
│   │   ├── middleware/        # Middleware
│   │   ├── routes/            # Rutas API
│   │   └── utils/             # Utilidades
│   ├── tests/                 # Tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend-web/              # React Dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # API clients
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utilidades
│   │   └── styles/            # Estilos
│   ├── Dockerfile
│   └── package.json
│
├── mobile-app/                # React Native App
│   ├── android/
│   ├── ios/
│   ├── src/
│   │   ├── components/        # Componentes
│   │   ├── screens/           # Pantallas
│   │   ├── services/          # Servicios
│   │   ├── navigation/        # Navegación
│   │   └── utils/             # Utilidades
│   └── package.json
│
├── infrastructure/            # AWS CDK
│   ├── lib/
│   │   ├── network-stack.ts   # VPC, Subnets
│   │   ├── database-stack.ts  # RDS
│   │   ├── storage-stack.ts   # S3, CloudFront
│   │   ├── compute-stack.ts   # ECS, Fargate
│   │   └── monitoring-stack.ts # CloudWatch
│   ├── bin/
│   └── cdk.json
│
├── database/                  # Scripts SQL
│   ├── migrations/
│   └── seeds/
│
├── .github/
│   └── workflows/             # CI/CD Pipelines
│       ├── backend-deploy.yml
│       ├── frontend-deploy.yml
│       └── mobile-build.yml
│
├── docker-compose.yml         # Desarrollo local
└── README.md
```

## 🚀 Quick Start

### Prerequisitos
- Node.js 18+
- Docker Desktop
- AWS CLI configurado
- PostgreSQL (local) o Docker
- React Native CLI (para mobile)

### 1. Clonar e Instalar Dependencias

```bash
# Instalar dependencias backend
cd backend
npm install

# Instalar dependencias frontend
cd ../frontend-web
npm install

# Instalar dependencias mobile
cd ../mobile-app
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Backend (.env)
cp backend/.env.example backend/.env

# Editar backend/.env con:
DATABASE_URL=postgresql://user:password@localhost:5432/field_service
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET=field-service-evidences
MAPBOX_ACCESS_TOKEN=your-mapbox-token
FIREBASE_SERVER_KEY=your-firebase-key
```

### 3. Inicializar Base de Datos

```bash
cd database
psql -U postgres -f migrations/001_initial_schema.sql
psql -U postgres -f seeds/dev_data.sql
```

### 4. Ejecutar con Docker Compose (Desarrollo)

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Servicios disponibles:
- Backend API: http://localhost:3000
- Frontend Web: http://localhost:3001
- PostgreSQL: localhost:5432
- Adminer (DB UI): http://localhost:8080

### 5. Ejecutar App Móvil

```bash
cd mobile-app

# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 🔧 Desarrollo Local

### Backend
```bash
cd backend
npm run dev        # Modo desarrollo con hot-reload
npm run test       # Ejecutar tests
npm run lint       # Linting
```

### Frontend Web
```bash
cd frontend-web
npm start          # Inicia dev server (puerto 3001)
npm run build      # Build producción
npm test           # Tests
```

### Mobile App
```bash
cd mobile-app
npm start          # Inicia Metro bundler
npm run android    # Build Android
npm run ios        # Build iOS
```

## 📦 Deployment en AWS

### 1. Configurar AWS CDK

```bash
cd infrastructure
npm install
npm run cdk bootstrap
```

### 2. Deploy Infrastructure

```bash
# Deploy completo
npm run cdk deploy --all

# Deploy específico
npm run cdk deploy NetworkStack
npm run cdk deploy DatabaseStack
npm run cdk deploy ComputeStack
```

### 3. Deploy con GitHub Actions

```bash
# Push a main activa deployment automático
git push origin main
```

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ RBAC (Role-Based Access Control)
- ✅ Encriptación TLS 1.2+
- ✅ Secrets en AWS Secrets Manager
- ✅ Validación de inputs
- ✅ Rate limiting
- ✅ Logs de auditoría

## 📊 Monitoreo

- CloudWatch Logs
- CloudWatch Metrics
- Alarmas automáticas
- Dashboard de métricas
- Logs estructurados con correlationId

## 🧪 Testing

```bash
# Backend
cd backend
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report

# Frontend
cd frontend-web
npm test                  # Jest + React Testing Library

# Mobile
cd mobile-app
npm test                  # Jest + Testing Library
```

## 📱 Build Mobile para Producción

### Android
```bash
cd mobile-app/android
./gradlew assembleRelease
# APK en: android/app/build/outputs/apk/release/
```

### iOS
```bash
cd mobile-app
# Abrir en Xcode
open ios/FieldServiceApp.xcworkspace
# Archive y Upload to App Store
```

## 🌍 Variables de Entorno

### Backend
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
MAPBOX_ACCESS_TOKEN=
FIREBASE_SERVER_KEY=
CORS_ORIGIN=
```

### Frontend Web
```env
REACT_APP_API_URL=https://api.example.com
REACT_APP_MAPBOX_TOKEN=
REACT_APP_FIREBASE_CONFIG=
```

### Mobile App
```env
API_URL=https://api.example.com
MAPBOX_ACCESS_TOKEN=
FIREBASE_CONFIG=
```

## 📖 API Documentation

La documentación completa de la API está disponible en:
- Desarrollo: http://localhost:3000/api-docs
- Producción: https://api.example.com/api-docs

Swagger/OpenAPI spec en `/docs/api-spec.yaml`

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Team

- **Product Owner**: [Nombre]
- **Tech Lead**: [Nombre]
- **Backend**: [Equipo]
- **Frontend**: [Equipo]
- **Mobile**: [Equipo]
- **DevOps**: [Equipo]

## 📞 Soporte

Para soporte técnico contactar a: tech-support@company.com

## 🎯 Roadmap

### MVP (8-10 semanas) ⚠️
- [x] Backend API básico ✅
- [x] Asignación de órdenes ✅
- [x] Check-in/out con geo ✅
- [x] Captura de evidencias ⚠️ (endpoints creados)
- [ ] Web dashboard básico ⏳
- [ ] Mobile app básica ⏳
- [ ] Deployment AWS ⏳

### Fase 2 (3-4 meses)
- [ ] Optimización de rutas
- [ ] Analytics avanzados
- [ ] Integración con ERP
- [ ] App offline completa
- [ ] Reconocimiento facial
- [ ] Firma biométrica

### Fase 3 (6 meses)
- [ ] IA predictiva
- [ ] Chatbot asistente
- [ ] Wearables integration
- [ ] AR para diagnóstico
- [ ] Multi-región
