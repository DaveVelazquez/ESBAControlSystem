# ⚡ CONFIGURACIÓN AUTOMÁTICA COMPLETADA

He preparado todo lo que se puede automatizar. Aquí tienes las **configuraciones manuales** que necesitas hacer:

---

## 🔧 **CONFIGURACIONES MANUALES (15 minutos)**

### **1. CONFIGURAR AWS CLI** ⏱️ 2 minutos

```powershell
aws configure
```

**Valores a ingresar:**
```
AWS Access Key ID: AKIAXMHKFP4XXEPAI2U2
AWS Secret Access Key: [Ver instrucciones abajo]
Default region name: us-east-1
Default output format: json
```

### **2. OBTENER AWS SECRET ACCESS KEY** ⏱️ 3 minutos

1. **Ir a:** https://507297234735.signin.aws.amazon.com/console
2. **Buscar:** "IAM" → IAM
3. **Navegar:** Users → github-ci → Security credentials
4. **Crear:** Create access key → CLI → Next → Create access key
5. **Copiar:** Secret access key (úsalo en paso 1)

### **3. OBTENER MAPBOX TOKEN** ⏱️ 2 minutos

1. **Registro:** https://account.mapbox.com/auth/signup/
2. **Token:** https://account.mapbox.com/access-tokens/
3. **Copiar:** Default public token (pk.eyJ...)

### **4. CONFIGURAR GITHUB SECRETS** ⏱️ 5 minutos

**Ir a:** https://github.com/DaveVelazquez/ESBAControlSystem/settings/secrets/actions

**Agregar estos 3 secrets:**

| Nombre | Valor |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | `AKIAXMHKFP4XXEPAI2U2` |
| `AWS_SECRET_ACCESS_KEY` | `[Del paso 2]` |
| `VITE_MAPBOX_TOKEN` | `[Del paso 3]` |

### **5. EJECUTAR SCRIPT AUTOMÁTICO** ⏱️ 30 minutos

**Opción A: Git Bash (recomendado)**
```bash
cd "C:\dev\Dev2\Sistema de Control"
bash aws/setup-aws-completo.sh
```

**Opción B: WSL**
```bash
wsl
cd /mnt/c/dev/Dev2/Sistema\ de\ Control
bash aws/setup-aws-completo.sh
```

### **6. CONFIGURAR URLs DESPUÉS DEL SCRIPT** ⏱️ 2 minutos

El script te dará una URL como:
```
API Backend: http://field-service-alb-123456789.us-east-1.elb.amazonaws.com
```

**Agregar en GitHub Secrets:**

| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `[URL del ALB generada]` |
| `VITE_SOCKET_URL` | `[Misma URL del ALB]` |

### **7. ACTIVAR PIPELINE** ⏱️ 1 minuto

```bash
git push origin main
```

**Verificar en:** https://github.com/DaveVelazquez/ESBAControlSystem/actions

---

## 📋 **ARCHIVOS PREPARADOS**

✅ **aws/setup-aws-completo.sh** - Script automático completo  
✅ **PASOS_MANUALES_DEPLOYMENT.md** - Guía detallada  
✅ **GITHUB_SECRETS_CONFIG.md** - Configuración de secrets  
✅ Pipeline GitHub Actions actualizado con tu Account ID  
✅ Task definitions con ARNs correctos  

---

## 🎯 **ORDEN RECOMENDADO**

1. **AWS CLI** (paso 1-2) ← Primero
2. **Mapbox** (paso 3) ← Mientras esperas
3. **GitHub Secrets** (paso 4) ← Básicos
4. **Script automático** (paso 5) ← El que toma más tiempo
5. **URLs finales** (paso 6) ← Después del script
6. **Activar** (paso 7) ← Final

---

## 🆘 **SI HAY PROBLEMAS**

**Script no ejecuta:**
- Verificar Git Bash instalado
- O usar WSL si está disponible

**Errores de permisos AWS:**
- Usuario github-ci necesita más políticas
- Agregar `PowerUserAccess` temporalmente

**Docker errors:**
- Verificar Docker Desktop corriendo
- Pipeline de GitHub Actions maneja esto automáticamente

---

## ⏰ **TIEMPO TOTAL ESTIMADO**

- Configuraciones manuales: ~15 minutos
- Script automático: ~30 minutos  
- **Total: ~45 minutos**

---

**¿Listo para empezar?** Comienza con el **paso 1** (AWS CLI) 🚀