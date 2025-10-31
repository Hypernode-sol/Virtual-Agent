# Hypernode GPU Host Agent (Python)

A lightweight Python agent that connects your GPU to the Hypernode network.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Your Token

1. Visit https://hypernodesolana.org/app
2. Connect your Solana wallet
3. Click "Generate node token"
4. Copy your token

### 3. Run the Agent

```bash
python3 agent.py --endpoint wss://nodes.hypernodesolana.org --token YOUR_TOKEN_HERE
```

## Requirements

- Python 3.8+
- NVIDIA GPU with CUDA support (optional but recommended)
- `nvidia-smi` in PATH for GPU detection

## Features

- ✅ Auto GPU detection
- ✅ WebSocket connection to network
- ✅ Heartbeat every 10 seconds
- ✅ Job execution with timeout
- ✅ Error handling and logging

## Development

For local testing, point to localhost:

```bash
python3 agent.py --endpoint ws://localhost:3003 --token YOUR_TOKEN
```

## Troubleshooting

### "websockets module not found"
```bash
pip install websockets
```

### "nvidia-smi not found"
The agent will still run, but GPU info won't be detected. Make sure:
- NVIDIA drivers are installed
- `nvidia-smi` is in your PATH

### Connection refused
- Check that the endpoint URL is correct
- Verify your firewall allows WebSocket connections
- Ensure the backend server is running

## Security Notes

- Jobs run with your user permissions
- Command timeout: 5 minutes
- Logs are truncated to 1000 characters
- In production, add more sandboxing

## License

MIT License
