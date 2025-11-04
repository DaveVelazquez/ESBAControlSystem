# 🔧 Solución a Problema de Permisos

## ❌ Error Encontrado

```
Error: EPERM: operation not permitted, lstat 'C:\Users\lng-clientadmin\AppData'
```

Este error indica que Node.js no tiene permisos para acceder a la carpeta `AppData` del usuario.

---

## ✅ Soluciones Propuestas

### Opción 1: Reinstalar Node.js con Permisos de Administrador

1. **Desinstalar Node.js actual:**
   - Panel de Control → Programas → Desinstalar Node.js

2. **Descargar Node.js LTS más reciente:**
   - https://nodejs.org/
   - Descargar versión 20.x LTS (Long Term Support)

3. **Instalar como Administrador:**
   - Click derecho en el instalador → "Ejecutar como administrador"
   - Instalar en la ruta por defecto: `C:\Program Files\nodejs`
   - ✅ Marcar "Automatically install necessary tools"

4. **Verificar instalación:**
   ```powershell
   node --version
   npm --version
   ```

---

### Opción 2: Reparar Permisos de AppData (MÁS RÁPIDA)

1. **Abrir PowerShell como Administrador:**
   - Click derecho en PowerShell → "Ejecutar como administrador"

2. **Ejecutar comandos de reparación:**
   ```powershell
   # Dar permisos completos a tu usuario en AppData
   $userProfile = $env:USERPROFILE
   $appData = "$userProfile\AppData"
   
   icacls $appData /grant "${env:USERNAME}:(OI)(CI)F" /T
   
   # Verificar
   icacls $appData
   ```

3. **Reiniciar PowerShell normal y probar:**
   ```powershell
   cd "C:\dev\Dev2\Sistema de Control\frontend-web"
   npm --version
   npm install
   ```

---

### Opción 3: Usar Variables de Entorno Alternativas

1. **Crear directorio temporal para npm:**
   ```powershell
   mkdir "C:\dev\npm-cache" -Force
   mkdir "C:\dev\npm-prefix" -Force
   ```

2. **Configurar npm para usar esos directorios:**
   ```powershell
   npm config set cache "C:\dev\npm-cache" --global
   npm config set prefix "C:\dev\npm-prefix" --global
   ```

3. **Intentar instalar de nuevo:**
   ```powershell
   cd "C:\dev\Dev2\Sistema de Control\frontend-web"
   npm install
   ```

---

### Opción 4: Usar Docker Desktop (RECOMENDADA PARA PRODUCCIÓN)

1. **Instalar Docker Desktop:**
   - https://www.docker.com/products/docker-desktop
   - Requiere Windows 10/11 Pro o Enterprise
   - Requiere reinicio

2. **Iniciar Docker Desktop**

3. **Ejecutar la aplicación completa:**
   ```powershell
   cd "C:\dev\Dev2\Sistema de Control"
   docker compose up --build
   ```

4. **Acceder:**
   - Frontend: http://localhost:80
   - Backend: http://localhost:3000
   - Base de datos admin: http://localhost:8080

**Ventajas de Docker:**
- ✅ No requiere instalar Node.js, PostgreSQL, Redis localmente
- ✅ Ambiente aislado sin conflictos de permisos
- ✅ Mismo ambiente en desarrollo y producción
- ✅ Un solo comando para levantar todo

---

### Opción 5: Usar nvm-windows (Para Desarrolladores)

1. **Desinstalar Node.js actual**

2. **Instalar nvm-windows:**
   - https://github.com/coreybutler/nvm-windows/releases
   - Descargar `nvm-setup.exe`
   - Instalar como administrador

3. **Instalar Node.js con nvm:**
   ```powershell
   nvm install 20.11.0
   nvm use 20.11.0
   ```

4. **Verificar:**
   ```powershell
   node --version
   npm install
   ```

---

## 🚀 Solución Temporal: Backend Mock

Si necesitas ver la UI inmediatamente mientras solucionas los permisos, puedes:

1. **Crear un backend mock simple:**
   - Abre `frontend-web/vite.config.ts`
   - Comenta el proxy al backend
   - El frontend funcionará con datos mock en el código

2. **Modificar servicios para usar datos mock:**
   ```typescript
   // En src/services/auth.service.ts
   export const login = async (credentials: LoginCredentials) => {
     // return apiClient.post('/auth/login', credentials);
     
     // Mock data
     return {
       data: {
         token: 'mock-jwt-token',
         user: {
           id: '1',
           email: credentials.email,
           name: 'Usuario Demo',
           role: 'admin'
         }
       }
     };
   };
   ```

---

## 📞 Recomendación Inmediata

**Para desarrollo rápido:**
→ Usar **Opción 2** (Reparar permisos AppData) - 5 minutos

**Para producción y trabajo serio:**
→ Usar **Opción 4** (Docker Desktop) - 30 minutos primera vez

**Si nada funciona:**
→ Usar **Opción 5** (nvm-windows) - 15 minutos

---

## ❓ ¿Qué opción prefieres?

1. ⚡ **Rápida**: Reparar permisos (5 min)
2. 🐳 **Recomendada**: Instalar Docker (30 min)
3. 🔧 **Alternativa**: Reinstalar Node.js (15 min)
4. 💡 **Temporal**: Datos mock sin backend (2 min)

---

**Siguiente paso:** Elige una opción y te guío paso a paso.
