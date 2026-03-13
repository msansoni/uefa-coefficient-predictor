# UEFA Coefficient Bracket Predictor

Interactive Monte Carlo simulation for predicting UEFA country coefficient standings for the 2025/26 season. Enter match results and watch probabilities update in real time.

## Quick Start (Local)

```bash
npm install
npm start
# Open http://localhost:3000
```

## Deploy to Digital Ocean

### Option 1: One-Line Deploy (Docker)

SSH into your droplet and run:

```bash
curl -sL https://raw.githubusercontent.com/msansoni/uefa-coefficient-predictor/main/deploy.sh | bash -s -- uefa.michaelsansoni.com
```

Or clone and run manually:

```bash
git clone https://github.com/msansoni/uefa-coefficient-predictor.git /opt/uefa-predictor
cd /opt/uefa-predictor
./deploy.sh uefa.michaelsansoni.com
```

This installs Docker (if needed), builds the app, and starts it behind nginx with rate limiting.

### Option 2: PM2 (No Docker)

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and start
git clone https://github.com/msansoni/uefa-coefficient-predictor.git /opt/uefa-predictor
cd /opt/uefa-predictor
npm install --omit=dev
npm run pm2:start

# Auto-start on reboot
pm2 save
pm2 startup
```

### Enable HTTPS (Let's Encrypt)

After DNS is pointing to your droplet:

```bash
cd /opt/uefa-predictor

# Get certificate
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# Uncomment the HTTPS server block in nginx/default.conf
# Uncomment the certbot service in docker-compose.yml
# Restart
docker compose up -d --build
```

## Architecture

```
uefa-node/
├── server.js              # Express server (gzip, helmet, static serving)
├── package.json
├── ecosystem.config.cjs   # PM2 cluster config
├── Dockerfile             # Alpine Node.js container
├── docker-compose.yml     # App + nginx + optional certbot
├── deploy.sh              # One-command DO setup
├── nginx/
│   └── default.conf       # Reverse proxy, rate limiting, caching
└── public/
    ├── index.html          # Single-page application
    ├── engine.js           # Monte Carlo simulation engine
    └── clubs.js            # Club metadata (badges, flags, colors)
```

The app is entirely client-side — the Node.js server just serves static files with proper headers. Monte Carlo simulations run in the browser so there's zero server load from computation.

## Environment Variables

| Variable   | Default       | Description           |
|-----------|---------------|-----------------------|
| `PORT`    | `3000`        | Server port           |
| `NODE_ENV`| `development` | `production` for prod |
