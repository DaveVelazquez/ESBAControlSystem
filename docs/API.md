# API Documentation - Field Service System

Base URL: `http://localhost:3000/api`

## 🔐 Authentication

Todas las rutas (excepto `/auth`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

---

## 📝 Auth Endpoints

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "Test1234"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

**Response 401:**
```json
{
  "status": "fail",
  "message": "Invalid credentials"
}
```

### Register

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "password": "SecurePass123",
  "name": "New User",
  "role": "technician"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "newuser@company.com",
      "name": "New User",
      "role": "technician"
    }
  }
}
```

---

## 📋 Orders Endpoints

### List Orders

```http
GET /api/orders?status=assigned&technician_id=uuid&limit=50&offset=0
```

**Query Parameters:**
- `status` (optional): pending, assigned, in_progress, completed, cancelled
- `technician_id` (optional): Filter by technician UUID
- `date_from` (optional): ISO 8601 date
- `date_to` (optional): ISO 8601 date
- `limit` (default: 50): Max results
- `offset` (default: 0): Pagination offset

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-000001",
      "client_name": "TechCorp S.A.",
      "site_address": "Av. Reforma 123, CDMX",
      "site_lat": 19.4326,
      "site_lng": -99.1332,
      "technician_name": "Juan Técnico",
      "service_type_name": "Installation",
      "status": "assigned",
      "priority": "high",
      "scheduled_start": "2025-10-30T10:00:00Z",
      "scheduled_end": "2025-10-30T12:00:00Z",
      "sla_deadline": "2025-10-30T14:00:00Z",
      "created_at": "2025-10-29T08:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Get Order Details

```http
GET /api/orders/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-000001",
    "client_name": "TechCorp S.A.",
    "client_phone": "+52-555-2001",
    "site_address": "Av. Reforma 123, CDMX",
    "site_lat": 19.4326,
    "site_lng": -99.1332,
    "technician_name": "Juan Técnico",
    "service_type_name": "Installation",
    "sla_hours": 4,
    "status": "in_progress",
    "notes": "Client notes here",
    "events": [
      {
        "id": "uuid",
        "event_type": "check_in",
        "latitude": 19.4325,
        "longitude": -99.1331,
        "created_at": "2025-10-30T10:05:00Z"
      }
    ],
    "evidences": [
      {
        "id": "uuid",
        "evidence_type": "photo",
        "file_url": "https://s3.../photo.jpg",
        "thumbnail_url": "https://s3.../thumb.jpg",
        "created_at": "2025-10-30T11:00:00Z"
      }
    ]
  }
}
```

### Create Order

```http
POST /api/orders
```

**Authorization:** dispatcher, admin

**Request Body:**
```json
{
  "client_id": "uuid",
  "site_id": "uuid",
  "service_type_id": "uuid",
  "scheduled_start": "2025-10-30T10:00:00Z",
  "scheduled_end": "2025-10-30T12:00:00Z",
  "priority": "high",
  "notes": "Special instructions here"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-123456",
    "status": "pending",
    "sla_deadline": "2025-10-30T14:00:00Z",
    "created_at": "2025-10-29T20:00:00Z"
  }
}
```

---

## 👷 Technicians Endpoints

### List Technicians

```http
GET /api/technicians?available=true&zone_id=uuid
```

**Query Parameters:**
- `available` (optional): Filter by availability
- `zone_id` (optional): Filter by zone

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Juan Técnico",
      "email": "tech1@company.com",
      "phone": "+52-555-1001",
      "active": true,
      "skills": {
        "electrical": true,
        "plumbing": false,
        "hvac": true
      },
      "availability_status": "available",
      "current_location": {
        "latitude": 19.4326,
        "longitude": -99.1332,
        "updated_at": "2025-10-30T09:45:00Z"
      },
      "active_orders": 2
    }
  ]
}
```

### Get Technician Orders

```http
GET /api/technicians/:id/orders?status=in_progress
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-000001",
      "client_name": "TechCorp S.A.",
      "site_address": "Av. Reforma 123",
      "status": "in_progress",
      "scheduled_start": "2025-10-30T10:00:00Z"
    }
  ]
}
```

---

## 📍 Location Endpoints

### Send Location Ping

```http
POST /api/locations/ping
```

**Request Body:**
```json
{
  "latitude": 19.4326,
  "longitude": -99.1332,
  "accuracy": 10,
  "order_id": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "technician_id": "uuid",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "created_at": "2025-10-30T10:00:00Z"
  }
}
```

### Get All Technician Locations

```http
GET /api/locations/technicians
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "technician_id": "uuid",
      "technician_name": "Juan Técnico",
      "latitude": 19.4326,
      "longitude": -99.1332,
      "accuracy_meters": 10,
      "order_number": "ORD-000001",
      "created_at": "2025-10-30T10:00:00Z"
    }
  ]
}
```

---

## ✅ Check-in/out Endpoints

### Check In

```http
POST /api/orders/:orderId/checkin
```

**Request Body:**
```json
{
  "latitude": 19.4326,
  "longitude": -99.1332,
  "accuracy": 10,
  "timestamp": "2025-10-30T10:05:00Z",
  "notes": "Arrived at site"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_type": "check_in",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "created_at": "2025-10-30T10:05:00Z"
  }
}
```

**Error Responses:**
- **400**: Too far from site
- **400**: Already checked in
- **404**: Order not found

### Check Out

```http
POST /api/orders/:orderId/checkout
```

**Request Body:**
```json
{
  "latitude": 19.4326,
  "longitude": -99.1332,
  "accuracy": 10,
  "timestamp": "2025-10-30T12:00:00Z",
  "notes": "Work completed"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_type": "check_out",
    "time_on_site_minutes": 115,
    "created_at": "2025-10-30T12:00:00Z"
  }
}
```

---

## 📸 Evidence Endpoints

### Upload Photo

```http
POST /api/orders/:orderId/evidences/photo
Content-Type: multipart/form-data
```

**Form Data:**
- `photo`: File (JPEG, PNG, WebP, max 10MB)
- `notes`: String (optional)
- `category`: String (before, during, after, damage, general)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "evidence_type": "photo",
    "file_url": "https://s3.amazonaws.com/.../photo.jpg",
    "thumbnail_url": "https://s3.amazonaws.com/.../thumb.jpg",
    "file_size": 245678,
    "created_at": "2025-10-30T11:00:00Z"
  }
}
```

### Save Signature

```http
POST /api/orders/:orderId/evidences/signature
```

**Request Body:**
```json
{
  "signatureData": "<svg>...</svg>",
  "signerName": "Roberto Gómez",
  "signerTitle": "Site Manager",
  "notes": "Client signature for completion"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "evidence_type": "signature",
    "file_url": "https://s3.amazonaws.com/.../signature.png",
    "signature_data": "<svg>...</svg>",
    "created_at": "2025-10-30T12:05:00Z"
  }
}
```

### Get Order Evidences

```http
GET /api/orders/:orderId/evidences
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "evidence_type": "photo",
      "file_url": "https://...",
      "thumbnail_url": "https://...",
      "notes": "Before work",
      "created_at": "2025-10-30T10:30:00Z"
    },
    {
      "id": "uuid",
      "evidence_type": "signature",
      "file_url": "https://...",
      "signature_data": "<svg>...</svg>",
      "created_at": "2025-10-30T12:05:00Z"
    }
  ]
}
```

---

## 📊 Reports Endpoints

### Generate Order PDF

```http
GET /api/reports/orders/:orderId/pdf
```

**Authorization:** dispatcher, admin

**Response:** PDF file download

### Get SLA Metrics

```http
GET /api/reports/sla-metrics?date_from=2025-10-01&date_to=2025-10-31
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_orders": 150,
    "completed_on_time": 135,
    "overdue": 10,
    "cancelled": 5,
    "sla_compliance_rate": 90.0,
    "average_completion_time_hours": 3.5
  }
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Something went wrong"
}
```

---

## 🔄 WebSocket Events

Connect to: `ws://localhost:3000`

### Client Events

**join-order**
```javascript
socket.emit('join-order', orderId);
```

**join-dispatcher**
```javascript
socket.emit('join-dispatcher', dispatcherId);
```

**location-update**
```javascript
socket.emit('location-update', {
  technicianId: 'uuid',
  latitude: 19.4326,
  longitude: -99.1332,
  timestamp: new Date().toISOString()
});
```

### Server Events

**technician-location**
```javascript
socket.on('technician-location', (data) => {
  console.log(data);
  // { technicianId, latitude, longitude, timestamp }
});
```

**order-updated**
```javascript
socket.on('order-updated', (data) => {
  console.log(data);
  // { orderId, status, ... }
});
```

**sla-alert**
```javascript
socket.on('sla-alert', (data) => {
  console.log(data);
  // { orderId, alertLevel: 'warning'|'critical' }
});
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Test1234"}'
```

### Get Orders
```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"uuid",
    "site_id":"uuid",
    "service_type_id":"uuid",
    "scheduled_start":"2025-10-30T10:00:00Z",
    "scheduled_end":"2025-10-30T12:00:00Z"
  }'
```

---

## 📝 Rate Limiting

- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes

Headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635600000
```
