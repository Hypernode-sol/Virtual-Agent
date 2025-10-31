#!/usr/bin/env python3
"""
Hypernode GPU Host Agent
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
    print("Install it with: pip install websockets")
    sys.exit(1)

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
        except FileNotFoundError:
            print("nvidia-smi not found. No NVIDIA GPUs detected.")
        except Exception as e:
            print(f"Error detecting GPUs: {e}")

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
            'cpu_count': None  # Could add psutil for this
        }

    async def register(self):
        """Register node with the network"""
        host_info = self.get_host_info()

        message = {
            'type': 'register',
            'token': self.token,
            'hostInfo': host_info
        }

        await self.ws.send(json.dumps(message))
        print(f"[{self.timestamp()}] Registration request sent")
        print(f"  Hostname: {host_info['hostname']}")
        print(f"  OS: {host_info['os']} {host_info['os_version']}")
        print(f"  GPUs: {len(host_info['gpus'])}")

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
                await asyncio.sleep(10)  # Heartbeat every 10 seconds
            except Exception as e:
                print(f"[{self.timestamp()}] Heartbeat error: {e}")
                break

    async def execute_job(self, job):
        """Execute a compute job"""
        job_id = job.get('id')
        command = job.get('command')

        print(f"[{self.timestamp()}] Executing job {job_id}: {command}")

        try:
            # Execute command (in a real implementation, add more security checks)
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            status = 'completed' if result.returncode == 0 else 'failed'
            logs = result.stdout + result.stderr

            # Send result back
            response = {
                'type': 'job_result',
                'id': job_id,
                'status': status,
                'logs': logs[:1000],  # Limit log size
                'exitCode': result.returncode
            }

            await self.ws.send(json.dumps(response))
            print(f"[{self.timestamp()}] Job {job_id} {status}")

        except subprocess.TimeoutExpired:
            response = {
                'type': 'job_result',
                'id': job_id,
                'status': 'timeout',
                'logs': 'Job exceeded timeout limit'
            }
            await self.ws.send(json.dumps(response))
            print(f"[{self.timestamp()}] Job {job_id} timed out")

        except Exception as e:
            response = {
                'type': 'job_result',
                'id': job_id,
                'status': 'error',
                'logs': str(e)
            }
            await self.ws.send(json.dumps(response))
            print(f"[{self.timestamp()}] Job {job_id} error: {e}")

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
                print(f"  🌐 View your node at: http://localhost:3000/app")
                print(f"")
                print(f"[{self.timestamp()}] Waiting for compute jobs...")
                print(f"")

            elif msg_type == 'job':
                await self.execute_job(data)

            elif msg_type == 'ack':
                # Heartbeat acknowledged
                pass

            elif msg_type == 'error':
                print(f"[{self.timestamp()}] ❌ Error: {data.get('message')}")

            else:
                print(f"[{self.timestamp()}] Unknown message type: {msg_type}")

        except json.JSONDecodeError as e:
            print(f"[{self.timestamp()}] Failed to parse message: {e}")

    async def run(self):
        """Main agent loop with auto-reconnect"""
        print(f"[{self.timestamp()}] ============================================================")
        print(f"[{self.timestamp()}] Hypernode GPU Host Agent Starting...")
        print(f"[{self.timestamp()}] ============================================================")
        print(f"  Endpoint: {self.endpoint}")
        print(f"  Token: {self.token[:8]}...")
        print("")

        retry_count = 0
        max_retries = 999  # Keep trying forever

        while retry_count < max_retries:
            try:
                print(f"[{self.timestamp()}] Connecting to network...")
                async with websockets.connect(
                    self.endpoint,
                    ping_interval=15,  # Send ping every 15 seconds
                    ping_timeout=10,   # Wait 10 seconds for pong
                    close_timeout=10   # Wait 10 seconds for close
                ) as ws:
                    self.ws = ws
                    self.running = True
                    retry_count = 0  # Reset on successful connection

                    print(f"[{self.timestamp()}] ✅ Connected successfully!")
                    print("")

                    # Register node
                    await self.register()

                    # Start heartbeat task
                    heartbeat_task = asyncio.create_task(self.send_heartbeat())

                    # Listen for messages
                    try:
                        async for message in ws:
                            await self.handle_message(message)
                    except websockets.exceptions.ConnectionClosed as e:
                        print(f"[{self.timestamp()}] ⚠️  Connection lost: {e}")
                    finally:
                        self.running = False
                        heartbeat_task.cancel()

                # If we get here, connection was closed
                print(f"[{self.timestamp()}] Reconnecting in 5 seconds...")
                await asyncio.sleep(5)

            except websockets.exceptions.InvalidURI:
                print(f"[{self.timestamp()}] ❌ Invalid endpoint URI: {self.endpoint}")
                break
            except websockets.exceptions.WebSocketException as e:
                print(f"[{self.timestamp()}] ❌ WebSocket error: {e}")
                retry_count += 1
                print(f"[{self.timestamp()}] Retrying in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"[{self.timestamp()}] ❌ Unexpected error: {e}")
                retry_count += 1
                print(f"[{self.timestamp()}] Retrying in 5 seconds...")
                await asyncio.sleep(5)

    def timestamp(self):
        """Return formatted timestamp"""
        return datetime.now().strftime("%H:%M:%S")

def main():
    parser = argparse.ArgumentParser(description='Hypernode GPU Host Agent')
    parser.add_argument('--endpoint', required=True, help='WebSocket endpoint URL')
    parser.add_argument('--token', required=True, help='Node registration token')

    args = parser.parse_args()

    agent = HypernodeAgent(args.endpoint, args.token)

    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        print(f"\n[{agent.timestamp()}] Agent stopped by user")
    except Exception as e:
        print(f"\n[{agent.timestamp()}] Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
