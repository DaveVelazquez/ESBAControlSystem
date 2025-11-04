#!/bin/bash

# Field Service Backend Deployment Script for AWS ECS
# Este script construye y despliega el backend en AWS ECS Fargate

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (configurar según tu entorno)
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-""}
ECR_REPOSITORY="field-service-backend"
ECS_CLUSTER="field-service-cluster"
ECS_SERVICE="field-service-backend"
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${GREEN}🚀 Field Service Backend Deployment${NC}"
echo "=========================================="

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Obtener AWS Account ID si no está definido
if [ -z "$AWS_ACCOUNT_ID" ]; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${YELLOW}📋 AWS Account ID: $AWS_ACCOUNT_ID${NC}"
fi

# ECR Registry URL
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
FULL_IMAGE_NAME="$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

echo ""
echo -e "${YELLOW}📦 Paso 1: Login a ECR${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo ""
echo -e "${YELLOW}🔨 Paso 2: Build Docker Image${NC}"
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

echo ""
echo -e "${YELLOW}🏷️  Paso 3: Tag Image${NC}"
docker tag $ECR_REPOSITORY:$IMAGE_TAG $FULL_IMAGE_NAME

echo ""
echo -e "${YELLOW}⬆️  Paso 4: Push a ECR${NC}"
docker push $FULL_IMAGE_NAME

echo ""
echo -e "${YELLOW}🔄 Paso 5: Update ECS Service${NC}"
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION

echo ""
echo -e "${YELLOW}⏳ Esperando deployment...${NC}"
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION

echo ""
echo -e "${GREEN}✅ Deployment completado exitosamente!${NC}"
echo ""
echo "📊 Ver logs:"
echo "   aws logs tail /ecs/field-service-backend --follow"
echo ""
echo "🔍 Ver tasks:"
echo "   aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $ECS_SERVICE"
echo ""
