#!/bin/bash

# Configuration
APP_DIR=$(pwd)
PM2="$APP_DIR/node_modules/.bin/pm2"
TUNNEL_CONFIG="tunnel-config.yml"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   SC LOOT VAULT - SERVICE MANAGER       ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ ! -f "$PM2" ]; then
    echo -e "${RED}Error: pm2 is not installed locally. Run 'npm install pm2 --save-dev'${NC}"
    exit 1
fi

case "$1" in
    start)
        echo -e "${GREEN}Starting services...${NC}"
        $PM2 start ecosystem.config.js
        $PM2 save
        echo -e "${BLUE}Starting Cloudflare Tunnel...${NC}"
        # Use nohup to keep it running in the background independently of the shell
        nohup cloudflared tunnel --config tunnel-config.yml run sc-vault > tunnel.log 2>&1 &
        echo $! > tunnel.pid
        echo -e "${GREEN}Services and Tunnel started! Access at http://localhost:8081 or via your domain.${NC}"
        ;;
    stop)
        echo -e "${RED}Stopping services...${NC}"
        $PM2 stop ecosystem.config.js
        if [ -f tunnel.pid ]; then
            kill $(cat tunnel.pid)
            rm tunnel.pid
            echo -e "${RED}Cloudflare Tunnel stopped.${NC}"
        fi
        ;;
    restart)
        echo -e "${BLUE}Restarting services...${NC}"
        $PM2 restart ecosystem.config.js
        ;;
    status)
        $PM2 status
        ;;
    logs)
        $PM2 logs
        ;;
    setup-tunnel)
        echo -e "${BLUE}Setting up Cloudflare Tunnel...${NC}"
        if ! command -v cloudflared &> /dev/null; then
            echo -e "${RED}cloudflared not found! Please install it first.${NC}"
            exit 1
        fi
        
        echo -e "1. Please authenticate with Cloudflare:"
        cloudflared tunnel login
        
        echo -e "
2. Creating tunnel 'sc-vault'..."
        cloudflared tunnel create sc-vault
        
        echo -e "
3. Configuring tunnel..."
        # Get tunnel ID (this is a bit hacky, better to ask user or parse output, but let's try to be helpful)
        TUNNEL_ID=$(cloudflared tunnel list | grep sc-vault | awk '{print $1}')
        
        if [ -z "$TUNNEL_ID" ]; then
            echo -e "${RED}Could not find tunnel ID. Please check 'cloudflared tunnel list' manually.${NC}"
        else
            echo -e "Tunnel ID: $TUNNEL_ID"
            
            # Create config file
            cat > $TUNNEL_CONFIG <<EOF
tunnel: $TUNNEL_ID
credentials-file: /Users/$USER/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: sc-vault.YOURDOMAIN.com
    service: http://localhost:8081
  - service: http_status:404
EOF
            echo -e "${GREEN}Created $TUNNEL_CONFIG.${NC}"
            echo -e "${RED}IMPORTANT: Edit $TUNNEL_CONFIG to set your actual hostname!${NC}"
            echo -e "Then run: cloudflared tunnel route dns sc-vault sc-vault.YOURDOMAIN.com"
            echo -e "Finally, run: cloudflared tunnel run sc-vault"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|setup-tunnel}"
        exit 1
        ;;
esac
