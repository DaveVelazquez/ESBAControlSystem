# Deployment Guide - AWS

## Arquitectura en AWS

```
CloudFront (CDN)
    │
    ├─→ S3 (Frontend estático)
    │
    └─→ Application Load Balancer
            │
            └─→ ECS Fargate (Backend API)
                    │
                    ├─→ RDS PostgreSQL
                    ├─→ ElastiCache Redis
                    └─→ S3 (Evidencias)
```

## Pre-requisitos

- AWS CLI configurado
- AWS CDK instalado: `npm install -g aws-cdk`
- Docker instalado
- Node.js 18+

## 1. Configurar AWS CDK

```bash
cd infrastructure
npm install

# Bootstrap CDK (solo primera vez por región)
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## 2. Configurar Variables

Crear archivo `.env` en `/infrastructure`:

```env
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1
ENVIRONMENT=production
DOMAIN_NAME=api.yourcompany.com
CERTIFICATE_ARN=arn:aws:acm:...
DB_PASSWORD=super-secret-password
JWT_SECRET=super-secret-jwt-key
```

## 3. Deploy Infraestructura

```bash
# Preview cambios
cdk diff

# Deploy todo
cdk deploy --all

# O deploy por stacks
cdk deploy NetworkStack
cdk deploy DatabaseStack
cdk deploy ComputeStack
cdk deploy StorageStack
```

## 4. Deploy Backend

### Opción A: GitHub Actions (Recomendado)

Push a `main` dispara deploy automático.

Configurar secrets en GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REPOSITORY`
- `ECS_CLUSTER`
- `ECS_SERVICE`

### Opción B: Manual

```bash
# Build imagen
cd backend
docker build -t field-service-backend .

# Tag y push a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR-ECR-URL
docker tag field-service-backend:latest YOUR-ECR-URL:latest
docker push YOUR-ECR-URL:latest

# Forzar nuevo deployment
aws ecs update-service --cluster field-service --service backend --force-new-deployment
```

## 5. Deploy Frontend

```bash
cd frontend-web
npm run build

# Sync a S3
aws s3 sync build/ s3://your-frontend-bucket/

# Invalidar CloudFront cache
aws cloudfront create-invalidation --distribution-id DISTRIBUTION-ID --paths "/*"
```

## 6. Configurar Base de Datos

```bash
# Conectar a RDS
psql -h your-rds-endpoint -U postgres -d field_service

# Ejecutar migraciones
\i /path/to/001_initial_schema.sql
\i /path/to/dev_data.sql
```

## 7. Verificación

```bash
# Health check
curl https://api.yourcompany.com/health

# Test login
curl -X POST https://api.yourcompany.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Test1234"}'
```

## Monitoreo

- **CloudWatch Logs**: `/aws/ecs/field-service-backend`
- **Metrics**: Dashboard en CloudWatch
- **Alarmas**: Configuradas para errores, latencia, CPU

## Rollback

```bash
# Listar deployments
aws ecs list-task-definitions --family-prefix field-service

# Rollback a versión anterior
aws ecs update-service \
  --cluster field-service \
  --service backend \
  --task-definition field-service-backend:PREVIOUS-VERSION
```

## Costos Estimados (Mensual)

- ECS Fargate (2 tasks): ~$60
- RDS t3.micro: ~$15
- ElastiCache t3.micro: ~$12
- S3 + CloudFront: ~$5
- ALB: ~$20
- **Total aprox**: $110-150/mes

## Escalamiento

### Horizontal (más containers)
```bash
aws ecs update-service \
  --cluster field-service \
  --service backend \
  --desired-count 4
```

### Vertical (más recursos)
Modificar CDK task definition: `cpu: 1024, memory: 2048`

## Seguridad

- ✅ VPC privada para RDS/Redis
- ✅ Security Groups restrictivos
- ✅ Secrets en AWS Secrets Manager
- ✅ HTTPS only
- ✅ WAF en CloudFront
- ✅ Encriptación en reposo (RDS, S3)

## Troubleshooting

### Backend no levanta
```bash
# Ver logs
aws logs tail /aws/ecs/field-service-backend --follow

# Ver eventos del servicio
aws ecs describe-services --cluster field-service --services backend
```

### Base de datos no conecta
```bash
# Verificar security groups
# Verificar connection string
# Revisar CloudWatch logs
```

## Backup

- RDS: Automated backups (7 días retención)
- S3: Versioning habilitado
- Manual: Snapshots antes de deployments mayores

```bash
# Crear snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier field-service-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```
