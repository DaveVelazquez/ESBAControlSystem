# 🔐 Configuración de GitHub Secrets

## Secrets Requeridos para CI/CD Pipeline

Ve a tu repositorio en GitHub: **https://github.com/DaveVelazquez/ESBAControlSystem**

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**

---

## 🔑 Secrets de AWS (OBLIGATORIOS)

### 1. AWS_ACCESS_KEY_ID
**Valor:** `AKIAXMHKFP4XXEPAI2U2`
**Descripción:** Access Key del usuario github-ci

### 2. AWS_SECRET_ACCESS_KEY
**Valor:** `[Tu Secret Access Key]`
**Descripción:** Secret Access Key correspondiente al Access Key ID
**⚠️ IMPORTANTE:** Necesitas obtener este valor desde la consola AWS

---

## 🌐 Secrets del Frontend (OBLIGATORIOS)

### 3. VITE_API_URL
**Valor:** `https://api.tudominio.com` o `http://tu-alb-aws.amazonaws.com`
**Descripción:** URL de tu API backend en AWS
**Ejemplo:** `http://field-service-alb-123456789.us-east-1.elb.amazonaws.com`

### 4. VITE_SOCKET_URL
**Valor:** `https://api.tudominio.com` o `http://tu-alb-aws.amazonaws.com`
**Descripción:** URL para WebSockets (normalmente igual que VITE_API_URL)

### 5. VITE_MAPBOX_TOKEN
**Valor:** `pk.eyJ1...` (tu token de Mapbox)
**Descripción:** Token público de Mapbox para los mapas
**Obtener en:** https://account.mapbox.com/access-tokens/

---

## ☁️ Secrets de CloudFront (OPCIONAL)

### 6. CLOUDFRONT_DISTRIBUTION_ID
**Valor:** `E1234567890ABC` (ID de tu distribución CloudFront)
**Descripción:** Para invalidar cache automáticamente
**⚠️ Solo si tienes CloudFront configurado**

---

## 🏗️ Cómo Obtener los Valores Faltantes

### Para AWS_SECRET_ACCESS_KEY:
1. Ve a: https://507297234735.signin.aws.amazon.com/console
2. Usuario: `github-ci`
3. **IAM** → **Users** → **github-ci**
4. **Security credentials** → **Access keys**
5. Si no existe, crear nueva con **Create access key**
6. Copiar el **Secret access key**

### Para VITE_API_URL:
- Será generado cuando deploys el backend en ECS
- Formato: `http://field-service-alb-XXXXXXX.us-east-1.elb.amazonaws.com`

### Para VITE_MAPBOX_TOKEN:
1. Ir a: https://account.mapbox.com/auth/signup/
2. Crear cuenta gratuita
3. **Access tokens** → Copiar **Default public token**

---

## 📋 Lista de Verificación

**AWS Credentials:**
- [ ] AWS_ACCESS_KEY_ID: `AKIAXMHKFP4XXEPAI2U2`
- [ ] AWS_SECRET_ACCESS_KEY: `[Obtener desde consola AWS]`

**Frontend URLs:**
- [ ] VITE_API_URL: `[URL del ALB cuando esté deployado]`
- [ ] VITE_SOCKET_URL: `[Misma URL que VITE_API_URL]`
- [ ] VITE_MAPBOX_TOKEN: `[Token desde Mapbox.com]`

**CloudFront (Opcional):**
- [ ] CLOUDFRONT_DISTRIBUTION_ID: `[Solo si usas CloudFront]`

---

## 🚀 Después de Configurar Secrets

Una vez que tengas todos los secrets configurados:

```bash
# Hacer commit de los cambios
git add .
git commit -m "CI/CD: Configuración pipeline AWS con Account ID específico"
git push origin main
```

Esto activará automáticamente el pipeline de GitHub Actions.

---

## 🔍 Verificar Pipeline

1. Ve a: **https://github.com/DaveVelazquez/ESBAControlSystem/actions**
2. Deberías ver el workflow **"Deploy to AWS"** ejecutándose
3. Revisa los logs para cualquier error

---

## ⚠️ Notas Importantes

- **AWS_SECRET_ACCESS_KEY** es el único valor que necesitas obtener manualmente
- **VITE_API_URL** se configurará después del primer deploy del backend
- **CLOUDFRONT_DISTRIBUTION_ID** es opcional para empezar
- Todos los secrets son **case-sensitive**
- Nunca compartas estos valores públicamente

---

## 🆘 Si Hay Errores

**Error común:** `SignatureDoesNotMatch`
- ✅ Verificar que AWS_SECRET_ACCESS_KEY sea correcto
- ✅ Asegurar que no hay espacios extra en los secrets

**Error:** `AccessDenied`
- ✅ Verificar que el usuario `github-ci` tenga los permisos necesarios
- ✅ Puede necesitar políticas adicionales para ECS, ECR, S3

**¿Necesitas el Secret Access Key?** 
Dime si necesitas ayuda para obtenerlo desde la consola AWS.