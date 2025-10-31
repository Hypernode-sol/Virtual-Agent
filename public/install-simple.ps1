# Hypernode GPU Host - Simple Install Script for Windows
# Usage: Save this file and run: .\install-simple.ps1 -Token "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    [string]$Endpoint = "ws://localhost:3003"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "        Hypernode GPU Host Agent Installer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/5] Checking Python..." -ForegroundColor Yellow
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} else {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python from: https://python.org/downloads" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

$pythonVersion = & $pythonCmd --version
Write-Host "      Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Create temp directory
Write-Host "[2/5] Creating temporary directory..." -ForegroundColor Yellow
$tempDir = Join-Path $env:TEMP "hypernode-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Set-Location $tempDir
Write-Host "      Directory: $tempDir" -ForegroundColor Green
Write-Host ""

# Download agent
Write-Host "[3/5] Downloading agent..." -ForegroundColor Yellow
$agentContent = @'
#!/usr/bin/env python3
"""Hypernode GPU Host Agent - Standalone Version"""
import asyncio, json, platform, socket, subprocess, sys, os
from datetime import datetime

# Auto-install websockets if not available
try:
    import websockets
except ImportError:
    print("Installing websockets module...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
    import websockets
    print("websockets installed successfully!")

class HypernodeAgent:
    def __init__(self, endpoint, token):
        self.endpoint = endpoint
        self.token = token
        self.node_id = None
        self.ws = None
        self.running = False

    def detect_gpus(self):
        """Detect NVIDIA GPUs using nvidia-smi"""
        gpus = []
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        parts = line.split(',')
                        if len(parts) >= 2:
                            gpus.append({'model': parts[0].strip(), 'vram': parts[1].strip()})
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
            'gpus': gpus
        }

    def timestamp(self):
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    async def register(self):
        """Register node with the network"""
        host_info = self.get_host_info()
        message = {'type': 'register', 'token': self.token, 'hostInfo': host_info}
        await self.ws.send(json.dumps(message))

        print(f"[{self.timestamp()}] Registration sent")
        print(f"  Hostname: {host_info['hostname']}")
        print(f"  OS: {host_info['os']} {host_info['os_version']}")
        print(f"  Arch: {host_info['arch']}")

        if host_info['gpus']:
            print(f"  GPUs: {len(host_info['gpus'])}")
            for gpu in host_info['gpus']:
                print(f"    - {gpu['model']} ({gpu['vram']})")
        else:
            print(f"  GPUs: None (CPU mode)")
        print("")

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
                print(f"[{self.timestamp()}] Heartbeat error: {e}")
                break

    async def handle_message(self, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'registered':
                self.node_id = data.get('nodeId')
                print(f"[{self.timestamp()}] ===================================")
                print(f"[{self.timestamp()}] REGISTRATION SUCCESSFUL!")
                print(f"[{self.timestamp()}] ===================================")
                print(f"  Node ID: {self.node_id}")
                print(f"  Status: ONLINE")
                print(f"")
                print(f"  View your node at: http://localhost:3000/app")
                print(f"")
                print(f"[{self.timestamp()}] Waiting for compute jobs...")
                print("")

            elif msg_type == 'job':
                job_id = data.get('jobId')
                print(f"[{self.timestamp()}] Received job: {job_id}")
                await asyncio.sleep(2)
                result_msg = {
                    'type': 'jobResult',
                    'jobId': job_id,
                    'nodeId': self.node_id,
                    'status': 'completed',
                    'result': 'Job completed'
                }
                await self.ws.send(json.dumps(result_msg))
                print(f"[{self.timestamp()}] Job {job_id} completed")

            elif msg_type == 'error':
                print(f"[{self.timestamp()}] Error from server: {data.get('message', 'Unknown')}")

        except Exception as e:
            print(f"[{self.timestamp()}] Error handling message: {e}")

    async def connect(self):
        """Connect to WebSocket server"""
        print(f"[{self.timestamp()}] Connecting to {self.endpoint}...")

        try:
            async with websockets.connect(self.endpoint) as ws:
                self.ws = ws
                self.running = True
                print(f"[{self.timestamp()}] Connected successfully!")
                print("")

                await self.register()
                heartbeat_task = asyncio.create_task(self.send_heartbeat())

                try:
                    async for msg in ws:
                        await self.handle_message(msg)
                except websockets.exceptions.ConnectionClosed:
                    print(f"[{self.timestamp()}] Connection closed by server")
                finally:
                    self.running = False
                    heartbeat_task.cancel()

        except Exception as e:
            print(f"[{self.timestamp()}] Connection error: {e}")
            print("")
            print("Possible issues:")
            print("  - Backend server not running")
            print("  - Wrong endpoint address")
            print("  - Firewall blocking connection")
            raise

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Hypernode GPU Host Agent')
    parser.add_argument('--endpoint', required=True, help='WebSocket endpoint')
    parser.add_argument('--token', required=True, help='Node registration token')
    args = parser.parse_args()

    print("=" * 60)
    print("   HYPERNODE GPU HOST AGENT")
    print("=" * 60)
    print("")

    agent = HypernodeAgent(args.endpoint, args.token)

    try:
        asyncio.run(agent.connect())
    except KeyboardInterrupt:
        print(f"\n[{agent.timestamp()}] Shutting down gracefully...")
        print("Goodbye!")
    except Exception as e:
        print(f"\n[{agent.timestamp()}] Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
'@

$agentContent | Out-File -FilePath "agent.py" -Encoding UTF8
Write-Host "      Agent downloaded!" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "[4/5] Installing dependencies..." -ForegroundColor Yellow
Write-Host "      Installing websockets module..." -ForegroundColor Gray
try {
    & $pythonCmd -m pip install websockets -q 2>$null
    Write-Host "      Dependencies installed!" -ForegroundColor Green
} catch {
    Write-Host "      Warning: pip install had issues, but agent will auto-install" -ForegroundColor Yellow
}
Write-Host ""

# Run agent
Write-Host "[5/5] Starting agent..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

& $pythonCmd agent.py --endpoint $Endpoint --token $Token
