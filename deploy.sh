#!/bin/bash
# Deploy script for Digital Ocean droplet
# Usage: ./deploy.sh [domain]
# Example: ./deploy.sh uefa.michaelsansoni.com

set -e

DOMAIN=${1:-""}
REPO_URL="https://github.com/msansoni/uefa-coefficient-predictor.git"
APP_DIR="/opt/uefa-predictor"

echo "=== UEFA Coefficient Predictor — Deploy ==="

# ── System updates ─────────────────────────────────────────
echo "→ Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ── Install Docker if not present ──────────────────────────
if ! command -v docker &> /dev/null; then
    echo "→ Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "  Docker installed. You may need to log out and back in for group changes."
fi

# ── Install Docker Compose if not present ──────────────────
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "→ Installing Docker Compose..."
    sudo apt-get install -y -qq docker-compose-plugin
fi

# ── Clone or pull repo ─────────────────────────────────────
if [ -d "$APP_DIR" ]; then
    echo "→ Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "→ Cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── Update domain in nginx config if provided ──────────────
if [ -n "$DOMAIN" ]; then
    echo "→ Setting domain to $DOMAIN..."
    sed -i "s/server_name _;/server_name $DOMAIN;/" nginx/default.conf
fi

# ── Create required directories ────────────────────────────
mkdir -p nginx/certbot/conf nginx/certbot/www logs

# ── Build and start ────────────────────────────────────────
echo "→ Building and starting containers..."
docker compose up -d --build

echo ""
echo "=== Deployment complete ==="
echo "  App running at: http://$(curl -s ifconfig.me):80"
if [ -n "$DOMAIN" ]; then
    echo "  Domain: http://$DOMAIN"
    echo ""
    echo "  To enable HTTPS:"
    echo "  1. Point $DOMAIN DNS A record to $(curl -s ifconfig.me)"
    echo "  2. Run: docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
    echo "  3. Uncomment HTTPS block in nginx/default.conf"
    echo "  4. Uncomment certbot service in docker-compose.yml"
    echo "  5. Run: docker compose up -d --build"
fi
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f          # View logs"
echo "    docker compose restart          # Restart"
echo "    docker compose down             # Stop"
echo "    docker compose up -d --build    # Rebuild and start"
