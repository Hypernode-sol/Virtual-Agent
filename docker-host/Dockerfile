# Hypernode Docker Host Agent
# Multi-stage build for optimized image size

# Stage 1: Base image with Python and dependencies
FROM python:3.11-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    ca-certificates \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (for Docker-in-Docker)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: NVIDIA runtime (for GPU support)
FROM base as nvidia

# Install NVIDIA container toolkit dependencies
RUN apt-get update && apt-get install -y \
    nvidia-container-toolkit-base \
    || echo "NVIDIA toolkit not available, GPU features will be limited"

# Stage 3: Final image
FROM base as final

# Copy NVIDIA toolkit if available
COPY --from=nvidia /usr/bin/nvidia-* /usr/bin/ 2>/dev/null || true
COPY --from=nvidia /usr/lib/x86_64-linux-gnu/libnvidia-* /usr/lib/x86_64-linux-gnu/ 2>/dev/null || true

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY agent.py .
COPY healthcheck.py .

# Create non-root user for security
RUN useradd -m -u 1000 hypernode && \
    chown -R hypernode:hypernode /app

# Switch to non-root user
USER hypernode

# Environment variables with defaults
ENV HN_ENDPOINT=wss://nodes.hypernodesolana.org \
    HN_NODE_TOKEN="" \
    HN_HEARTBEAT_INTERVAL=10 \
    HN_JOB_TIMEOUT=300 \
    HN_MAX_LOG_SIZE=10000 \
    HN_RECONNECT_DELAY=5 \
    PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python healthcheck.py || exit 1

# Labels for metadata
LABEL org.opencontainers.image.title="Hypernode Host Agent" \
      org.opencontainers.image.description="Production Docker agent for Hypernode compute network" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.vendor="Hypernode" \
      org.opencontainers.image.source="https://github.com/Hypernode-sol/Hypernode-facilitator"

# Run agent
CMD ["python", "-u", "agent.py"]
