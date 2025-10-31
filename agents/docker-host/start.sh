#!/bin/bash
# Hypernode Docker Agent - Quick Start Script
# Usage: ./start.sh [token]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Hypernode Docker Agent Installer${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if token provided as argument
if [ -n "$1" ]; then
    HN_NODE_TOKEN="$1"
else
    # Check if .env exists
    if [ -f .env ]; then
        source .env
    fi

    # Prompt for token if not set
    if [ -z "$HN_NODE_TOKEN" ]; then
        echo -e "${YELLOW}No token found. Get your token from:${NC}"
        echo -e "${BLUE}https://hypernodesolana.org/app${NC}"
        echo ""
        read -p "Enter your node token: " HN_NODE_TOKEN
    fi
fi

if [ -z "$HN_NODE_TOKEN" ]; then
    echo -e "${RED}Error: Node token is required${NC}"
    exit 1
fi

echo -e "${GREEN}Token configured${NC}"
echo ""

# Check Docker installation
echo -e "${BLUE}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    echo ""
    echo "Install Docker with:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

echo -e "${GREEN}Docker is installed: $(docker --version)${NC}"
echo ""

# Check Docker daemon
echo -e "${BLUE}Checking Docker daemon...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}Docker daemon is not running${NC}"
    echo ""
    echo "Start Docker with:"
    echo "  sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}Docker daemon is running${NC}"
echo ""

# Check for GPU
echo -e "${BLUE}Checking for NVIDIA GPU...${NC}"
GPU_AVAILABLE=false
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        GPU_COUNT=$(nvidia-smi --list-gpus | wc -l)
        echo -e "${GREEN}Found $GPU_COUNT NVIDIA GPU(s)${NC}"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | while read line; do
            echo -e "  ${GREEN}├─${NC} $line"
        done
        GPU_AVAILABLE=true
    fi
else
    echo -e "${YELLOW}nvidia-smi not found${NC}"
fi
echo ""

# Check NVIDIA Container Toolkit
if [ "$GPU_AVAILABLE" = true ]; then
    echo -e "${BLUE}Checking NVIDIA Container Toolkit...${NC}"
    if docker run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        echo -e "${GREEN}NVIDIA Container Toolkit is working${NC}"
    else
        echo -e "${YELLOW}Warning: NVIDIA Container Toolkit not configured${NC}"
        echo "Install with:"
        echo "  distribution=\$(. /etc/os-release;echo \$ID\$VERSION_ID)"
        echo "  curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -"
        echo "  curl -s -L https://nvidia.github.io/nvidia-docker/\$distribution/nvidia-docker.list | \\"
        echo "    sudo tee /etc/apt/sources.list.d/nvidia-docker.list"
        echo "  sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit"
        echo "  sudo systemctl restart docker"
        echo ""
        GPU_AVAILABLE=false
    fi
    echo ""
fi

# Stop existing container
echo -e "${BLUE}Checking for existing agent...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^hypernode-host$"; then
    echo -e "${YELLOW}Stopping existing agent...${NC}"
    docker stop hypernode-host &> /dev/null || true
    docker rm hypernode-host &> /dev/null || true
    echo -e "${GREEN}Existing agent removed${NC}"
else
    echo -e "${GREEN}No existing agent found${NC}"
fi
echo ""

# Pull latest image
echo -e "${BLUE}Pulling latest Docker image...${NC}"
if docker pull ghcr.io/hypernode-sol/host:latest; then
    echo -e "${GREEN}Image pulled successfully${NC}"
else
    echo -e "${RED}Failed to pull image${NC}"
    echo "Building from source..."
    docker build -t ghcr.io/hypernode-sol/host:latest .
fi
echo ""

# Start agent
echo -e "${BLUE}Starting Hypernode Agent...${NC}"

DOCKER_CMD="docker run -d \
  --name hypernode-host \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e HN_NODE_TOKEN=$HN_NODE_TOKEN"

if [ "$GPU_AVAILABLE" = true ]; then
    DOCKER_CMD="$DOCKER_CMD --gpus all"
fi

DOCKER_CMD="$DOCKER_CMD ghcr.io/hypernode-sol/host:latest"

if eval $DOCKER_CMD; then
    echo -e "${GREEN}Agent started successfully!${NC}"
else
    echo -e "${RED}Failed to start agent${NC}"
    exit 1
fi
echo ""

# Wait for registration
echo -e "${BLUE}Waiting for registration...${NC}"
sleep 3

# Show logs
echo -e "${BLUE}Agent logs:${NC}"
docker logs hypernode-host | tail -20
echo ""

# Check if registered
if docker logs hypernode-host 2>&1 | grep -q "Registered as node"; then
    NODE_ID=$(docker logs hypernode-host 2>&1 | grep "Registered as node" | awk '{print $NF}')
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Agent Successfully Registered!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Node ID: ${NODE_ID}${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  View logs:   ${YELLOW}docker logs -f hypernode-host${NC}"
    echo -e "  Check status: ${YELLOW}docker ps${NC}"
    echo -e "  Stop agent:   ${YELLOW}docker stop hypernode-host${NC}"
    echo -e "  Restart agent: ${YELLOW}docker restart hypernode-host${NC}"
    echo ""
    echo -e "${BLUE}Monitor your node at:${NC}"
    echo -e "${GREEN}https://hypernodesolana.org/app${NC}"
    echo ""
else
    echo -e "${YELLOW}Agent started but not yet registered${NC}"
    echo -e "${YELLOW}Check logs with: docker logs -f hypernode-host${NC}"
fi
