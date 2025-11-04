# Field Service Manager - AWS Deployment Guide

## 🚀 Arquitectura en AWS

```
┌─────────────────────────────────────────────────────────┐
│                      AWS Cloud                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              CloudFront (CDN)                    │  │
│  │         https://tu-dominio.com                   │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                 │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │              S3 Bucket                           │  │
│  │        Frontend React (Static)                   │  │
│  │    field-service-frontend-prod                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Application Load Balancer               │  │
│  │            api.tu-dominio.com                    │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                 │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │              ECS Fargate                         │  │
│  │         Backend Node.js Containers               │  │
│  │         (Auto-scaling 2-10 tasks)                │  │
│  └────────────┬─────────────────┬───────────────────┘  │
│               │                 │                       │
│  ┌────────────▼────┐  ┌────────▼────────┐             │
│  │   RDS PostgreSQL │  │   ElastiCache   │             │
│  │   (Multi-AZ)     │  │   Redis         │             │
│  └──────────────────┘  └─────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisitos

### 1. AWS Account
- ✅ Cuenta AWS activa
- ✅ AWS CLI instalado y configurado
- ✅ Credenciales IAM con permisos necesarios

### 2. Herramientas Locales
```bash
# AWS CLI
aws --version

# Docker (para builds)
docker --version

# Node.js
node --version
npm --version
```

### 3. Variables de Entorno
Crear archivo `.env.production` en la raíz del proyecto:

```env
# Database
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/field_service

# Redis
REDIS_URL=redis://elasticache-endpoint:6379

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://tu-dominio.com

# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# S3
S3_BUCKET=field-service-frontend-prod
S3_REGION=us-east-1

# CloudFront
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# Mapbox
VITE_MAPBOX_TOKEN=tu-token-de-mapbox-aqui
```

---

## 🗄️ Paso 1: Configurar Base de Datos (RDS PostgreSQL)

### Crear RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier field-service-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password TU_PASSWORD_AQUI \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false
```

### Ejecutar Migraciones
```bash
# Conectar a RDS via bastion host o VPN
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d field_service

# Ejecutar migraciones
\i database/migrations/001_initial_schema.sql
\i database/seeds/001_create_admin_user.sql
```

---

## 🔴 Paso 2: Configurar Redis (ElastiCache)

### Crear ElastiCache Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id field-service-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name default \
  --security-group-ids sg-xxxxxxxxx
```

---

## 🐳 Paso 3: Deploy Backend en ECS Fargate

### 3.1 Crear ECR Repository
```bash
aws ecr create-repository \
  --repository-name field-service-backend \
  --region us-east-1
```

### 3.2 Build y Push Docker Image
```bash
# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build image
cd backend
docker build -t field-service-backend .

# Tag image
docker tag field-service-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/field-service-backend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/field-service-backend:latest
```

### 3.3 Crear ECS Task Definition
Ver archivo `aws/ecs-task-definition.json`

### 3.4 Crear ECS Service
```bash
aws ecs create-service \
  --cluster field-service-cluster \
  --service-name field-service-backend \
  --task-definition field-service-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000"
```

---

## ☁️ Paso 4: Deploy Frontend en S3 + CloudFront

### 4.1 Crear S3 Bucket
```bash
aws s3 mb s3://field-service-frontend-prod --region us-east-1

# Configurar bucket para hosting estático
aws s3 website s3://field-service-frontend-prod \
  --index-document index.html \
  --error-document index.html
```

### 4.2 Configurar Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::field-service-frontend-prod/*"
    }
  ]
}
```

### 4.3 Build Frontend
```bash
cd frontend-web

# Configurar variables de entorno
export VITE_API_URL=https://api.tu-dominio.com
export VITE_SOCKET_URL=https://api.tu-dominio.com
export VITE_MAPBOX_TOKEN=tu-token-aqui

# Build
npm run build
```

### 4.4 Deploy a S3
```bash
# Sync a S3
aws s3 sync dist/ s3://field-service-frontend-prod/ \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html" \
  --exclude "manifest.webmanifest"

# index.html con cache corto
aws s3 cp dist/index.html s3://field-service-frontend-prod/index.html \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"
```

### 4.5 Crear CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name field-service-frontend-prod.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

### 4.6 Invalidar Cache de CloudFront
```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

---

## 🔒 Paso 5: Configurar Dominios y SSL

### Route 53
```bash
# Crear hosted zone
aws route53 create-hosted-zone --name tu-dominio.com

# Crear records A para frontend (CloudFront)
# Crear records A para backend (ALB)
```

### ACM (Certificate Manager)
```bash
# Request certificate
aws acm request-certificate \
  --domain-name tu-dominio.com \
  --subject-alternative-names "*.tu-dominio.com" \
  --validation-method DNS
```

---

## 📦 Scripts de Deployment Automatizado

### Deploy Frontend
```bash
npm run deploy:frontend
```

Ver `package.json` en frontend-web:
```json
{
  "scripts": {
    "deploy:frontend": "npm run build && aws s3 sync dist/ s3://field-service-frontend-prod/ --delete && aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths '/*'"
  }
}
```

### Deploy Backend
```bash
npm run deploy:backend
```

Ver `package.json` en backend:
```json
{
  "scripts": {
    "deploy:backend": "./deploy.sh"
  }
}
```

---

## 🔐 Seguridad

### Secrets Manager
```bash
# Guardar secrets en AWS Secrets Manager
aws secretsmanager create-secret \
  --name field-service/database \
  --secret-string '{"username":"postgres","password":"..."}'

aws secretsmanager create-secret \
  --name field-service/jwt \
  --secret-string '{"secret":"..."}'
```

### Security Groups
- **ALB**: 80, 443 desde 0.0.0.0/0
- **ECS Tasks**: 3000 desde ALB SG
- **RDS**: 5432 desde ECS SG
- **Redis**: 6379 desde ECS SG

---

## 📊 Monitoreo

### CloudWatch
```bash
# Ver logs
aws logs tail /ecs/field-service-backend --follow

# Métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=field-service-backend \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 💰 Costos Estimados (us-east-1)

| Servicio | Configuración | Costo Mensual |
|----------|---------------|---------------|
| ECS Fargate | 2 tasks (0.25 vCPU, 0.5 GB) | ~$15 |
| RDS PostgreSQL | db.t3.micro Multi-AZ | ~$30 |
| ElastiCache Redis | cache.t3.micro | ~$15 |
| ALB | Standard | ~$20 |
| S3 + CloudFront | 10 GB + 100k requests | ~$5 |
| Route 53 | 1 hosted zone | ~$0.50 |
| **TOTAL** | | **~$85/mes** |

---

## 🚀 Checklist de Deployment

- [ ] RDS PostgreSQL creado y configurado
- [ ] ElastiCache Redis creado
- [ ] ECR repository creado
- [ ] Backend image subida a ECR
- [ ] ECS Cluster y Service creados
- [ ] ALB configurado con target groups
- [ ] S3 bucket creado para frontend
- [ ] Frontend buildeado y subido a S3
- [ ] CloudFront distribution creada
- [ ] Dominios configurados en Route 53
- [ ] Certificados SSL en ACM
- [ ] Security groups configurados
- [ ] Secrets en Secrets Manager
- [ ] Logs configurados en CloudWatch
- [ ] Auto-scaling configurado
- [ ] Backup automatizado configurado

---

## 🔄 CI/CD con GitHub Actions

Ver `.github/workflows/deploy.yml` para pipeline automatizado.

---

## 📞 Soporte

Para problemas o preguntas sobre el deployment:
1. Revisar logs en CloudWatch
2. Verificar health checks de ECS
3. Verificar conectividad RDS/Redis
4. Revisar security groups

---

*Última actualización: 4 de noviembre de 2025*
