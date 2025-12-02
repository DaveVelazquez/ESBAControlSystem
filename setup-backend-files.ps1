Write-Host "🚀 CREATING SIMPLE WORKING BACKEND" -ForegroundColor Green

# First, let me create a simple solution using GitHub Codespaces or similar
Write-Host "Creating backend files for external deployment..." -ForegroundColor Yellow

Set-Location "C:\dev\Dev2\Sistema de Control\backend"

# Create a simple package.json
@'
{
  "name": "field-service-backend",
  "version": "1.0.0",
  "description": "Simple backend for Field Service Manager",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
'@ | Out-File -FilePath "package.json" -Encoding UTF8

Write-Host "✅ package.json created" -ForegroundColor Green

# Verify server.js exists and is correct
if (Test-Path "server.js") {
    Write-Host "✅ server.js exists" -ForegroundColor Green
} else {
    Write-Host "Creating server.js..." -ForegroundColor Yellow
    
@'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ultra-permissive CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: false
}));

app.use(express.json({ limit: '50mb' }));

// Detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  const response = {
    status: 'OK',
    message: 'Backend is running perfectly!',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production'
  };
  console.log('[HEALTH] Responding with:', response);
  res.status(200).json(response);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Field Service Manager API - Simple Version',
    version: '1.0.0',
    endpoints: ['/health', '/api/auth/login'],
    timestamp: new Date().toISOString()
  });
});

// THE CRITICAL LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
  console.log('\n=== LOGIN ATTEMPT ===');
  console.log('Time:', new Date().toISOString());
  console.log('Body received:', req.body);
  
  const { email, password } = req.body;
  
  // Hardcoded login check
  if (email === 'admin@fieldservice.com' && password === 'admin123') {
    const successResponse = {
      success: true,
      message: 'Login successful!',
      token: 'simple-jwt-' + Date.now(),
      user: {
        id: 1,
        email: 'admin@fieldservice.com',
        name: 'System Administrator',
        role: 'admin'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ LOGIN SUCCESS - Responding with:', successResponse);
    return res.status(200).json(successResponse);
  } else {
    const errorResponse = {
      success: false,
      message: 'Invalid email or password',
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ LOGIN FAILED - Responding with:', errorResponse);
    return res.status(401).json(errorResponse);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Login: POST http://0.0.0.0:${PORT}/api/auth/login`);
  console.log('📧 Email: admin@fieldservice.com');
  console.log('🔑 Password: admin123\n');
});
'@ | Out-File -FilePath "server.js" -Encoding UTF8
    
    Write-Host "✅ server.js created" -ForegroundColor Green
}

# Create Dockerfile for deployment
@'
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
'@ | Out-File -FilePath "Dockerfile" -Encoding UTF8

Write-Host "✅ Dockerfile created" -ForegroundColor Green

# Create README with deployment instructions
@'
# Field Service Manager Backend

## Quick Deploy Options

### Option 1: Railway.app (Free)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Get URL: `railway domain`

### Option 2: Render.com (Free)
1. Connect GitHub repo to Render
2. Choose "Web Service"
3. Build command: `npm install`
4. Start command: `node server.js`

### Option 3: Vercel (Free)
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - Login endpoint

## Login Credentials
- Email: `admin@fieldservice.com`
- Password: `admin123`

## Test Login
```bash
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fieldservice.com","password":"admin123"}'
```

## Success Response
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "simple-jwt-1234567890",
  "user": {
    "id": 1,
    "email": "admin@fieldservice.com", 
    "name": "System Administrator",
    "role": "admin"
  }
}
```
'@ | Out-File -FilePath "README.md" -Encoding UTF8

Write-Host "✅ README.md created with deployment instructions" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 BACKEND FILES READY FOR DEPLOYMENT!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Files created:" -ForegroundColor Yellow
Write-Host "├── package.json" -ForegroundColor White
Write-Host "├── server.js" -ForegroundColor White  
Write-Host "├── Dockerfile" -ForegroundColor White
Write-Host "└── README.md" -ForegroundColor White
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Choose a deployment platform (Railway, Render, Vercel)" -ForegroundColor White
Write-Host "2. Follow the instructions in README.md" -ForegroundColor White
Write-Host "3. Deploy the backend" -ForegroundColor White
Write-Host "4. Get the backend URL" -ForegroundColor White
Write-Host "5. Update frontend .env.production with the URL" -ForegroundColor White
Write-Host "6. Redeploy frontend" -ForegroundColor White
Write-Host ""
Write-Host "💡 FASTEST OPTION: Use Render.com" -ForegroundColor Green
Write-Host "   - Just connect this GitHub repo to Render" -ForegroundColor White
Write-Host "   - Set build command: npm install" -ForegroundColor White  
Write-Host "   - Set start command: node server.js" -ForegroundColor White
Write-Host "   - Deploy automatically!" -ForegroundColor White