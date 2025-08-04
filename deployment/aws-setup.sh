#!/bin/bash

# AWS EC2 Setup Script for CryptoTrader Pro
# Run this script on a fresh Ubuntu 20.04 EC2 instance

set -e

echo "🚀 Setting up CryptoTrader Pro on AWS EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker and Docker Compose
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /opt/cryptotrader
sudo chown $USER:$USER /opt/cryptotrader
cd /opt/cryptotrader

# Clone repository (you'll need to replace this with your actual repo)
echo "📦 Please clone your repository to /opt/cryptotrader"
echo "git clone https://github.com/yourusername/cryptotrader-pro.git ."

# Create environment file template
cat > .env.example << EOF
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=3001
NODE_ENV=production
WEBHOOK_BASE_URL=https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AWS (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EOF

echo "📝 Please copy .env.example to .env and fill in your actual values"

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptotrader-server',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/cryptotrader << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React app)
    location / {
        root /opt/cryptotrader/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Webhook endpoints (no rate limiting)
    location /api/webhooks/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase body size for webhook payloads
        client_max_body_size 10M;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/cryptotrader /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Create systemd service for auto-start
sudo tee /etc/systemd/system/cryptotrader.service << EOF
[Unit]
Description=CryptoTrader Pro
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=/opt/cryptotrader
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create log rotation
sudo tee /etc/logrotate.d/cryptotrader << EOF
/opt/cryptotrader/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Set up firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create logs directory
mkdir -p /opt/cryptotrader/logs

echo "✅ Basic setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/cryptotrader"
echo "2. Copy .env.example to .env and configure your environment variables"
echo "3. Update the domain name in /etc/nginx/sites-available/cryptotrader"
echo "4. Run: npm install && cd server && npm install"
echo "5. Run: npm run build"
echo "6. Run: sudo systemctl enable cryptotrader"
echo "7. Run: sudo systemctl start cryptotrader"
echo "8. Run: sudo systemctl reload nginx"
echo "9. Set up SSL: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "🎉 Your CryptoTrader Pro platform will be ready!"