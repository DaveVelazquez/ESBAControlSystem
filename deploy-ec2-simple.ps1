# Deploy Simple EC2 Backend - Direct AWS CLI approach
Write-Host "🚀 DEPLOYING SIMPLE EC2 BACKEND..." -ForegroundColor Green

# Configuration
$AWS_REGION = "us-east-1"
$S3_BUCKET = "field-service-frontend-prod"
$TIMESTAMP = [int][double]::Parse((Get-Date -UFormat %s))

# Get default VPC and subnet
$VPC_ID = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION
$SUBNET_ID = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text --region $AWS_REGION

Write-Host "Using VPC: $VPC_ID" -ForegroundColor Yellow
Write-Host "Using Subnet: $SUBNET_ID" -ForegroundColor Yellow

# Create security group
$SG_NAME = "backend-sg-$TIMESTAMP"
$SG_ID = aws ec2 create-security-group --group-name $SG_NAME --description "Backend Security Group" --vpc-id $VPC_ID --region $AWS_REGION --query 'GroupId' --output text

# Add security rules
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION

Write-Host "Security Group created: $SG_ID" -ForegroundColor Green

# Create user data file
$USER_DATA_FILE = "user-data-$TIMESTAMP.sh"
@'
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
'@ | Out-File -FilePath $USER_DATA_FILE -Encoding ASCII

# Launch EC2 instance
Write-Host "🚀 Launching EC2 instance..." -ForegroundColor Yellow

$INSTANCE_ID = aws ec2 run-instances `
  --image-id ami-0c02fb55956c7d316 `
  --instance-type t2.micro `
  --security-group-ids $SG_ID `
  --subnet-id $SUBNET_ID `
  --user-data "file://$USER_DATA_FILE" `
  --associate-public-ip-address `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=backend-$TIMESTAMP}]" `
  --region $AWS_REGION `
  --query 'Instances[0].InstanceId' `
  --output text

Write-Host "✅ Instance launched: $INSTANCE_ID" -ForegroundColor Green

# Wait for instance
Write-Host "⏳ Waiting for instance..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION

# Get IP
$PUBLIC_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $AWS_REGION --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
Write-Host "✅ Public IP: $PUBLIC_IP" -ForegroundColor Green

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start (120 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

# Test connectivity
Write-Host "🔍 Testing backend..." -ForegroundColor Yellow
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://$PUBLIC_IP:3000/health" -TimeoutSec 10
        Write-Host "✅ Backend responding!" -ForegroundColor Green
        break
    } catch {
        Write-Host "Attempt $i failed, retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    }
}

# Update frontend
Write-Host "🌐 Updating frontend..." -ForegroundColor Yellow
Set-Location "frontend-web"

"VITE_API_URL=http://$PUBLIC_IP:3000" | Out-File -FilePath ".env.production" -Encoding UTF8

npm install --legacy-peer-deps
npm run build
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Clean up
Remove-Item $USER_DATA_FILE

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🖥️  Backend: http://$PUBLIC_IP:3000" -ForegroundColor White
Write-Host "🌐 Frontend: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com" -ForegroundColor White
Write-Host "🔐 Login: admin@fieldservice.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Test login API:"
Write-Host "curl -X POST http://$PUBLIC_IP:3000/api/auth/login -H 'Content-Type: application/json' -d '{""email"":""admin@fieldservice.com"",""password"":""admin123""}'" -ForegroundColor Gray