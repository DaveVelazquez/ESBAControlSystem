#!/bin/bash
# Script de Setup Automático para AWS
# Field Service Manager - Deployment Helper

set -e  # Exit on error

echo "================================================"
echo "   Field Service Manager - AWS Setup Script"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "Instala desde: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI instalado${NC}"

# Verificar credenciales AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está configurado${NC}"
    echo "Ejecuta: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}✅ AWS Credentials OK${NC}"
echo "   Account ID: $AWS_ACCOUNT_ID"
echo "   Region: $AWS_REGION"
echo ""

# Función para generar password seguro
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Preguntar si continuar
read -p "¿Deseas continuar con el setup? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "================================================"
echo "   Fase 1: Configuración de Red (VPC)"
echo "================================================"
echo ""

# Crear VPC
echo "Creando VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=field-service-vpc}]' \
    --query 'Vpc.VpcId' \
    --output text)

echo -e "${GREEN}✅ VPC creada: $VPC_ID${NC}"

# Habilitar DNS
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

# Crear Internet Gateway
echo "Creando Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=field-service-igw}]' \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
echo -e "${GREEN}✅ Internet Gateway: $IGW_ID${NC}"

# Crear Subnets
echo "Creando Subnets..."
SUBNET_PUBLIC_1=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-public-1a}]' \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_PUBLIC_2=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-public-1b}]' \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_PRIVATE_1=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.11.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-private-1a}]' \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_PRIVATE_2=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.12.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=field-service-private-1b}]' \
    --query 'Subnet.SubnetId' \
    --output text)

echo -e "${GREEN}✅ Subnets creadas${NC}"

# Habilitar auto-assign IP
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_1 --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_2 --map-public-ip-on-launch

# Crear Route Table
echo "Configurando rutas..."
RT_PUBLIC=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=field-service-public-rt}]' \
    --query 'RouteTable.RouteTableId' \
    --output text)

aws ec2 create-route --route-table-id $RT_PUBLIC --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_1
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_2

echo -e "${GREEN}✅ Rutas configuradas${NC}"
echo ""

echo "================================================"
echo "   Fase 2: Base de Datos (RDS PostgreSQL)"
echo "================================================"
echo ""

# Security Group para RDS
echo "Creando Security Group para RDS..."
RDS_SG=$(aws ec2 create-security-group \
    --group-name field-service-rds-sg \
    --description "Security group for RDS PostgreSQL" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG \
    --protocol tcp \
    --port 5432 \
    --cidr 10.0.0.0/16

echo -e "${GREEN}✅ RDS Security Group: $RDS_SG${NC}"

# DB Subnet Group
echo "Creando DB Subnet Group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name field-service-db-subnet \
    --db-subnet-group-description "Subnet group for Field Service DB" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2 \
    --tags "Key=Name,Value=field-service-db-subnet"

echo -e "${GREEN}✅ DB Subnet Group creado${NC}"

# Generar password
DB_PASSWORD=$(generate_password)
echo -e "${YELLOW}⚠️  DB Password generado (GUÁRDALO): $DB_PASSWORD${NC}"

# Crear RDS Instance
echo "Creando RDS Instance (esto tomará 5-10 minutos)..."
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
    --multi-az \
    --publicly-accessible false \
    --storage-encrypted \
    --tags "Key=Name,Value=field-service-db" > /dev/null

echo "Esperando a que RDS esté disponible..."
aws rds wait db-instance-available --db-instance-identifier field-service-db

DB_HOST=$(aws rds describe-db-instances \
    --db-instance-identifier field-service-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}✅ RDS Instance creada: $DB_HOST${NC}"
echo ""

echo "================================================"
echo "   Fase 3: Cache (ElastiCache Redis)"
echo "================================================"
echo ""

# Security Group para Redis
echo "Creando Security Group para Redis..."
REDIS_SG=$(aws ec2 create-security-group \
    --group-name field-service-redis-sg \
    --description "Security group for Redis" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $REDIS_SG \
    --protocol tcp \
    --port 6379 \
    --cidr 10.0.0.0/16

echo -e "${GREEN}✅ Redis Security Group: $REDIS_SG${NC}"

# Cache Subnet Group
echo "Creando Cache Subnet Group..."
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name field-service-redis-subnet \
    --cache-subnet-group-description "Subnet group for Redis" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2

echo -e "${GREEN}✅ Cache Subnet Group creado${NC}"

# Crear Redis Cluster
echo "Creando Redis Cluster (3-5 minutos)..."
aws elasticache create-cache-cluster \
    --cache-cluster-id field-service-redis \
    --engine redis \
    --cache-node-type cache.t3.micro \
    --num-cache-nodes 1 \
    --engine-version 7.0 \
    --cache-subnet-group-name field-service-redis-subnet \
    --security-group-ids $REDIS_SG \
    --tags "Key=Name,Value=field-service-redis" > /dev/null

echo "Esperando a que Redis esté disponible..."
aws elasticache wait cache-cluster-available --cache-cluster-id field-service-redis

REDIS_HOST=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id field-service-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}✅ Redis Cluster creado: $REDIS_HOST${NC}"
echo ""

echo "================================================"
echo "   Fase 4: Secrets Manager"
echo "================================================"
echo ""

JWT_SECRET=$(generate_password)

echo "Guardando secrets..."
SECRET_ARN=$(aws secretsmanager create-secret \
    --name field-service/backend \
    --description "Backend environment variables" \
    --secret-string "{
        \"DATABASE_URL\": \"postgresql://postgres:$DB_PASSWORD@$DB_HOST:5432/field_service\",
        \"REDIS_URL\": \"redis://$REDIS_HOST:6379\",
        \"JWT_SECRET\": \"$JWT_SECRET\",
        \"NODE_ENV\": \"production\"
    }" \
    --query 'ARN' \
    --output text)

echo -e "${GREEN}✅ Secrets guardados: $SECRET_ARN${NC}"
echo ""

echo "================================================"
echo "   Fase 5: ECR Repository"
echo "================================================"
echo ""

echo "Creando ECR Repository..."
ECR_URI=$(aws ecr create-repository \
    --repository-name field-service-backend \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --query 'repository.repositoryUri' \
    --output text)

echo -e "${GREEN}✅ ECR Repository: $ECR_URI${NC}"
echo ""

echo "================================================"
echo "   Fase 6: IAM Roles"
echo "================================================"
echo ""

# Trust Policy
cat > /tmp/ecs-task-trust-policy.json << 'EOF'
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

echo "Creando IAM Roles..."

# Task Execution Role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file:///tmp/ecs-task-trust-policy.json 2>/dev/null || true

aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

# Secrets Policy
cat > /tmp/secrets-policy.json << EOF
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
    --policy-document file:///tmp/secrets-policy.json 2>/dev/null || true

aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/SecretsManagerAccessPolicy 2>/dev/null || true

# Task Role
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file:///tmp/ecs-task-trust-policy.json 2>/dev/null || true

echo -e "${GREEN}✅ IAM Roles configurados${NC}"
echo ""

echo "================================================"
echo "   Fase 7: Application Load Balancer"
echo "================================================"
echo ""

# Security Group para ALB
echo "Creando Security Group para ALB..."
ALB_SG=$(aws ec2 create-security-group \
    --group-name field-service-alb-sg \
    --description "Security group for ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

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

echo -e "${GREEN}✅ ALB Security Group: $ALB_SG${NC}"

# Security Group para ECS
echo "Creando Security Group para ECS..."
ECS_SG=$(aws ec2 create-security-group \
    --group-name field-service-ecs-sg \
    --description "Security group for ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG \
    --protocol tcp \
    --port 3000 \
    --source-group $ALB_SG

echo -e "${GREEN}✅ ECS Security Group: $ECS_SG${NC}"

# Permitir ECS → RDS
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG \
    --protocol tcp \
    --port 5432 \
    --source-group $ECS_SG

# Permitir ECS → Redis
aws ec2 authorize-security-group-ingress \
    --group-id $REDIS_SG \
    --protocol tcp \
    --port 6379 \
    --source-group $ECS_SG

# Crear ALB
echo "Creando Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name field-service-alb \
    --subnets $SUBNET_PUBLIC_1 $SUBNET_PUBLIC_2 \
    --security-groups $ALB_SG \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo -e "${GREEN}✅ ALB creado: $ALB_DNS${NC}"

# Target Group
echo "Creando Target Group..."
TG_ARN=$(aws elbv2 create-target-group \
    --name field-service-backend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

echo -e "${GREEN}✅ Target Group: $TG_ARN${NC}"

# Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN > /dev/null

echo -e "${GREEN}✅ Listener HTTP configurado${NC}"
echo ""

echo "================================================"
echo "   Fase 8: ECS Cluster"
echo "================================================"
echo ""

echo "Creando ECS Cluster..."
aws ecs create-cluster \
    --cluster-name field-service-cluster \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 > /dev/null

echo -e "${GREEN}✅ ECS Cluster: field-service-cluster${NC}"
echo ""

echo "================================================"
echo "   ✅ CONFIGURACIÓN COMPLETADA"
echo "================================================"
echo ""
echo "Guardando configuración en .aws-config..."

cat > .aws-config << EOF
# AWS Configuration - Field Service Manager
# Generated: $(date)

export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
export AWS_REGION=$AWS_REGION

# Network
export VPC_ID=$VPC_ID
export SUBNET_PUBLIC_1=$SUBNET_PUBLIC_1
export SUBNET_PUBLIC_2=$SUBNET_PUBLIC_2
export SUBNET_PRIVATE_1=$SUBNET_PRIVATE_1
export SUBNET_PRIVATE_2=$SUBNET_PRIVATE_2

# Security Groups
export RDS_SG=$RDS_SG
export REDIS_SG=$REDIS_SG
export ALB_SG=$ALB_SG
export ECS_SG=$ECS_SG

# Database
export DB_HOST=$DB_HOST
export DB_PASSWORD=$DB_PASSWORD

# Redis
export REDIS_HOST=$REDIS_HOST

# Secrets
export SECRET_ARN=$SECRET_ARN
export JWT_SECRET=$JWT_SECRET

# ECR
export ECR_URI=$ECR_URI

# Load Balancer
export ALB_ARN=$ALB_ARN
export ALB_DNS=$ALB_DNS
export TG_ARN=$TG_ARN
EOF

echo -e "${GREEN}✅ Configuración guardada en .aws-config${NC}"
echo ""

echo "================================================"
echo "   📋 PRÓXIMOS PASOS"
echo "================================================"
echo ""
echo "1. Cargar configuración:"
echo "   source .aws-config"
echo ""
echo "2. Build y push de imagen Docker:"
echo "   cd backend"
echo "   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI"
echo "   docker build -t field-service-backend ."
echo "   docker tag field-service-backend:latest $ECR_URI:latest"
echo "   docker push $ECR_URI:latest"
echo ""
echo "3. Registrar Task Definition:"
echo "   Edita aws/ecs-task-definition.json con los valores de .aws-config"
echo "   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json"
echo ""
echo "4. Crear ECS Service:"
echo "   aws ecs create-service \\"
echo "     --cluster field-service-cluster \\"
echo "     --service-name field-service-backend \\"
echo "     --task-definition field-service-backend:1 \\"
echo "     --desired-count 2 \\"
echo "     --launch-type FARGATE \\"
echo "     --network-configuration \"awsvpcConfiguration={subnets=[$SUBNET_PRIVATE_1,$SUBNET_PRIVATE_2],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}\" \\"
echo "     --load-balancers \"targetGroupArn=$TG_ARN,containerName=field-service-backend,containerPort=3000\""
echo ""
echo "5. Verificar:"
echo "   curl http://$ALB_DNS/health"
echo ""
echo "================================================"
echo "   🔐 CREDENCIALES IMPORTANTES"
echo "================================================"
echo ""
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "ALB DNS: http://$ALB_DNS"
echo ""
echo -e "${YELLOW}⚠️  GUARDA ESTAS CREDENCIALES EN UN LUGAR SEGURO${NC}"
echo ""
echo "Ver guía completa en: PASOS_DEPLOYMENT_AWS.md"
