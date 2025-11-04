# 🚀 Resumen: Implementación en AWS

## 📝 Documentación Completa

He creado **2 documentos** para ayudarte con el deployment:

### 1️⃣ **PASOS_DEPLOYMENT_AWS.md** (Guía Detallada)
- ✅ 7 fases completas paso a paso
- ✅ Comandos AWS CLI listos para copiar/pegar
- ✅ Explicaciones de cada servicio
- ✅ Troubleshooting incluido
- ✅ Estimación de costos (~$85/mes)

### 2️⃣ **aws/setup-aws.sh** (Script Automático)
- ✅ Automatiza Fases 1-8 (VPC, RDS, Redis, ALB, ECS)
- ✅ Genera passwords seguros
- ✅ Guarda configuración en `.aws-config`
- ✅ Ahorra ~30 minutos de trabajo manual

---

## ⚡ Quick Start

### Opción A: Script Automático (Recomendado)

```bash
# 1. Ir a directorio del proyecto
cd "C:\dev\Dev2\Sistema de Control"

# 2. Ejecutar script (en Git Bash o WSL)
bash aws/setup-aws.sh

# 3. Esperar ~15 minutos
# El script creará: VPC, RDS, Redis, ALB, ECS Cluster, IAM Roles, etc.

# 4. Cargar configuración generada
source .aws-config

# 5. Continuar con pasos manuales (Docker push, Task Definition)
```

### Opción B: Manual Paso a Paso

Sigue la guía completa en **PASOS_DEPLOYMENT_AWS.md**

---

## 📋 Prerequisitos

### ✅ Antes de Empezar

1. **Cuenta AWS Activa**
   - Tarjeta de crédito vinculada
   - Free Tier disponible (primeros 12 meses)

2. **AWS CLI Instalado**
   ```powershell
   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   
   # Verificar
   aws --version
   ```

3. **AWS CLI Configurado**
   ```bash
   aws configure
   # AWS Access Key ID: AKIA...
   # AWS Secret Access Key: wJalr...
   # Region: us-east-1
   # Output: json
   ```

4. **Docker o Podman**
   - Para build de imágenes
   - Ya lo tienes instalado ✅

5. **Token de Mapbox** (Frontend)
   - Crear cuenta en https://mapbox.com
   - Obtener Access Token gratuito

---

## 🏗️ Arquitectura AWS

```
Internet
   │
   ▼
CloudFront (CDN) ─────► S3 Bucket
   │                    (Frontend)
   │
   ▼
Application Load Balancer
   │
   ├─► ECS Fargate Task 1 ─┐
   │                        ├─► RDS PostgreSQL (Multi-AZ)
   └─► ECS Fargate Task 2 ─┤
                            └─► ElastiCache Redis

Secrets Manager (Credenciales)
CloudWatch (Logs + Métricas)
Route 53 (DNS opcional)
```

---

## 📦 Fases de Deployment

### **Fase 1: Configuración Inicial** ⏱️ 5 min
- [x] Instalar AWS CLI
- [x] Configurar credenciales
- [x] Verificar acceso

### **Fase 2: Red (VPC)** ⏱️ 3 min
- [ ] Crear VPC (10.0.0.0/16)
- [ ] 2 Subnets públicas
- [ ] 2 Subnets privadas
- [ ] Internet Gateway
- [ ] Route Tables

### **Fase 3: Base de Datos (RDS)** ⏱️ 10 min
- [ ] Security Group
- [ ] DB Subnet Group
- [ ] RDS PostgreSQL Multi-AZ (db.t3.micro)
- [ ] Esperar disponibilidad

### **Fase 4: Cache (Redis)** ⏱️ 5 min
- [ ] Security Group
- [ ] Cache Subnet Group
- [ ] ElastiCache Redis (cache.t3.micro)

### **Fase 5: Backend (ECS)** ⏱️ 15 min
- [ ] ECR Repository
- [ ] Secrets Manager
- [ ] IAM Roles
- [ ] Build Docker image
- [ ] Push a ECR
- [ ] ECS Cluster
- [ ] Task Definition
- [ ] ECS Service

### **Fase 6: Load Balancer** ⏱️ 5 min
- [ ] Security Groups
- [ ] Application Load Balancer
- [ ] Target Group
- [ ] Listener HTTP/HTTPS

### **Fase 7: Frontend (S3)** ⏱️ 10 min
- [ ] S3 Bucket
- [ ] Build frontend
- [ ] Upload a S3
- [ ] CloudFront Distribution

### **Fase 8: CI/CD** ⏱️ 5 min
- [ ] Configurar GitHub Secrets
- [ ] Push a main
- [ ] Verificar GitHub Actions

**⏱️ TOTAL: ~60 minutos** (30 min con script)

---

## 💰 Costos Estimados

| Servicio | Tipo | Costo/mes |
|----------|------|-----------|
| **ECS Fargate** | 2 tasks (0.25 vCPU, 0.5 GB) | $15 |
| **RDS PostgreSQL** | db.t3.micro Multi-AZ | $30 |
| **ElastiCache Redis** | cache.t3.micro | $15 |
| **ALB** | 1 Application Load Balancer | $20 |
| **S3 + CloudFront** | 10 GB, 1M requests | $5 |
| **Data Transfer** | Estimado | $5 |
| **TOTAL** | | **~$90/mes** |

### 💡 Optimizaciones de Costo

**Para desarrollo/testing:**
- ✅ Usar RDS Single-AZ: **-$15/mes**
- ✅ ECS 1 task en vez de 2: **-$7/mes**
- ✅ Sin ElastiCache: **-$15/mes**
- **Total dev:** **~$50/mes**

**Free Tier (primeros 12 meses):**
- ✅ 750 hrs/mes ECS Fargate
- ✅ 750 hrs/mes RDS db.t3.micro
- ✅ 50 GB S3 storage
- ✅ 1 TB CloudFront transfer
- **Costo real primer año:** **~$30-40/mes**

---

## 🎯 Comandos Rápidos

### Verificar Estado

```bash
# Backend health
curl http://tu-alb-dns.amazonaws.com/health

# ECS tasks running
aws ecs list-tasks --cluster field-service-cluster

# RDS status
aws rds describe-db-instances \
  --db-instance-identifier field-service-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Ver logs
aws logs tail /ecs/field-service-backend --follow
```

### Deployment Rápido

```bash
# Backend
cd backend
./deploy.sh

# Frontend
cd frontend-web
./deploy.sh
```

### Limpiar Todo (Cuidado!)

```bash
# Eliminar ECS Service
aws ecs update-service \
  --cluster field-service-cluster \
  --service field-service-backend \
  --desired-count 0

aws ecs delete-service \
  --cluster field-service-cluster \
  --service field-service-backend

# Eliminar RDS (crea snapshot)
aws rds delete-db-instance \
  --db-instance-identifier field-service-db \
  --final-db-snapshot-identifier field-service-final-snapshot

# Eliminar Redis
aws elasticache delete-cache-cluster \
  --cache-cluster-id field-service-redis

# Nota: VPC, ALB, S3 eliminar manualmente en consola
```

---

## 📚 Recursos Adicionales

### Documentación AWS
- **ECS**: https://docs.aws.amazon.com/ecs/
- **RDS**: https://docs.aws.amazon.com/rds/
- **CloudFront**: https://docs.aws.amazon.com/cloudfront/

### Consola AWS
- **Dashboard**: https://console.aws.amazon.com
- **ECS**: https://console.aws.amazon.com/ecs
- **RDS**: https://console.aws.amazon.com/rds
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch

### Tu Repositorio
- **GitHub**: https://github.com/DaveVelazquez/ESBAControlSystem
- **Actions**: https://github.com/DaveVelazquez/ESBAControlSystem/actions

---

## 🆘 Ayuda

### Si algo falla:

1. **Revisar logs de CloudWatch**
   ```bash
   aws logs tail /ecs/field-service-backend --follow
   ```

2. **Ver eventos de ECS**
   ```bash
   aws ecs describe-services \
     --cluster field-service-cluster \
     --services field-service-backend \
     --query 'services[0].events[:5]'
   ```

3. **Verificar Security Groups**
   - RDS debe permitir 5432 desde ECS SG
   - Redis debe permitir 6379 desde ECS SG
   - ALB debe permitir 80/443 desde Internet
   - ECS debe permitir 3000 desde ALB SG

4. **Consultar guía completa**
   - Ver `PASOS_DEPLOYMENT_AWS.md` sección Troubleshooting

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Base de datos con Multi-AZ habilitado
- [ ] Backups automáticos configurados (7 días)
- [ ] SSL/TLS en CloudFront (ACM certificate)
- [ ] Dominio personalizado configurado
- [ ] Secrets rotados (cambiar defaults)
- [ ] CloudWatch Alarms configuradas
- [ ] Budget Alerts activadas
- [ ] GitHub Secrets configurados
- [ ] CI/CD funcionando
- [ ] Monitoreo activo

---

## 🎉 ¿Listo para Empezar?

### Método Rápido (Script):
```bash
bash aws/setup-aws.sh
```

### Método Manual (Control total):
Abre **PASOS_DEPLOYMENT_AWS.md** y sigue paso a paso.

---

**📧 Soporte:** 
- Repositorio: https://github.com/DaveVelazquez/ESBAControlSystem/issues
- Documentación completa en: `PASOS_DEPLOYMENT_AWS.md`

**Última actualización:** 4 de noviembre de 2025
