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
