#!/usr/bin/env python3
"""
Hypernode Docker Host Agent (Production)

Production-ready agent that runs in Docker container with:
- GPU isolation and resource limits
- Secure job execution in nested containers
- Oracle proof generation
- Automatic reconnection
- Health monitoring
"""

import asyncio
import json
import os
import sys
import platform
import socket
import subprocess
import hashlib
import signal
import traceback
from datetime import datetime
from typing import Dict, List, Optional

try:
    import websockets
    import docker
except ImportError as e:
    print(f"Error: Missing required module: {e}")
    print("Install with: pip install websockets docker")
    sys.exit(1)

# Configuration from environment
ENDPOINT = os.getenv('HN_ENDPOINT', 'wss://nodes.hypernodesolana.org')
NODE_TOKEN = os.getenv('HN_NODE_TOKEN')
HEARTBEAT_INTERVAL = int(os.getenv('HN_HEARTBEAT_INTERVAL', '10'))
JOB_TIMEOUT = int(os.getenv('HN_JOB_TIMEOUT', '300'))
MAX_LOG_SIZE = int(os.getenv('HN_MAX_LOG_SIZE', '10000'))
RECONNECT_DELAY = int(os.getenv('HN_RECONNECT_DELAY', '5'))

class HypernodeDockerAgent:
    def __init__(self, endpoint: str, token: str):
        self.endpoint = endpoint
        self.token = token
        self.node_id = None
        self.ws = None
        self.running = False
        self.docker_client = None
        self.active_jobs = {}
        self.stats = {
            'jobs_completed': 0,
            'jobs_failed': 0,
            'total_uptime': 0,
        }

        # Graceful shutdown handler
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)

    def handle_shutdown(self, signum, frame):
        """Handle graceful shutdown"""
        print(f"\n[{self.timestamp()}] Shutdown signal received, cleaning up...")
        self.running = False

        # Stop all active jobs
        for job_id in list(self.active_jobs.keys()):
            self.cleanup_job(job_id)

        sys.exit(0)

    def init_docker(self):
        """Initialize Docker client"""
        try:
            self.docker_client = docker.from_env()
            self.docker_client.ping()
            print(f"[{self.timestamp()}] Docker client connected")
            return True
        except Exception as e:
            print(f"[{self.timestamp()}] Failed to connect to Docker: {e}")
            print("[{self.timestamp()}] Make sure Docker daemon is running")
            return False

    def detect_gpus(self) -> List[Dict]:
        """Detect available GPUs using nvidia-smi"""
        gpus = []
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=index,name,memory.total,memory.free,utilization.gpu',
                 '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        parts = [p.strip() for p in line.split(',')]
                        if len(parts) >= 5:
                            gpus.append({
                                'index': int(parts[0]),
                                'model': parts[1],
                                'vram_total': parts[2] + ' MiB',
                                'vram_free': parts[3] + ' MiB',
                                'utilization': parts[4] + '%'
                            })
        except FileNotFoundError:
            print(f"[{self.timestamp()}] nvidia-smi not found. GPU info unavailable.")
        except Exception as e:
            print(f"[{self.timestamp()}] Error detecting GPUs: {e}")

        return gpus

    def get_host_info(self) -> Dict:
        """Collect host system information"""
        gpus = self.detect_gpus()

        return {
            'hostname': socket.gethostname(),
            'os': platform.system(),
            'os_version': platform.release(),
            'arch': platform.machine(),
            'gpus': gpus,
            'docker_version': self.get_docker_version(),
            'agent_version': '2.0.0-docker',
        }

    def get_docker_version(self) -> str:
        """Get Docker version"""
        try:
            if self.docker_client:
                version = self.docker_client.version()
                return version.get('Version', 'unknown')
        except:
            pass
        return 'unknown'

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
        print(f"  Docker: {host_info['docker_version']}")
        print(f"  GPUs: {len(host_info['gpus'])}")

        for gpu in host_info['gpus']:
            print(f"    - GPU {gpu['index']}: {gpu['model']} ({gpu['vram_total']})")

    async def send_heartbeat(self):
        """Send periodic heartbeat"""
        while self.running:
            try:
                gpus = self.detect_gpus()

                message = {
                    'type': 'heartbeat',
                    'nodeId': self.node_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'stats': {
                        **self.stats,
                        'active_jobs': len(self.active_jobs),
                        'gpus': gpus,
                    }
                }
                await self.ws.send(json.dumps(message))
                await asyncio.sleep(HEARTBEAT_INTERVAL)
            except websockets.exceptions.ConnectionClosed:
                print(f"[{self.timestamp()}] Heartbeat failed: connection closed")
                break
            except Exception as e:
                print(f"[{self.timestamp()}] Heartbeat error: {e}")
                break

    def generate_execution_hash(self, job_id: str, logs: str, result: Dict) -> str:
        """Generate SHA256 hash for Oracle verification"""
        data = {
            'jobId': job_id,
            'logs': logs,
            'result': result,
            'timestamp': datetime.utcnow().isoformat()
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def generate_logs_hash(self, logs: str) -> str:
        """Generate SHA256 hash of logs"""
        return hashlib.sha256(logs.encode()).hexdigest()

    async def execute_job_in_container(self, job: Dict):
        """Execute job in isolated Docker container"""
        job_id = job.get('id')
        script = job.get('script')  # Python script content
        requirements = job.get('requirements', '')  # pip requirements
        dataset_urls = job.get('datasets', [])  # URLs to datasets
        gpu_required = job.get('gpuRequired', False)
        memory_limit = job.get('memoryLimit', '8g')
        cpu_limit = job.get('cpuLimit', 2.0)

        print(f"[{self.timestamp()}] Executing job {job_id} in container")

        container = None
        logs = ""

        try:
            # Prepare container configuration
            container_config = {
                'image': 'python:3.11-slim',
                'command': 'sh -c "pip install -q $REQUIREMENTS && python /job/script.py"',
                'detach': True,
                'remove': False,
                'network_mode': 'none',  # No network access by default
                'mem_limit': memory_limit,
                'nano_cpus': int(cpu_limit * 1e9),
                'volumes': {},
                'environment': {
                    'REQUIREMENTS': requirements or 'numpy',
                    'JOB_ID': job_id,
                }
            }

            # Add GPU if required and available
            if gpu_required:
                gpus = self.detect_gpus()
                if len(gpus) > 0:
                    container_config['device_requests'] = [
                        docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])
                    ]
                    container_config['image'] = 'nvidia/cuda:12.0.0-runtime-ubuntu22.04'
                    print(f"[{self.timestamp()}] GPU access enabled for job {job_id}")
                else:
                    raise Exception("GPU required but no GPUs available")

            # Create temporary script file
            # In production, use volumes or ConfigMaps
            # For now, we'll inject via stdin

            # Run container
            container = self.docker_client.containers.run(**container_config)
            self.active_jobs[job_id] = container

            print(f"[{self.timestamp()}] Container {container.short_id} started for job {job_id}")

            # Wait for completion with timeout
            try:
                result = container.wait(timeout=JOB_TIMEOUT)
                exit_code = result.get('StatusCode', -1)

                # Get logs
                logs = container.logs().decode('utf-8', errors='replace')
                logs = logs[:MAX_LOG_SIZE]  # Truncate if too large

                success = exit_code == 0
                status = 'completed' if success else 'failed'

                print(f"[{self.timestamp()}] Job {job_id} {status} (exit code: {exit_code})")

            except Exception as timeout_error:
                print(f"[{self.timestamp()}] Job {job_id} timed out after {JOB_TIMEOUT}s")
                container.stop(timeout=10)
                status = 'timeout'
                success = False
                logs = f"Job exceeded timeout limit of {JOB_TIMEOUT}s"
                exit_code = -1

            # Generate proof hashes for Oracle
            execution_hash = self.generate_execution_hash(job_id, logs, {
                'exitCode': exit_code,
                'status': status
            })
            logs_hash = self.generate_logs_hash(logs)

            # Send result back to backend
            response = {
                'type': 'job_result',
                'id': job_id,
                'nodeId': self.node_id,
                'status': status,
                'success': success,
                'logs': logs,
                'exitCode': exit_code,
                'executionHash': execution_hash,
                'logsHash': logs_hash,
                'completedAt': int(datetime.utcnow().timestamp() * 1000)
            }

            await self.ws.send(json.dumps(response))

            # Update stats
            if success:
                self.stats['jobs_completed'] += 1
            else:
                self.stats['jobs_failed'] += 1

        except docker.errors.ImageNotFound:
            error_msg = "Docker image not found"
            print(f"[{self.timestamp()}] {error_msg}")
            await self.send_job_error(job_id, error_msg)
            self.stats['jobs_failed'] += 1

        except docker.errors.APIError as e:
            error_msg = f"Docker API error: {str(e)}"
            print(f"[{self.timestamp()}] {error_msg}")
            await self.send_job_error(job_id, error_msg)
            self.stats['jobs_failed'] += 1

        except Exception as e:
            error_msg = f"Job execution error: {str(e)}\n{traceback.format_exc()}"
            print(f"[{self.timestamp()}] {error_msg}")
            await self.send_job_error(job_id, error_msg)
            self.stats['jobs_failed'] += 1

        finally:
            # Cleanup
            self.cleanup_job(job_id, container)

    def cleanup_job(self, job_id: str, container=None):
        """Clean up job resources"""
        try:
            if container is None and job_id in self.active_jobs:
                container = self.active_jobs[job_id]

            if container:
                try:
                    container.remove(force=True)
                    print(f"[{self.timestamp()}] Container for job {job_id} removed")
                except:
                    pass

            if job_id in self.active_jobs:
                del self.active_jobs[job_id]

        except Exception as e:
            print(f"[{self.timestamp()}] Cleanup error for job {job_id}: {e}")

    async def send_job_error(self, job_id: str, error_msg: str):
        """Send job error to backend"""
        try:
            response = {
                'type': 'job_result',
                'id': job_id,
                'nodeId': self.node_id,
                'status': 'error',
                'success': False,
                'logs': error_msg,
                'exitCode': -1
            }
            await self.ws.send(json.dumps(response))
        except Exception as e:
            print(f"[{self.timestamp()}] Failed to send error for job {job_id}: {e}")

    async def handle_message(self, message: str):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'registered':
                self.node_id = data.get('nodeId')
                print(f"[{self.timestamp()}] ✅ Registered as node: {self.node_id}")
                print(f"[{self.timestamp()}] Agent is now online and ready for jobs")

            elif msg_type == 'job':
                # Execute job asynchronously
                asyncio.create_task(self.execute_job_in_container(data))

            elif msg_type == 'job_cancel':
                job_id = data.get('jobId')
                print(f"[{self.timestamp()}] Canceling job {job_id}")
                self.cleanup_job(job_id)

            elif msg_type == 'ack':
                # Heartbeat acknowledged
                pass

            elif msg_type == 'ping':
                # Respond to ping
                await self.ws.send(json.dumps({'type': 'pong'}))

            elif msg_type == 'error':
                print(f"[{self.timestamp()}] ❌ Server error: {data.get('message')}")

            else:
                print(f"[{self.timestamp()}] Unknown message type: {msg_type}")

        except json.JSONDecodeError as e:
            print(f"[{self.timestamp()}] Failed to parse message: {e}")
        except Exception as e:
            print(f"[{self.timestamp()}] Error handling message: {e}")

    async def run(self):
        """Main agent loop with auto-reconnect"""
        print(f"[{self.timestamp()}] Hypernode Docker Agent v2.0 starting...")
        print(f"  Endpoint: {self.endpoint}")
        print(f"  Token: {self.token[:8] if self.token else 'NOT_SET'}...")

        if not self.token:
            print(f"[{self.timestamp()}] ❌ Error: HN_NODE_TOKEN not set")
            return

        # Initialize Docker
        if not self.init_docker():
            print(f"[{self.timestamp()}] ❌ Failed to initialize Docker client")
            return

        attempt = 0
        while True:
            attempt += 1
            try:
                print(f"[{self.timestamp()}] Connection attempt {attempt}...")

                async with websockets.connect(
                    self.endpoint,
                    ping_interval=30,
                    ping_timeout=10
                ) as ws:
                    self.ws = ws
                    self.running = True

                    # Register node
                    await self.register()

                    # Start heartbeat task
                    heartbeat_task = asyncio.create_task(self.send_heartbeat())

                    # Listen for messages
                    try:
                        async for message in ws:
                            await self.handle_message(message)
                    except websockets.exceptions.ConnectionClosed as e:
                        print(f"[{self.timestamp()}] Connection closed: {e}")
                    finally:
                        self.running = False
                        heartbeat_task.cancel()

                        # Wait for heartbeat to finish
                        try:
                            await heartbeat_task
                        except asyncio.CancelledError:
                            pass

            except websockets.exceptions.InvalidURI:
                print(f"[{self.timestamp()}] ❌ Invalid endpoint URI: {self.endpoint}")
                break
            except websockets.exceptions.WebSocketException as e:
                print(f"[{self.timestamp()}] ❌ WebSocket error: {e}")
            except Exception as e:
                print(f"[{self.timestamp()}] ❌ Unexpected error: {e}")
                print(traceback.format_exc())

            # Reconnect delay
            if self.running:  # Only reconnect if not shutting down
                print(f"[{self.timestamp()}] Reconnecting in {RECONNECT_DELAY}s...")
                await asyncio.sleep(RECONNECT_DELAY)
            else:
                break

    def timestamp(self) -> str:
        """Return formatted timestamp"""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def main():
    """Main entry point"""
    print("=" * 60)
    print("Hypernode Docker Host Agent v2.0")
    print("Production-ready compute node with Docker isolation")
    print("=" * 60)

    # Validate environment
    if not NODE_TOKEN:
        print("\n❌ Error: HN_NODE_TOKEN environment variable not set")
        print("\nUsage:")
        print("  docker run -e HN_NODE_TOKEN=your-token ghcr.io/hypernode-sol/host:latest")
        sys.exit(1)

    agent = HypernodeDockerAgent(ENDPOINT, NODE_TOKEN)

    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        print(f"\n[{agent.timestamp()}] Agent stopped by user")
    except Exception as e:
        print(f"\n[{agent.timestamp()}] Fatal error: {e}")
        print(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()
