# 🚀 Guía Paso a Paso: Deploy en AWS

Esta guía te llevará desde cero hasta tener tu sistema **Field Service Manager** completamente funcional en AWS.

---

## 📋 Índice
1. [Prerequisitos](#prerequisitos)
2. [Fase 1: Configuración AWS Inicial](#fase-1-configuración-aws-inicial)
3. [Fase 2: Base de Datos (RDS PostgreSQL)](#fase-2-base-de-datos-rds-postgresql)
4. [Fase 3: Cache (ElastiCache Redis)](#fase-3-cache-elasticache-redis)
5. [Fase 4: Backend (ECS Fargate)](#fase-4-backend-ecs-fargate)
6. [Fase 5: Frontend (S3 + CloudFront)](#fase-5-frontend-s3--cloudfront)
7. [Fase 6: Dominio y SSL](#fase-6-dominio-y-ssl)
8. [Fase 7: CI/CD con GitHub Actions](#fase-7-cicd-con-github-actions)
9. [Verificación Final](#verificación-final)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

### ✅ Cuentas y Herramientas
- [ ] Cuenta AWS activa (tarjeta de crédito)
- [ ] AWS CLI instalado y configurado
- [ ] Docker Desktop o Podman instalado
- [ ] Node.js 18+ instalado
- [ ] Token de Mapbox (https://mapbox.com)
- [ ] (Opcional) Dominio propio

### 🔧 Instalar AWS CLI

**Windows (PowerShell como Admin):**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verificar instalación:**
```bash
aws --version
# Debe mostrar: aws-cli/2.x.x
```

### 🔑 Configurar AWS CLI

```bash
aws configure
```

Te pedirá:
```
AWS Access Key ID: AKIA...............
AWS Secret Access Key: wJalr...............................
Default region name: us-east-1
Default output format: json
```

**Verificar configuración:**
```bash
aws sts get-caller-identity
```

---

## Fase 1: Configuración AWS Inicial

### Paso 1.1: Crear IAM User para Deployment

```bash
# Crear usuario
aws iam create-user --user-name field-service-deployer

# Adjuntar políticas necesarias
aws iam attach-user-policy \
  --user-name field-service-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-user-policy \
  --user-name field-service-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name field-service-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Crear Access Key
aws iam create-access-key --user-name field-service-deployer
```

**Guarda las credenciales que te devuelva** (las necesitarás para GitHub Actions).

### Paso 1.2: Crear VPC y Subnets

```bash
# Crear VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=field-service-vpc}]' \
  --query 'Vpc.VpcId' \
  --output text

# Guardar el VPC ID
export VPC_ID=vpc-xxxxxxxxx  # Reemplazar con el ID obtenido

# Crear Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=field-service-igw}]' \
  --query 'InternetGateway.InternetGatewayId' \
  --output text

export IGW_ID=igw-xxxxxxxxx  # Reemplazar

# Adjuntar IGW a VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID

# Crear Subnet Pública 1 (us-east-1a)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-public-1a}]' \
  --query 'Subnet.SubnetId' \
  --output text

export SUBNET_PUBLIC_1=subnet-xxxxxxxxx  # Reemplazar

# Crear Subnet Pública 2 (us-east-1b)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-public-1b}]' \
  --query 'Subnet.SubnetId' \
  --output text

export SUBNET_PUBLIC_2=subnet-xxxxxxxxx  # Reemplazar

# Crear Subnet Privada 1 (us-east-1a)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-private-1a}]' \
  --query 'Subnet.SubnetId' \
  --output text

export SUBNET_PRIVATE_1=subnet-xxxxxxxxx  # Reemplazar

# Crear Subnet Privada 2 (us-east-1b)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.12.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-private-1b}]' \
  --query 'Subnet.SubnetId' \
  --output text

export SUBNET_PRIVATE_2=subnet-xxxxxxxxx  # Reemplazar

# Habilitar auto-assign IP en subnets públicas
aws ec2 modify-subnet-attribute \
  --subnet-id $SUBNET_PUBLIC_1 \
  --map-public-ip-on-launch

aws ec2 modify-subnet-attribute \
  --subnet-id $SUBNET_PUBLIC_2 \
  --map-public-ip-on-launch

# Crear Route Table pública
aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=field-service-public-rt}]' \
  --query 'RouteTable.RouteTableId' \
  --output text

export RT_PUBLIC=rtb-xxxxxxxxx  # Reemplazar

# Crear ruta a Internet
aws ec2 create-route \
  --route-table-id $RT_PUBLIC \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Asociar subnets públicas
aws ec2 associate-route-table \
  --route-table-id $RT_PUBLIC \
  --subnet-id $SUBNET_PUBLIC_1

aws ec2 associate-route-table \
  --route-table-id $RT_PUBLIC \
  --subnet-id $SUBNET_PUBLIC_2
```

**✅ Checkpoint:** Deberías tener VPC, IGW, 2 subnets públicas, 2 subnets privadas.

---

## Fase 2: Base de Datos (RDS PostgreSQL)

### Paso 2.1: Crear Security Group para RDS

```bash
# Crear Security Group
aws ec2 create-security-group \
  --group-name field-service-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text

export RDS_SG=sg-xxxxxxxxx  # Reemplazar

# Permitir PostgreSQL desde VPC
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
```

### Paso 2.2: Crear Subnet Group para RDS

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name field-service-db-subnet \
  --db-subnet-group-description "Subnet group for Field Service DB" \
  --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2 \
  --tags "Key=Name,Value=field-service-db-subnet"
```

### Paso 2.3: Crear RDS PostgreSQL Instance

```bash
# Generar password seguro
export DB_PASSWORD=$(openssl rand -base64 32)
echo "Database Password: $DB_PASSWORD"
# ⚠️ GUARDAR ESTE PASSWORD - LO NECESITARÁS DESPUÉS

# Crear instancia RDS
aws rds create-db-instance \
  --db-instance-identifier field-service-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.10 \
  --master-username postgres \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name field-service-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags "Key=Name,Value=field-service-db"

# Esperar a que esté disponible (5-10 minutos)
aws rds wait db-instance-available \
  --db-instance-identifier field-service-db

# Obtener endpoint
aws rds describe-db-instances \
  --db-instance-identifier field-service-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

export DB_HOST=field-service-db.xxxxxxxxx.us-east-1.rds.amazonaws.com  # Reemplazar
```

### Paso 2.4: Crear Base de Datos y Extensiones

```bash
# Conectar desde tu máquina local (necesitas PostgreSQL client)
# Si no tienes acceso directo, crea un bastion host o usa RDS Query Editor

# Crear archivo SQL temporal
cat > init-db.sql << 'EOF'
CREATE DATABASE field_service;
\c field_service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
EOF

# Ejecutar (si tienes acceso directo)
psql -h $DB_HOST -U postgres -f init-db.sql
```

**Nota:** Si no puedes conectarte directamente, salta este paso y lo haremos desde ECS después.

---

## Fase 3: Cache (ElastiCache Redis)

### Paso 3.1: Crear Security Group para Redis

```bash
# Crear Security Group
aws ec2 create-security-group \
  --group-name field-service-redis-sg \
  --description "Security group for Redis" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text

export REDIS_SG=sg-xxxxxxxxx  # Reemplazar

# Permitir Redis desde VPC
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --cidr 10.0.0.0/16
```

### Paso 3.2: Crear Subnet Group para Redis

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name field-service-redis-subnet \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2
```

### Paso 3.3: Crear Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id field-service-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --engine-version 7.0 \
  --cache-subnet-group-name field-service-redis-subnet \
  --security-group-ids $REDIS_SG \
  --tags "Key=Name,Value=field-service-redis"

# Esperar a que esté disponible (3-5 minutos)
aws elasticache wait cache-cluster-available \
  --cache-cluster-id field-service-redis

# Obtener endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id field-service-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text

export REDIS_HOST=field-service-redis.xxxxxx.0001.use1.cache.amazonaws.com  # Reemplazar
```

---

## Fase 4: Backend (ECS Fargate)

### Paso 4.1: Crear ECR Repository

```bash
# Crear repositorio ECR
aws ecr create-repository \
  --repository-name field-service-backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Obtener URI del repositorio
aws ecr describe-repositories \
  --repository-names field-service-backend \
  --query 'repositories[0].repositoryUri' \
  --output text

export ECR_URI=123456789012.dkr.ecr.us-east-1.amazonaws.com/field-service-backend  # Reemplazar
export AWS_ACCOUNT_ID=123456789012  # Tu Account ID
```

### Paso 4.2: Guardar Secrets en Secrets Manager

```bash
# Crear secret con todas las credenciales
aws secretsmanager create-secret \
  --name field-service/backend \
  --description "Backend environment variables" \
  --secret-string "{
    \"DATABASE_URL\": \"postgresql://postgres:$DB_PASSWORD@$DB_HOST:5432/field_service\",
    \"REDIS_URL\": \"redis://$REDIS_HOST:6379\",
    \"JWT_SECRET\": \"$(openssl rand -base64 32)\",
    \"NODE_ENV\": \"production\"
  }"

# Guardar ARN del secret
export SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id field-service/backend \
  --query 'ARN' \
  --output text)

echo "Secret ARN: $SECRET_ARN"
```

### Paso 4.3: Build y Push de Imagen Docker

```bash
# Ir al directorio backend
cd "C:\dev\Dev2\Sistema de Control\backend"

# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# Build imagen
docker build -t field-service-backend .

# Tag imagen
docker tag field-service-backend:latest $ECR_URI:latest

# Push a ECR
docker push $ECR_URI:latest
```

### Paso 4.4: Crear Security Group para ECS

```bash
# Crear Security Group para ECS Tasks
aws ec2 create-security-group \
  --group-name field-service-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text

export ECS_SG=sg-xxxxxxxxx  # Reemplazar

# Permitir HTTP desde ALB (lo crearemos después)
# Por ahora, permitir desde VPC
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 3000 \
  --cidr 10.0.0.0/16

# Permitir acceso a RDS desde ECS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG

# Permitir acceso a Redis desde ECS
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --source-group $ECS_SG
```

### Paso 4.5: Crear IAM Role para ECS Task

```bash
# Crear Trust Policy
cat > ecs-task-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear Task Execution Role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-task-trust-policy.json

# Adjuntar políticas
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Crear política para acceso a Secrets Manager
cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "$SECRET_ARN"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name SecretsManagerAccessPolicy \
  --policy-document file://secrets-policy.json

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/SecretsManagerAccessPolicy

# Crear Task Role (para el contenedor)
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://ecs-task-trust-policy.json
```

### Paso 4.6: Crear ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name field-service-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### Paso 4.7: Crear Application Load Balancer

```bash
# Crear Security Group para ALB
aws ec2 create-security-group \
  --group-name field-service-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text

export ALB_SG=sg-xxxxxxxxx  # Reemplazar

# Permitir HTTP y HTTPS desde Internet
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Actualizar ECS SG para aceptar desde ALB
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG

# Crear ALB
aws elbv2 create-load-balancer \
  --name field-service-alb \
  --subnets $SUBNET_PUBLIC_1 $SUBNET_PUBLIC_2 \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text

export ALB_ARN=arn:aws:elasticloadbalancing:...  # Reemplazar

# Obtener DNS del ALB
aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text

export ALB_DNS=field-service-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com  # Reemplazar
echo "ALB DNS: http://$ALB_DNS"

# Crear Target Group
aws elbv2 create-target-group \
  --name field-service-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text

export TG_ARN=arn:aws:elasticloadbalancing:...  # Reemplazar

# Crear Listener HTTP (puerto 80)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Paso 4.8: Registrar Task Definition

Edita el archivo `aws/ecs-task-definition.json` y reemplaza:
- `<AWS_ACCOUNT_ID>` con tu Account ID
- `<AWS_REGION>` con `us-east-1`
- `<SECRET_ARN>` con el ARN del secret

```bash
# Registrar task definition
aws ecs register-task-definition \
  --cli-input-json file://C:/dev/Dev2/Sistema\ de\ Control/aws/ecs-task-definition.json
```

### Paso 4.9: Crear ECS Service

```bash
aws ecs create-service \
  --cluster field-service-cluster \
  --service-name field-service-backend \
  --task-definition field-service-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_PRIVATE_1,$SUBNET_PRIVATE_2],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=field-service-backend,containerPort=3000" \
  --health-check-grace-period-seconds 60

# Esperar a que el servicio esté estable (2-3 minutos)
aws ecs wait services-stable \
  --cluster field-service-cluster \
  --services field-service-backend
```

### Paso 4.10: Verificar Backend

```bash
# Ver estado de tasks
aws ecs list-tasks \
  --cluster field-service-cluster \
  --service-name field-service-backend

# Probar API
curl http://$ALB_DNS/health
# Debería devolver: {"status":"ok"}

curl http://$ALB_DNS/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fieldservice.com","password":"admin123"}'
```

---

## Fase 5: Frontend (S3 + CloudFront)

### Paso 5.1: Crear S3 Bucket

```bash
# Nombre único para el bucket
export S3_BUCKET=field-service-frontend-prod-$(date +%s)

# Crear bucket
aws s3 mb s3://$S3_BUCKET --region us-east-1

# Configurar para website hosting
aws s3 website s3://$S3_BUCKET \
  --index-document index.html \
  --error-document index.html

# Crear política de bucket para CloudFront
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $S3_BUCKET \
  --policy file://bucket-policy.json
```

### Paso 5.2: Build Frontend

```bash
cd "C:\dev\Dev2\Sistema de Control\frontend-web"

# Crear .env.production
cat > .env.production << EOF
VITE_API_URL=http://$ALB_DNS
VITE_SOCKET_URL=http://$ALB_DNS
VITE_MAPBOX_TOKEN=pk.eyJ1... # TU TOKEN DE MAPBOX
EOF

# Instalar dependencias si no están
npm install

# Build
npm run build
```

### Paso 5.3: Subir a S3

```bash
# Sync archivos
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# index.html sin cache
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Paso 5.4: Crear CloudFront Distribution

```bash
# Crear Origin Access Control
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  "Name=field-service-oac,Description=OAC for Field Service,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query 'OriginAccessControl.Id' \
  --output text

export OAC_ID=E...  # Reemplazar

# Crear distribution config
cat > cloudfront-config.json << EOF
{
  "CallerReference": "field-service-$(date +%s)",
  "Comment": "Field Service Frontend",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$S3_BUCKET",
        "DomainName": "$S3_BUCKET.s3.us-east-1.amazonaws.com",
        "OriginAccessControlId": "$OAC_ID",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$S3_BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
EOF

# Crear distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  --query 'Distribution.Id' \
  --output text

export CF_DISTRIBUTION_ID=E...  # Reemplazar

# Obtener dominio de CloudFront
aws cloudfront get-distribution \
  --id $CF_DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text

export CF_DOMAIN=d1234567890abc.cloudfront.net  # Reemplazar
echo "CloudFront URL: https://$CF_DOMAIN"
```

**⏰ Esperar 10-15 minutos** para que CloudFront se propague globalmente.

### Paso 5.5: Verificar Frontend

```bash
# Abrir en navegador
start https://$CF_DOMAIN
```

Deberías ver el login del sistema. Prueba con:
- **Email:** admin@fieldservice.com
- **Password:** admin123

---

## Fase 6: Dominio y SSL (Opcional)

### Paso 6.1: Solicitar Certificado SSL

```bash
# Solicitar certificado en ACM (DEBE ser en us-east-1 para CloudFront)
aws acm request-certificate \
  --domain-name tudominio.com \
  --subject-alternative-names www.tudominio.com api.tudominio.com \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text

export CERT_ARN=arn:aws:acm:us-east-1:...  # Reemplazar

# Obtener registros DNS para validación
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[*].ResourceRecord'
```

**Agrega los registros CNAME a tu proveedor DNS** y espera validación (5-30 minutos).

### Paso 6.2: Configurar Dominio en CloudFront

```bash
# Actualizar CloudFront distribution
aws cloudfront get-distribution-config \
  --id $CF_DISTRIBUTION_ID \
  --output json > cf-current-config.json

# Editar cf-current-config.json manualmente:
# - Agregar "Aliases": ["tudominio.com", "www.tudominio.com"]
# - Agregar "ViewerCertificate": {"ACMCertificateArn": "$CERT_ARN", ...}

aws cloudfront update-distribution \
  --id $CF_DISTRIBUTION_ID \
  --if-match $(jq -r '.ETag' cf-current-config.json) \
  --distribution-config file://cf-updated-config.json
```

### Paso 6.3: Configurar Route 53

```bash
# Crear Hosted Zone
aws route53 create-hosted-zone \
  --name tudominio.com \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' \
  --output text

export HOSTED_ZONE_ID=/hostedzone/Z...  # Reemplazar

# Crear registro A para el dominio principal
cat > route53-record.json << EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "tudominio.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "$CF_DOMAIN",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-record.json
```

---

## Fase 7: CI/CD con GitHub Actions

### Paso 7.1: Configurar Secrets en GitHub

Ve a tu repositorio en GitHub:
**https://github.com/DaveVelazquez/ESBAControlSystem**

1. Ir a **Settings** → **Secrets and variables** → **Actions**
2. Clic en **New repository secret**
3. Agregar los siguientes secrets:

```
AWS_ACCESS_KEY_ID          = AKIA...........
AWS_SECRET_ACCESS_KEY      = wJalr..........
AWS_ACCOUNT_ID             = 123456789012
AWS_REGION                 = us-east-1
ECR_REPOSITORY             = field-service-backend
ECS_CLUSTER                = field-service-cluster
ECS_SERVICE                = field-service-backend
ECS_TASK_DEFINITION        = field-service-backend
S3_BUCKET                  = field-service-frontend-prod-xxxxx
CLOUDFRONT_DISTRIBUTION_ID = E1234567890ABC
VITE_API_URL              = http://field-service-alb-xxxx.us-east-1.elb.amazonaws.com
VITE_SOCKET_URL           = http://field-service-alb-xxxx.us-east-1.elb.amazonaws.com
VITE_MAPBOX_TOKEN         = pk.eyJ1...
```

### Paso 7.2: Verificar Workflow

El archivo `.github/workflows/deploy.yml` ya está configurado. Verifica que tenga:

```yaml
on:
  push:
    branches: [ main, production ]
```

### Paso 7.3: Probar CI/CD

```bash
cd "C:\dev\Dev2\Sistema de Control"

# Hacer un cambio pequeño
echo "# Test CI/CD" >> README.md

# Commit y push
git add .
git commit -m "Test: CI/CD deployment"
git push origin main
```

Ve a **GitHub** → **Actions** y observa el deployment automático. 🚀

---

## Verificación Final

### ✅ Checklist de Verificación

```bash
# 1. Backend Health Check
curl http://$ALB_DNS/health
# ✅ Debe devolver: {"status":"ok"}

# 2. Backend Login
curl -X POST http://$ALB_DNS/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fieldservice.com","password":"admin123"}'
# ✅ Debe devolver token JWT

# 3. Frontend en CloudFront
start https://$CF_DOMAIN
# ✅ Debe mostrar login page

# 4. RDS Status
aws rds describe-db-instances \
  --db-instance-identifier field-service-db \
  --query 'DBInstances[0].DBInstanceStatus'
# ✅ Debe ser: "available"

# 5. Redis Status
aws elasticache describe-cache-clusters \
  --cache-cluster-id field-service-redis \
  --query 'CacheClusters[0].CacheClusterStatus'
# ✅ Debe ser: "available"

# 6. ECS Tasks Running
aws ecs describe-services \
  --cluster field-service-cluster \
  --services field-service-backend \
  --query 'services[0].runningCount'
# ✅ Debe ser: 2
```

### 📊 Monitoreo

**CloudWatch Logs:**
```bash
# Ver logs del backend
aws logs tail /ecs/field-service-backend --follow

# Ver logs del ALB
aws logs tail /aws/elasticloadbalancing/app/field-service-alb --follow
```

**Métricas:**
- ECS: https://console.aws.amazon.com/ecs
- RDS: https://console.aws.amazon.com/rds
- CloudFront: https://console.aws.amazon.com/cloudfront

---

## Troubleshooting

### ❌ Backend no responde

```bash
# Ver logs
aws logs tail /ecs/field-service-backend --follow

# Ver tasks
aws ecs list-tasks --cluster field-service-cluster --service-name field-service-backend

# Ver eventos del service
aws ecs describe-services \
  --cluster field-service-cluster \
  --services field-service-backend \
  --query 'services[0].events[:5]'
```

### ❌ Frontend da error 403

```bash
# Invalidar cache de CloudFront
aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION_ID \
  --paths "/*"
```

### ❌ No puedo conectar a RDS

```bash
# Verificar Security Groups
aws ec2 describe-security-groups --group-ids $RDS_SG

# Verificar que ECS SG tenga acceso
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG
```

### ❌ Costos muy altos

```bash
# Reducir instancias ECS
aws ecs update-service \
  --cluster field-service-cluster \
  --service field-service-backend \
  --desired-count 1

# Cambiar a instancia más pequeña en RDS
aws rds modify-db-instance \
  --db-instance-identifier field-service-db \
  --db-instance-class db.t3.micro \
  --apply-immediately
```

---

## 💰 Estimación de Costos Mensual

| Servicio | Configuración | Costo/mes |
|----------|---------------|-----------|
| ECS Fargate | 2 tasks × 0.25 vCPU × 0.5 GB | $15 |
| RDS PostgreSQL | db.t3.micro Multi-AZ | $30 |
| ElastiCache Redis | cache.t3.micro | $15 |
| ALB | 1 instancia | $20 |
| S3 + CloudFront | 10 GB transfer | $5 |
| **TOTAL** | | **~$85/mes** |

---

## 🎉 ¡Felicidades!

Tu sistema Field Service Manager está ahora deployado en AWS con:
- ✅ Alta disponibilidad (Multi-AZ)
- ✅ Auto-scaling de backend
- ✅ CDN global con CloudFront
- ✅ CI/CD automático con GitHub Actions
- ✅ Monitoreo con CloudWatch
- ✅ SSL y dominio personalizado

---

## 📚 Recursos Adicionales

- **AWS Console**: https://console.aws.amazon.com
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups
- **ECS Dashboard**: https://console.aws.amazon.com/ecs/home#/clusters
- **Tu Repositorio**: https://github.com/DaveVelazquez/ESBAControlSystem

---

**¿Necesitas ayuda?** Revisa la documentación completa en `aws/DEPLOYMENT_GUIDE.md`
