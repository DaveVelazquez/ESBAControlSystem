# 🎯 INSTRUCCIONES PASO A PASO PARA DEPLOYMENT

## ✅ **YA CONFIGURADO AUTOMÁTICAMENTE**
- Pipeline GitHub Actions actualizado con tu Account ID
- Scripts de deployment configurados
- Task definitions con ARNs correctos
- Código subido a GitHub

---

## 🔧 **CONFIGURACIONES MANUALES REQUERIDAS**

### **PASO 1: CONFIGURAR AWS CLI LOCAL** ⏱️ 2 minutos

Ejecuta en PowerShell:
```powershell
aws configure
```

Cuando te pida, ingresa:
```
AWS Access Key ID: AKIAXMHKFP4XXEPAI2U2
AWS Secret Access Key: [Necesitas obtenerlo - ver PASO 2]
Default region name: us-east-1
Default output format: json
```

### **PASO 2: OBTENER AWS SECRET ACCESS KEY** ⏱️ 3 minutos

1. **Ir a AWS Console:**
   ```
   https://507297234735.signin.aws.amazon.com/console
   ```

2. **Navegar:**
   - Buscar "IAM" → IAM
   - Users → github-ci
   - Security credentials (tab)
   - Create access key
   - CLI → Next → Create access key
   - ⚠️ **COPIAR** el Secret access key

3. **Usar en PASO 1** cuando configure AWS CLI

### **PASO 3: OBTENER MAPBOX TOKEN** ⏱️ 2 minutos

1. **Crear cuenta:** https://account.mapbox.com/auth/signup/
2. **Obtener token:** https://account.mapbox.com/access-tokens/
3. **Copiar** el Default public token (pk.eyJ...)

### **PASO 4: CONFIGURAR GITHUB SECRETS** ⏱️ 5 minutos

Ir a: https://github.com/DaveVelazquez/ESBAControlSystem/settings/secrets/actions

**Agregar estos secrets:**

| Nombre | Valor |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | `AKIAXMHKFP4XXEPAI2U2` |
| `AWS_SECRET_ACCESS_KEY` | `[Del PASO 2]` |
| `VITE_MAPBOX_TOKEN` | `[Del PASO 3]` |

### **PASO 5: CREAR INFRAESTRUCTURA AWS** ⏱️ 30 minutos

Ejecutar script automático:
```bash
# En Git Bash o WSL (no PowerShell)
cd "C:\dev\Dev2\Sistema de Control"
bash aws/setup-aws.sh
```

**O manualmente seguir:** `PASOS_DEPLOYMENT_AWS.md`

### **PASO 6: CONFIGURAR URLs FRONTEND** ⏱️ 2 minutos

**Después del PASO 5**, obtener URL del ALB y agregar en GitHub Secrets:

| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `http://[ALB-DNS-GENERADO]` |
| `VITE_SOCKET_URL` | `http://[ALB-DNS-GENERADO]` |

### **PASO 7: ACTIVAR PIPELINE** ⏱️ 1 minuto

```bash
git push origin main
```

Verificar en: https://github.com/DaveVelazquez/ESBAControlSystem/actions

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

**Antes de empezar:**
- [ ] AWS Console accesible
- [ ] Git Bash o WSL instalado
- [ ] Docker Desktop funcionando

**Configuraciones:**
- [ ] AWS CLI configurado (PASO 1)
- [ ] Secret Access Key obtenido (PASO 2)  
- [ ] Mapbox token obtenido (PASO 3)
- [ ] 3 GitHub Secrets configurados (PASO 4)
- [ ] Infraestructura AWS creada (PASO 5)
- [ ] URLs frontend configuradas (PASO 6)
- [ ] Pipeline ejecutado (PASO 7)

---

## 🆘 **SI HAY PROBLEMAS**

### Error: "SignatureDoesNotMatch"
- Verificar AWS_SECRET_ACCESS_KEY correcto
- Sin espacios extras en secrets

### Error: Script setup-aws.sh no ejecuta
- Usar Git Bash: `"C:\Program Files\Git\bin\bash.exe" aws/setup-aws.sh`
- O WSL: `wsl bash aws/setup-aws.sh`

### Error: Docker login a ECR
- Verificar Docker Desktop corriendo
- AWS CLI bien configurado

---

## 🎯 **ORDEN DE EJECUCIÓN RECOMENDADO**

1. **PASO 2** (Secret Access Key) ← CRÍTICO
2. **PASO 1** (AWS CLI) 
3. **PASO 3** (Mapbox Token)
4. **PASO 4** (GitHub Secrets)
5. **PASO 5** (Infraestructura AWS) ← MÁS TIEMPO
6. **PASO 6** (URLs Frontend)
7. **PASO 7** (Activar Pipeline)

**Total estimado: ~45 minutos**