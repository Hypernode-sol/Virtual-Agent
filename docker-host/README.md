# Hypernode Docker Host Agent v2.0

Production-ready Docker agent for the Hypernode decentralized compute network with GPU isolation, security hardening, and Oracle integration.

## Features

### Core Capabilities
- **Docker-in-Docker Job Execution**: Isolated containers for each compute job
- **GPU Support**: Full NVIDIA GPU pass-through with resource limits
- **Oracle Integration**: Automatic proof generation for Facilitator verification
- **Auto-Reconnection**: Resilient WebSocket connection with exponential backoff
- **Health Monitoring**: Built-in health checks and metrics
- **Security Hardening**: Network isolation, resource limits, non-root execution

### Advanced Features
- **Multi-GPU Detection**: Automatic discovery of all available GPUs
- **Resource Limiting**: Configurable CPU, memory, and GPU quotas per job
- **Proof Generation**: SHA256 hashes for execution and logs (Oracle verification)
- **Graceful Shutdown**: Clean termination of running jobs
- **Comprehensive Logging**: Structured logs with timestamps

## Quick Start

### Prerequisites

- **Docker 20.10+** with daemon running
- **NVIDIA GPU** (optional, for GPU jobs)
- **NVIDIA Container Toolkit** (for GPU support)
- **Node Token** from https://hypernodesolana.org/app

### Installation

#### Option 1: Docker Run (Recommended)

```bash
# For CPU-only nodes
docker run -d \
  --name hypernode-host \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e HN_NODE_TOKEN=your-token-here \
  ghcr.io/hypernode-sol/host:latest

# For GPU nodes
docker run -d \
  --name hypernode-host \
  --restart unless-stopped \
  --gpus all \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e HN_NODE_TOKEN=your-token-here \
  ghcr.io/hypernode-sol/host:latest
```

#### Option 2: Docker Compose

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your token:
```bash
HN_NODE_TOKEN=your-token-here
```

3. Start the agent:
```bash
# CPU-only
docker-compose up -d

# GPU-enabled
docker-compose --profile gpu up -d
```

#### Option 3: Build from Source

```bash
# Clone repository
git clone https://github.com/Hypernode-sol/Hypernode-facilitator
cd agents/docker-host

# Build image
docker build -t hypernode-host .

# Run
docker run -d \
  --name hypernode-host \
  --restart unless-stopped \
  --gpus all \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e HN_NODE_TOKEN=your-token-here \
  hypernode-host
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HN_NODE_TOKEN` | **Required** | Your node registration token |
| `HN_ENDPOINT` | `wss://nodes.hypernodesolana.org` | WebSocket endpoint |
| `HN_HEARTBEAT_INTERVAL` | `10` | Heartbeat interval (seconds) |
| `HN_JOB_TIMEOUT` | `300` | Maximum job duration (seconds) |
| `HN_MAX_LOG_SIZE` | `10000` | Maximum log size (characters) |
| `HN_RECONNECT_DELAY` | `5` | Reconnect delay after disconnect (seconds) |

### Example Configuration

```bash
# .env file
HN_NODE_TOKEN=6d3f5c4b-0b29-4ac1-a1e8-4e02f39c1e9f
HN_ENDPOINT=wss://nodes.hypernodesolana.org
HN_HEARTBEAT_INTERVAL=10
HN_JOB_TIMEOUT=600
HN_MAX_LOG_SIZE=20000
HN_RECONNECT_DELAY=5
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Hypernode Docker Agent (Host)           │
│                                                 │
│  ┌────────────┐         ┌──────────────┐       │
│  │ WebSocket  │◄───────►│ Backend API  │       │
│  │  Client    │         │  (server.js) │       │
│  └────────────┘         └──────────────┘       │
│         │                                       │
│         ▼                                       │
│  ┌────────────────────────────────────┐        │
│  │     Docker Client (SDK)            │        │
│  └────────────────────────────────────┘        │
│         │                                       │
│         ▼                                       │
│  ┌────────────────────────────────────┐        │
│  │   Docker Daemon (Host)             │        │
│  │                                    │        │
│  │  ┌──────────────────────────┐     │        │
│  │  │   Job Container          │     │        │
│  │  │  (python:3.11-slim)      │     │        │
│  │  │                          │     │        │
│  │  │  - Network isolation     │     │        │
│  │  │  - Resource limits       │     │        │
│  │  │  - GPU pass-through      │     │        │
│  │  └──────────────────────────┘     │        │
│  └────────────────────────────────────┘        │
│         │                                       │
│         ▼                                       │
│  ┌────────────────────────────────────┐        │
│  │    NVIDIA GPU (Physical)           │        │
│  │    (RTX 4090, A100, etc.)          │        │
│  └────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Job Execution Flow

1. **Agent connects** to backend via WebSocket
2. **Agent registers** with node token and GPU info
3. **Agent sends heartbeats** every 10 seconds
4. **Backend sends job** to agent
5. **Agent creates container**:
   - Pulls Python image (if needed)
   - Mounts job script
   - Sets resource limits
   - Enables GPU (if required)
6. **Container executes** job with timeout
7. **Agent captures logs** and exit code
8. **Agent generates proofs**:
   - `executionHash`: SHA256 of job data
   - `logsHash`: SHA256 of logs
9. **Agent sends results** to backend
10. **Backend queues for Oracle** verification
11. **Oracle verifies** execution integrity
12. **Oracle submits proof** to Facilitator smart contract
13. **Facilitator releases payment** to node wallet

## Security

### Container Isolation

Each job runs in an isolated Docker container with:

- **No network access** (network_mode: none)
- **Memory limits** (default: 8GB)
- **CPU limits** (default: 2 cores)
- **Read-only filesystem** (coming soon)
- **Temporary storage only**

### Agent Security

- **Non-root user**: Agent runs as `hypernode` user (UID 1000)
- **Minimal permissions**: Only accesses Docker socket (read-only)
- **No privileged mode**: Never uses `--privileged`
- **Secure defaults**: All security options enabled

### GPU Security

- **Isolated GPU access**: Container only sees assigned GPU
- **Resource quotas**: GPU memory and compute limited
- **No host GPU driver access**: Only container runtime

## Monitoring

### Health Checks

The agent includes built-in health checks:

```bash
# Check agent health
docker exec hypernode-host python healthcheck.py

# View health status
docker inspect hypernode-host | jq '.[0].State.Health'
```

### Logs

```bash
# View agent logs
docker logs hypernode-host

# Follow logs in real-time
docker logs -f hypernode-host

# View logs from specific time
docker logs --since 10m hypernode-host
```

### Metrics

The agent sends metrics with each heartbeat:

- Active jobs count
- Completed jobs count
- Failed jobs count
- GPU utilization (per GPU)
- Uptime

## Troubleshooting

### Agent Won't Start

**Problem**: Container exits immediately

**Solution**:
```bash
# Check logs
docker logs hypernode-host

# Common issues:
# 1. Missing HN_NODE_TOKEN
docker run ... -e HN_NODE_TOKEN=your-token ...

# 2. Docker socket not mounted
docker run ... -v /var/run/docker.sock:/var/run/docker.sock ...

# 3. Permission denied on Docker socket
sudo chmod 666 /var/run/docker.sock  # or add user to docker group
```

### GPU Not Detected

**Problem**: Agent shows 0 GPUs

**Solution**:
```bash
# 1. Check NVIDIA drivers
nvidia-smi

# 2. Install NVIDIA Container Toolkit
# Ubuntu/Debian:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# 3. Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi
```

### Connection Issues

**Problem**: Agent keeps reconnecting

**Solution**:
```bash
# 1. Check endpoint URL
echo $HN_ENDPOINT

# 2. Test WebSocket connection
wscat -c wss://nodes.hypernodesolana.org

# 3. Check firewall
# Allow outbound connections on port 443 (WSS)

# 4. Check network mode
# Make sure agent container has internet access
docker inspect hypernode-host | jq '.[0].NetworkSettings.Networks'
```

### Jobs Failing

**Problem**: All jobs show status "failed"

**Solution**:
```bash
# 1. Check Docker daemon
systemctl status docker

# 2. Check disk space
df -h

# 3. Check container logs
docker logs hypernode-host

# 4. Test manual container creation
docker run --rm python:3.11-slim python -c "print('Hello')"

# 5. Check resource limits
# Ensure host has enough RAM/CPU for job containers
free -h
nproc
```

### Oracle Verification Failing

**Problem**: Jobs complete but payment not received

**Solution**:
```bash
# 1. Check backend logs for Oracle errors
# Look for: "[Oracle] Verification failed"

# 2. Ensure execution hashes are being sent
# Agent should send: executionHash, logsHash in job_result

# 3. Check job logs contain completion marker
# Logs must include: "completed", "success", "✅", or "done"

# 4. Verify timing is reasonable
# Job duration must be > 1 second and < 2x estimated time
```

## Development

### Building Locally

```bash
# Build image
docker build -t hypernode-host:dev .

# Run with local backend
docker run -d \
  --name hypernode-host-dev \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e HN_ENDPOINT=ws://localhost:3003 \
  -e HN_NODE_TOKEN=test-token \
  hypernode-host:dev
```

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run agent locally (without Docker)
python agent.py --help

# Test with local backend
python agent.py \
  --endpoint ws://localhost:3003 \
  --token test-token
```

### Code Structure

```
agents/docker-host/
├── agent.py              # Main agent code
├── healthcheck.py        # Health check script
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Compose configuration
├── requirements.txt      # Python dependencies
├── .dockerignore         # Docker ignore rules
├── .env.example          # Example environment
└── README.md             # This file
```

## Performance

### Resource Usage

**Agent Container:**
- Memory: ~50MB idle, ~100MB under load
- CPU: <1% idle, ~5% under load
- Disk: ~200MB (image size)

**Job Containers:**
- Memory: Configurable (default 8GB limit)
- CPU: Configurable (default 2 cores)
- GPU: Full GPU if `--gpus all`

### Benchmark

**Test Setup:**
- GPU: RTX 4090 (24GB VRAM)
- CPU: AMD Ryzen 9 5950X
- RAM: 64GB DDR4
- Network: 1Gbps

**Results:**
- Heartbeat latency: ~10ms
- Job startup time: ~2-3s (cold), ~500ms (warm)
- Max concurrent jobs: 10 (limited by GPU memory)
- Network overhead: ~1KB/s per job

## CI/CD

The Docker Agent is automatically built and published via GitHub Actions.

### Automatic Builds

- **On push to `main`**: Builds and pushes `latest` tag
- **On version tag** (v1.2.3): Builds and pushes version tags
- **On PR**: Builds but doesn't push

### Image Tags

- `latest`: Latest stable release
- `v2.0.0`: Specific version
- `v2.0`: Major.minor version
- `v2`: Major version
- `main-abc123`: Branch + commit SHA

### Registry

Images are published to GitHub Container Registry:

```
ghcr.io/hypernode-sol/host:latest
ghcr.io/hypernode-sol/host:v2.0.0
```

## Comparison: Python vs Docker Agent

| Feature | Python Agent | Docker Agent |
|---------|-------------|--------------|
| **Installation** | `pip install` | `docker run` |
| **Security** | ⚠️ Runs on host | ✅ Isolated containers |
| **Resource Control** | ❌ None | ✅ Full limits |
| **GPU Support** | ⚠️ Direct access | ✅ Pass-through |
| **Network Isolation** | ❌ Full access | ✅ No network |
| **Production Ready** | ❌ No | ✅ Yes |
| **Auto-restart** | ❌ Manual | ✅ Automatic |
| **Health Checks** | ❌ None | ✅ Built-in |
| **Proof Generation** | ❌ Basic | ✅ Complete |
| **Oracle Integration** | ⚠️ Partial | ✅ Full |

**Recommendation**: Use **Docker Agent** for production, **Python Agent** for quick testing.

## FAQ

### Can I run both Python and Docker agents?

Yes, but you'll need separate node tokens for each.

### How much can I earn?

Earnings depend on:
- GPU type (RTX 4090 earns more than RTX 3060)
- Uptime (99%+ recommended)
- Job completion rate
- Network demand

Example: RTX 4090 with 99% uptime can earn ~500-1000 HYPER/month.

### Do I need to stake tokens?

No, staking is optional. However, staked nodes get priority for job assignments.

### Can I run multiple GPUs?

Yes, the agent detects all GPUs. Each job can use one or more GPUs based on requirements.

### Is my data safe?

Yes:
- Jobs run in isolated containers
- No network access to containers
- Logs are truncated and sanitized
- No persistent storage

### What happens if my node goes offline?

- Jobs are reassigned to other nodes
- No penalties for short outages (<5 min)
- Reputation decreases for long outages (>1 hour)
- No loss of earned tokens

## Support

### Getting Help

- **Documentation**: https://docs.hypernodesolana.org
- **Discord**: https://discord.gg/hypernode
- **GitHub Issues**: https://github.com/Hypernode-sol/Hypernode-facilitator/issues
- **Email**: support@hypernodesolana.org

### Reporting Bugs

When reporting bugs, include:

1. Agent version: `docker inspect hypernode-host | jq '.[0].Config.Labels'`
2. Docker version: `docker --version`
3. GPU info: `nvidia-smi`
4. Agent logs: `docker logs hypernode-host`
5. Error message

## License

MIT License - see LICENSE file

## Credits

Built with:
- Python 3.11
- websockets 12.0
- docker-py 7.0.0
- NVIDIA Container Toolkit

---

**Version**: 2.0.0
**Last Updated**: 2025-01-30
**Maintained by**: Hypernode Team
