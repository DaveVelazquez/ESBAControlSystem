#!/bin/bash
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git
mkdir -p /opt/backend
cd /opt/backend
cat > package.json << 'EOF'
{
  "name": "simple-backend",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Healthy!' }));
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@fieldservice.com' && password === 'admin123') {
    res.json({ success: true, token: 'jwt-' + Date.now(), user: { email, name: 'Admin' } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});
app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
EOF
npm install
cat > /etc/systemd/system/backend.service << 'EOF'
[Unit]
Description=Backend
[Service]
WorkingDirectory=/opt/backend
ExecStart=/usr/bin/node server.js
Restart=always
User=ec2-user
[Install]
WantedBy=multi-user.target
EOF
chown -R ec2-user:ec2-user /opt/backend
systemctl daemon-reload
systemctl enable backend
systemctl start backend
