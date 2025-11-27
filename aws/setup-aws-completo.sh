#!/bin/bash

# Script Automático de Configuración AWS para Field Service Manager
# Account ID: 507297234735
# Usuario: github-ci

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=================================================="
echo "   🚀 FIELD SERVICE MANAGER - AWS SETUP"
echo "   Account ID: 507297234735"
echo "   Region: us-east-1"
echo "=================================================="
echo -e "${NC}"

# Variables
AWS_ACCOUNT_ID="507297234735"
AWS_REGION="us-east-1"
PROJECT_NAME="field-service"

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no instalado${NC}"
    echo "Instalar desde: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI encontrado${NC}"

# Verificar credenciales
echo -e "${YELLOW}🔍 Verificando credenciales AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no configurado${NC}"
    echo ""
    echo "Ejecutar primero:"
    echo "aws configure"
    echo ""
    echo "Con estos valores:"
    echo "AWS Access Key ID: AKIAXMHKFP4XXEPAI2U2"
    echo "AWS Secret Access Key: [Tu secret key]"
    echo "Region: us-east-1"
    echo "Output: json"
    exit 1
fi

CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Account ID incorrecto${NC}"
    echo "Esperado: $AWS_ACCOUNT_ID"
    echo "Actual: $CURRENT_ACCOUNT"
    exit 1
fi

echo -e "${GREEN}✅ Credenciales verificadas - Account: $AWS_ACCOUNT_ID${NC}"

# Función para generar passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

echo ""
echo -e "${YELLOW}🏗️  FASE 1: Creando VPC y red...${NC}"

# Crear VPC
echo "Creando VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-vpc}]" \
    --query 'Vpc.VpcId' \
    --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

echo -e "${GREEN}✅ VPC: $VPC_ID${NC}"

# Internet Gateway
echo "Creando Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-igw}]" \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

echo -e "${GREEN}✅ Internet Gateway: $IGW_ID${NC}"

# Subnets
echo "Creando subnets..."

# Públicas
SUBNET_PUBLIC_1=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-public-1a}]" \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_PUBLIC_2=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-public-1b}]" \
    --query 'Subnet.SubnetId' \
    --output text)

# Privadas
SUBNET_PRIVATE_1=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.11.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-1a}]" \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_PRIVATE_2=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.12.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-1b}]" \
    --query 'Subnet.SubnetId' \
    --output text)

# Auto-assign public IPs
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_1 --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_2 --map-public-ip-on-launch

echo -e "${GREEN}✅ Subnets creadas${NC}"

# Route Table
echo "Configurando rutas..."
RT_PUBLIC=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$PROJECT_NAME-public-rt}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

aws ec2 create-route --route-table-id $RT_PUBLIC --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_1
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_2

echo -e "${GREEN}✅ Rutas configuradas${NC}"

echo ""
echo -e "${YELLOW}💾 FASE 2: Creando base de datos...${NC}"

# Security Group RDS
RDS_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-rds-sg \
    --description "RDS PostgreSQL Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG \
    --protocol tcp \
    --port 5432 \
    --cidr 10.0.0.0/16

# DB Subnet Group
aws rds create-db-subnet-group \
    --db-subnet-group-name $PROJECT_NAME-db-subnet \
    --db-subnet-group-description "DB Subnet Group" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2

# Password de DB
DB_PASSWORD=$(generate_password)

# Crear RDS
echo "Creando RDS PostgreSQL (esto toma 5-10 minutos)..."
aws rds create-db-instance \
    --db-instance-identifier $PROJECT_NAME-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 14.10 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --vpc-security-group-ids $RDS_SG \
    --db-subnet-group-name $PROJECT_NAME-db-subnet \
    --backup-retention-period 7 \
    --multi-az \
    --publicly-accessible false \
    --storage-encrypted \
    --tags "Key=Name,Value=$PROJECT_NAME-db" > /dev/null

echo "Esperando RDS..."
aws rds wait db-instance-available --db-instance-identifier $PROJECT_NAME-db

DB_HOST=$(aws rds describe-db-instances \
    --db-instance-identifier $PROJECT_NAME-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}✅ RDS PostgreSQL: $DB_HOST${NC}"

echo ""
echo -e "${YELLOW}🔴 FASE 3: Creando Redis cache...${NC}"

# Security Group Redis
REDIS_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-redis-sg \
    --description "Redis Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $REDIS_SG \
    --protocol tcp \
    --port 6379 \
    --cidr 10.0.0.0/16

# Cache Subnet Group
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name $PROJECT_NAME-redis-subnet \
    --cache-subnet-group-description "Redis Subnet Group" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2

# Crear Redis
echo "Creando Redis cluster..."
aws elasticache create-cache-cluster \
    --cache-cluster-id $PROJECT_NAME-redis \
    --engine redis \
    --cache-node-type cache.t3.micro \
    --num-cache-nodes 1 \
    --engine-version 7.0 \
    --cache-subnet-group-name $PROJECT_NAME-redis-subnet \
    --security-group-ids $REDIS_SG \
    --tags "Key=Name,Value=$PROJECT_NAME-redis" > /dev/null

echo "Esperando Redis..."
aws elasticache wait cache-cluster-available --cache-cluster-id $PROJECT_NAME-redis

REDIS_HOST=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id $PROJECT_NAME-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}✅ Redis: $REDIS_HOST${NC}"

echo ""
echo -e "${YELLOW}🔐 FASE 4: Guardando secrets...${NC}"

JWT_SECRET=$(generate_password)

SECRET_ARN=$(aws secretsmanager create-secret \
    --name "$PROJECT_NAME/backend" \
    --description "Backend environment variables" \
    --secret-string "{
        \"DATABASE_URL\": \"postgresql://postgres:$DB_PASSWORD@$DB_HOST:5432/field_service\",
        \"REDIS_URL\": \"redis://$REDIS_HOST:6379\",
        \"JWT_SECRET\": \"$JWT_SECRET\",
        \"NODE_ENV\": \"production\"
    }" \
    --query 'ARN' \
    --output text)

echo -e "${GREEN}✅ Secrets: $SECRET_ARN${NC}"

echo ""
echo -e "${YELLOW}🐳 FASE 5: Configurando ECS...${NC}"

# ECR Repository
ECR_URI=$(aws ecr create-repository \
    --repository-name $PROJECT_NAME-backend \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --query 'repository.repositoryUri' \
    --output text 2>/dev/null || \
    aws ecr describe-repositories \
    --repository-names $PROJECT_NAME-backend \
    --query 'repositories[0].repositoryUri' \
    --output text)

echo -e "${GREEN}✅ ECR: $ECR_URI${NC}"

# IAM Roles
echo "Creando IAM roles..."

# Trust policy
cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Task Execution Role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file:///tmp/trust-policy.json 2>/dev/null || true

aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

# Secrets policy
cat > /tmp/secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "$SECRET_ARN"
  }]
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
    --assume-role-policy-document file:///tmp/trust-policy.json 2>/dev/null || true

echo -e "${GREEN}✅ IAM Roles configurados${NC}"

echo ""
echo -e "${YELLOW}⚖️  FASE 6: Creando Load Balancer...${NC}"

# Security Groups
ALB_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-alb-sg \
    --description "ALB Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

ECS_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-ecs-sg \
    --description "ECS Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3000 --source-group $ALB_SG

# Permitir ECS → RDS y Redis
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $ECS_SG
aws ec2 authorize-security-group-ingress --group-id $REDIS_SG --protocol tcp --port 6379 --source-group $ECS_SG

# Crear ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $PROJECT_NAME-alb \
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

# Target Group
TG_ARN=$(aws elbv2 create-target-group \
    --name $PROJECT_NAME-backend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN > /dev/null

echo -e "${GREEN}✅ ALB: $ALB_DNS${NC}"

echo ""
echo -e "${YELLOW}🎯 FASE 7: Creando ECS Cluster...${NC}"

aws ecs create-cluster \
    --cluster-name $PROJECT_NAME-cluster \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 > /dev/null

echo -e "${GREEN}✅ ECS Cluster: $PROJECT_NAME-cluster${NC}"

echo ""
echo -e "${YELLOW}💰 FASE 8: Creando S3 para frontend...${NC}"

# Crear S3 bucket con timestamp para único
TIMESTAMP=$(date +%Y%m%d%H%M%S)
S3_BUCKET="$PROJECT_NAME-frontend-prod-$TIMESTAMP"

aws s3 mb s3://$S3_BUCKET --region $AWS_REGION

# Configurar para website
aws s3 website s3://$S3_BUCKET \
    --index-document index.html \
    --error-document index.html

echo -e "${GREEN}✅ S3 Bucket: $S3_BUCKET${NC}"

echo ""
echo -e "${GREEN}=================================================="
echo "   ✅ CONFIGURACIÓN AWS COMPLETADA"
echo "==================================================${NC}"
echo ""

# Guardar configuración
cat > .aws-deployment-config << EOF
# AWS Deployment Configuration
# Generado: $(date)

export AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
export AWS_REGION="$AWS_REGION"

# Network
export VPC_ID="$VPC_ID"
export SUBNET_PUBLIC_1="$SUBNET_PUBLIC_1"
export SUBNET_PUBLIC_2="$SUBNET_PUBLIC_2"
export SUBNET_PRIVATE_1="$SUBNET_PRIVATE_1"
export SUBNET_PRIVATE_2="$SUBNET_PRIVATE_2"

# Security Groups
export ALB_SG="$ALB_SG"
export ECS_SG="$ECS_SG"
export RDS_SG="$RDS_SG"
export REDIS_SG="$REDIS_SG"

# Services
export DB_HOST="$DB_HOST"
export DB_PASSWORD="$DB_PASSWORD"
export REDIS_HOST="$REDIS_HOST"
export JWT_SECRET="$JWT_SECRET"
export SECRET_ARN="$SECRET_ARN"

# ECS/ECR
export ECR_URI="$ECR_URI"
export ECS_CLUSTER="$PROJECT_NAME-cluster"
export ECS_SERVICE="$PROJECT_NAME-backend"

# Load Balancer
export ALB_ARN="$ALB_ARN"
export ALB_DNS="$ALB_DNS"
export TG_ARN="$TG_ARN"

# Frontend
export S3_BUCKET="$S3_BUCKET"
EOF

echo -e "${BLUE}📋 INFORMACIÓN IMPORTANTE:${NC}"
echo ""
echo -e "${YELLOW}🔗 URLs generadas:${NC}"
echo "   API Backend: http://$ALB_DNS"
echo "   S3 Bucket: $S3_BUCKET"
echo ""
echo -e "${YELLOW}🔐 Credenciales:${NC}"
echo "   DB Password: $DB_PASSWORD"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo -e "${YELLOW}📝 Configuración guardada en: .aws-deployment-config${NC}"
echo ""
echo -e "${BLUE}🎯 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Agregar estos GitHub Secrets:"
echo "   VITE_API_URL: http://$ALB_DNS"
echo "   VITE_SOCKET_URL: http://$ALB_DNS"
echo ""
echo "2. Registrar Task Definition:"
echo "   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json"
echo ""
echo "3. Crear ECS Service:"
echo "   aws ecs create-service \\"
echo "     --cluster $PROJECT_NAME-cluster \\"
echo "     --service-name $PROJECT_NAME-backend \\"
echo "     --task-definition $PROJECT_NAME-backend:1 \\"
echo "     --desired-count 2 \\"
echo "     --launch-type FARGATE \\"
echo "     --network-configuration \"awsvpcConfiguration={subnets=[$SUBNET_PRIVATE_1,$SUBNET_PRIVATE_2],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}\" \\"
echo "     --load-balancers \"targetGroupArn=$TG_ARN,containerName=field-service-backend,containerPort=3000\""
echo ""
echo "4. Activar pipeline:"
echo "   git push origin main"
echo ""

# Cleanup
rm -f /tmp/trust-policy.json /tmp/secrets-policy.json

echo -e "${GREEN}🎉 ¡SETUP COMPLETADO EXITOSAMENTE!${NC}"