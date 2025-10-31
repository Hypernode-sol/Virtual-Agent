# Hypernode GPU Host - Quick Install Script (Windows/PowerShell)
# Usage: iwr -useb http://localhost:3000/install.ps1 | iex; Install-Hypernode -Token "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,

    [Parameter(Mandatory=$false)]
    [string]$Endpoint = "ws://localhost:3003"
)

function Install-Hypernode {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Token,
        [string]$Endpoint = "ws://localhost:3003"
    )

    Write-Host "🚀 Installing Hypernode GPU Host Agent..." -ForegroundColor Cyan
    Write-Host ""

    # Create temp directory
    $tempDir = Join-Path $env:TEMP "hypernode-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Set-Location $tempDir

    Write-Host "📥 Downloading agent..." -ForegroundColor Yellow

    # Download agent.py (same content as Linux version)
    $agentContent = @'
#!/usr/bin/env python3
"""Hypernode GPU Host Agent"""
import asyncio, json, platform, socket, subprocess, sys
from datetime import datetime

try:
    import websockets
except ImportError:
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
        gpus = []
        try:
            result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                                  capture_output=True, text=True, timeout=5)
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
        return {
            'hostname': socket.gethostname(),
            'os': platform.system(),
            'os_version': platform.release(),
            'arch': platform.machine(),
            'gpus': self.detect_gpus()
        }

    def timestamp(self):
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    async def register(self):
        host_info = self.get_host_info()
        await self.ws.send(json.dumps({'type': 'register', 'token': self.token, 'hostInfo': host_info}))
        print(f"[{self.timestamp()}] ✅ Registration sent")
        print(f"  📍 Hostname: {host_info['hostname']}")
        print(f"  🎮 GPUs: {len(host_info['gpus']) if host_info['gpus'] else 'None (CPU mode)'}")

    async def send_heartbeat(self):
        while self.running:
            try:
                await self.ws.send(json.dumps({'type': 'heartbeat', 'nodeId': self.node_id, 'timestamp': datetime.utcnow().isoformat()}))
                await asyncio.sleep(10)
            except:
                break

    async def handle_message(self, message):
        data = json.loads(message)
        if data.get('type') == 'registered':
            self.node_id = data.get('nodeId')
            print(f"[{self.timestamp()}] ✅ Registered! Node ID: {self.node_id}")
            print(f"  🌐 View at: http://localhost:3000/app\n")

    async def connect(self):
        print(f"[{self.timestamp()}] 🔌 Connecting to {self.endpoint}...")
        async with websockets.connect(self.endpoint) as ws:
            self.ws = ws
            self.running = True
            print(f"[{self.timestamp()}] ✅ Connected!")
            await self.register()
            heartbeat_task = asyncio.create_task(self.send_heartbeat())
            try:
                async for msg in ws:
                    await self.handle_message(msg)
            finally:
                self.running = False
                heartbeat_task.cancel()

import argparse
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--endpoint', required=True)
    parser.add_argument('--token', required=True)
    args = parser.parse_args()
    print("=" * 60)
    print("🚀 Hypernode GPU Host Agent")
    print("=" * 60 + "\n")
    asyncio.run(HypernodeAgent(args.endpoint, args.token).connect())
'@

    $agentContent | Out-File -FilePath "agent.py" -Encoding UTF8

    Write-Host "✅ Agent downloaded!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

    # Install websockets
    python -m pip install websockets -q 2>$null

    Write-Host ""
    Write-Host "🎉 Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Starting agent..." -ForegroundColor Cyan
    Write-Host ""

    # Run the agent
    python agent.py --endpoint $Endpoint --token $Token
}

# Export the function so it can be called
Export-ModuleMember -Function Install-Hypernode
