#!/bin/bash
# Hypernode GPU Host - Quick Install Script
# Usage: curl -sSL http://localhost:3000/install.sh | bash -s -- YOUR_TOKEN_HERE

set -e

TOKEN="$1"
ENDPOINT="${2:-ws://localhost:3003}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Token is required"
  echo "Usage: curl -sSL http://localhost:3000/install.sh | bash -s -- YOUR_TOKEN"
  exit 1
fi

echo "🚀 Installing Hypernode GPU Host Agent..."
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Download agent
echo "📥 Downloading agent..."
cat > agent.py << 'EOF'
#!/usr/bin/env python3
"""
Hypernode GPU Host Agent - Minimal Version
Connects to the Hypernode network and executes compute jobs
"""

import asyncio
import json
import argparse
import platform
import socket
import subprocess
import sys
from datetime import datetime

try:
    import websockets
except ImportError:
    print("Error: websockets module not found")
    print("Installing websockets...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

class HypernodeAgent:
    def __init__(self, endpoint, token):
        self.endpoint = endpoint
        self.token = token
        self.node_id = None
        self.ws = None
        self.running = False

    def detect_gpus(self):
        """Detect available GPUs using nvidia-smi"""
        gpus = []
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        parts = line.split(',')
                        if len(parts) >= 2:
                            gpus.append({
                                'model': parts[0].strip(),
                                'vram': parts[1].strip()
                            })
        except:
            pass

        return gpus

    def get_host_info(self):
        """Collect host system information"""
        gpus = self.detect_gpus()

        return {
            'hostname': socket.gethostname(),
            'os': platform.system(),
            'os_version': platform.release(),
            'arch': platform.machine(),
            'gpus': gpus,
        }

    def timestamp(self):
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    async def register(self):
        """Register node with the network"""
        host_info = self.get_host_info()

        message = {
            'type': 'register',
            'token': self.token,
            'hostInfo': host_info
        }

        await self.ws.send(json.dumps(message))
        print(f"[{self.timestamp()}] ✅ Registration request sent")
        print(f"  📍 Hostname: {host_info['hostname']}")
        print(f"  💻 OS: {host_info['os']} {host_info['os_version']}")
        print(f"  🎮 GPUs: {len(host_info['gpus']) if host_info['gpus'] else 'None (CPU mode)'}")

        for gpu in host_info['gpus']:
            print(f"    - {gpu['model']} ({gpu['vram']})")

    async def send_heartbeat(self):
        """Send periodic heartbeat"""
        while self.running:
            try:
                message = {
                    'type': 'heartbeat',
                    'nodeId': self.node_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
                await self.ws.send(json.dumps(message))
                await asyncio.sleep(10)
            except Exception as e:
                print(f"[{self.timestamp()}] ⚠️  Heartbeat error: {e}")
                break

    async def handle_message(self, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'registered':
                self.node_id = data.get('nodeId')
                print(f"[{self.timestamp()}] ✅ Registered successfully!")
                print(f"  🆔 Node ID: {self.node_id}")
                print(f"  💚 Status: Online")
                print(f"")
                print(f"  🌐 View your node at: http://localhost:3000/app")
                print(f"")

            elif msg_type == 'job':
                job_id = data.get('jobId')
                print(f"[{self.timestamp()}] 📋 Received job: {job_id}")
                # Simulate job execution
                await asyncio.sleep(2)
                result_msg = {
                    'type': 'jobResult',
                    'jobId': job_id,
                    'nodeId': self.node_id,
                    'status': 'completed',
                    'result': 'Job completed successfully'
                }
                await self.ws.send(json.dumps(result_msg))
                print(f"[{self.timestamp()}] ✅ Job {job_id} completed")

            elif msg_type == 'error':
                print(f"[{self.timestamp()}] ❌ Error: {data.get('message', 'Unknown error')}")

        except Exception as e:
            print(f"[{self.timestamp()}] ⚠️  Error handling message: {e}")

    async def connect(self):
        """Connect to the WebSocket server"""
        print(f"[{self.timestamp()}] 🔌 Connecting to {self.endpoint}...")

        try:
            async with websockets.connect(self.endpoint) as websocket:
                self.ws = websocket
                self.running = True

                print(f"[{self.timestamp()}] ✅ Connected!")
                await self.register()

                # Start heartbeat task
                heartbeat_task = asyncio.create_task(self.send_heartbeat())

                try:
                    async for message in websocket:
                        await self.handle_message(message)
                except websockets.exceptions.ConnectionClosed:
                    print(f"[{self.timestamp()}] ⚠️  Connection closed")
                finally:
                    self.running = False
                    heartbeat_task.cancel()

        except Exception as e:
            print(f"[{self.timestamp()}] ❌ Connection error: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Hypernode GPU Host Agent')
    parser.add_argument('--endpoint', required=True, help='WebSocket endpoint')
    parser.add_argument('--token', required=True, help='Node registration token')

    args = parser.parse_args()

    print("=" * 60)
    print("🚀 Hypernode GPU Host Agent")
    print("=" * 60)
    print("")

    agent = HypernodeAgent(args.endpoint, args.token)

    try:
        asyncio.run(agent.connect())
    except KeyboardInterrupt:
        print(f"\n[{agent.timestamp()}] 👋 Shutting down gracefully...")
    except Exception as e:
        print(f"\n[{agent.timestamp()}] ❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
EOF

chmod +x agent.py

echo "✅ Agent downloaded!"
echo ""
echo "📦 Installing dependencies..."
pip3 install websockets -q || python3 -m pip install websockets -q

echo ""
echo "🎉 Installation complete!"
echo ""
echo "🚀 Starting agent..."
echo ""

# Run the agent
python3 agent.py --endpoint "$ENDPOINT" --token "$TOKEN"
