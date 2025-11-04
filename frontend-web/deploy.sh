#!/bin/bash

# Field Service Frontend Deployment Script for AWS S3 + CloudFront
# Este script construye y despliega el frontend en S3 con invalidación de CloudFront

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (configurar según tu entorno)
S3_BUCKET=${S3_BUCKET:-"field-service-frontend-prod"}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-""}
AWS_REGION=${AWS_REGION:-"us-east-1"}

echo -e "${GREEN}🚀 Field Service Frontend Deployment${NC}"
echo "=========================================="

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Paso 1: Instalar dependencias${NC}"
npm ci

echo ""
echo -e "${YELLOW}🔨 Paso 2: Build production${NC}"
npm run build

echo ""
echo -e "${YELLOW}⬆️  Paso 3: Sync a S3${NC}"

# Sync archivos con cache largo (excepto index.html)
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --delete \
    --cache-control "max-age=31536000, public, immutable" \
    --exclude "index.html" \
    --exclude "manifest.webmanifest" \
    --exclude "sw.js" \
    --exclude "*.map"

# index.html y archivos críticos sin cache
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
    --region $AWS_REGION \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "text/html"

if [ -f "dist/manifest.webmanifest" ]; then
    aws s3 cp dist/manifest.webmanifest s3://$S3_BUCKET/manifest.webmanifest \
        --region $AWS_REGION \
        --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
        --content-type "application/manifest+json"
fi

if [ -f "dist/sw.js" ]; then
    aws s3 cp dist/sw.js s3://$S3_BUCKET/sw.js \
        --region $AWS_REGION \
        --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
        --content-type "application/javascript"
fi

echo ""
echo -e "${GREEN}✅ Upload a S3 completado${NC}"

# Invalidar CloudFront si existe distribution ID
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo ""
    echo -e "${YELLOW}🔄 Paso 4: Invalidar cache de CloudFront${NC}"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo -e "${GREEN}✅ Invalidación creada: $INVALIDATION_ID${NC}"
    
    echo ""
    echo -e "${YELLOW}⏳ Esperando invalidación...${NC}"
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --id $INVALIDATION_ID
    
    echo -e "${GREEN}✅ Invalidación completada${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  CLOUDFRONT_DISTRIBUTION_ID no configurado, saltando invalidación${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment completado exitosamente!${NC}"
echo ""
echo "🌐 URLs:"
echo "   S3: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "   CloudFront: https://tu-dominio.com"
fi
echo ""
