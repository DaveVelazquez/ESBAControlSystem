#!/bin/bash

# Script AWS Setup - Solo ECS/S3/ALB (Sin Bases de Datos)
# Usa Supabase (PostgreSQL) y Upstash (Redis) gratuitos
# Account ID: 507297234735

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================================="
echo "   🚀 FIELD SERVICE - AWS SETUP (BASES GRATUITAS)"
echo "   Account ID: 507297234735"
echo "   PostgreSQL: Supabase (Gratuito)"
echo "   Redis: Upstash (Gratuito)"
echo "========================================================="
echo -e "${NC}"

# Variables
AWS_ACCOUNT_ID="507297234735"
AWS_REGION="us-east-1"
PROJECT_NAME="field-service"

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no instalado${NC}"
    exit 1
fi

# Verificar credenciales
echo -e "${YELLOW}🔍 Verificando credenciales AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no configurado${NC}"
    echo "Ejecutar: aws configure"
    exit 1
fi

CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Account ID incorrecto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Credenciales verificadas${NC}"

echo ""
echo -e "${YELLOW}🏗️  FASE 1: Creando VPC y red...${NC}"

# Crear VPC
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-vpc}]" \
    --query 'Vpc.VpcId' \
    --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

# Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-igw}]" \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Subnets públicas (solo necesitamos públicas para ECS Fargate)
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

aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_1 --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC_2 --map-public-ip-on-launch

# Route Table
RT_PUBLIC=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$PROJECT_NAME-public-rt}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

aws ec2 create-route --route-table-id $RT_PUBLIC --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_1
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_2

echo -e "${GREEN}✅ VPC y red configuradas${NC}"

echo ""
echo -e "${YELLOW}🐳 FASE 2: Configurando ECS...${NC}"

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

# IAM Roles para ECS
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

# Task Role
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file:///tmp/trust-policy.json 2>/dev/null || true

echo -e "${GREEN}✅ IAM Roles configurados${NC}"

echo ""
echo -e "${YELLOW}⚖️  FASE 3: Creando Load Balancer...${NC}"

# Security Group para ALB
ALB_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-alb-sg \
    --description "ALB Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

# Security Group para ECS
ECS_SG=$(aws ec2 create-security-group \
    --group-name $PROJECT_NAME-ecs-sg \
    --description "ECS Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3000 --source-group $ALB_SG
# Permitir acceso a Internet para bases externas (Supabase/Upstash)
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 5432 --cidr 0.0.0.0/0

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
echo -e "${YELLOW}🎯 FASE 4: Creando ECS Cluster...${NC}"

aws ecs create-cluster \
    --cluster-name $PROJECT_NAME-cluster \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 > /dev/null

echo -e "${GREEN}✅ ECS Cluster: $PROJECT_NAME-cluster${NC}"

echo ""
echo -e "${YELLOW}💰 FASE 5: Creando S3 para frontend...${NC}"

# S3 bucket único
TIMESTAMP=$(date +%Y%m%d%H%M%S)
S3_BUCKET="$PROJECT_NAME-frontend-prod-$TIMESTAMP"

aws s3 mb s3://$S3_BUCKET --region $AWS_REGION

# Configurar para website
aws s3 website s3://$S3_BUCKET \
    --index-document index.html \
    --error-document index.html

echo -e "${GREEN}✅ S3 Bucket: $S3_BUCKET${NC}"

echo ""
echo -e "${GREEN}======================================================="
echo "   ✅ AWS SETUP COMPLETADO (BASES GRATUITAS)"
echo "=======================================================${NC}"

# Guardar configuración
cat > .aws-deployment-config << EOF
# AWS Deployment Configuration (Bases Gratuitas)
# Generado: $(date)

export AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
export AWS_REGION="$AWS_REGION"

# Network
export VPC_ID="$VPC_ID"
export SUBNET_PUBLIC_1="$SUBNET_PUBLIC_1"
export SUBNET_PUBLIC_2="$SUBNET_PUBLIC_2"

# Security Groups
export ALB_SG="$ALB_SG"
export ECS_SG="$ECS_SG"

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

# Bases de datos externas (configurar manualmente)
# DATABASE_URL=postgresql://postgres:[password]@[host]:5432/[database] (Supabase)
# REDIS_URL=redis://:[password]@[host]:[port] (Upstash)
EOF

echo ""
echo -e "${BLUE}📋 CONFIGURACIÓN COMPLETADA:${NC}"
echo ""
echo -e "${YELLOW}🔗 URLs generadas:${NC}"
echo "   API Backend: http://$ALB_DNS"
echo "   S3 Bucket: $S3_BUCKET"
echo ""
echo -e "${YELLOW}📝 Configuración guardada en: .aws-deployment-config${NC}"
echo ""
echo -e "${BLUE}🎯 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Configurar bases de datos gratuitas:"
echo "   📊 PostgreSQL: https://app.supabase.com/sign-up"
echo "   🔴 Redis: https://console.upstash.com/login"
echo ""
echo "2. Agregar GitHub Secrets:"
echo "   DATABASE_URL: [Supabase connection string]"
echo "   REDIS_URL: [Upstash connection string]"
echo "   VITE_API_URL: http://$ALB_DNS"
echo "   VITE_SOCKET_URL: http://$ALB_DNS"
echo ""
echo "3. Registrar Task Definition:"
echo "   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition-gratuito.json"
echo ""
echo "4. Crear ECS Service:"
echo "   aws ecs create-service \\"
echo "     --cluster $PROJECT_NAME-cluster \\"
echo "     --service-name $PROJECT_NAME-backend \\"
echo "     --task-definition $PROJECT_NAME-backend:1 \\"
echo "     --desired-count 1 \\"
echo "     --launch-type FARGATE \\"
echo "     --network-configuration \"awsvpcConfiguration={subnets=[$SUBNET_PUBLIC_1,$SUBNET_PUBLIC_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}\" \\"
echo "     --load-balancers \"targetGroupArn=$TG_ARN,containerName=field-service-backend,containerPort=3000\""
echo ""
echo "5. Activar pipeline:"
echo "   git push origin main"
echo ""
echo -e "${GREEN}💰 AHORRO MENSUAL: ~\$45 USD (sin RDS/ElastiCache)${NC}"
echo -e "${GREEN}📊 Costo estimado: ~\$35-40 USD/mes${NC}"

# Cleanup
rm -f /tmp/trust-policy.json

echo ""
echo -e "${GREEN}🎉 ¡SETUP GRATUITO COMPLETADO!${NC}"