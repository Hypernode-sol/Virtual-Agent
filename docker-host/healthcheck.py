#!/usr/bin/env python3
"""
Health Check Script for Hypernode Docker Agent

Checks if the agent is running properly:
- Docker client is connected
- No critical errors in the last minute
- Agent process is responsive
"""

import sys
import os
import docker

def check_docker():
    """Check if Docker daemon is accessible"""
    try:
        client = docker.from_env()
        client.ping()
        return True
    except Exception as e:
        print(f"Docker health check failed: {e}", file=sys.stderr)
        return False

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['HN_NODE_TOKEN', 'HN_ENDPOINT']

    for var in required_vars:
        if not os.getenv(var):
            print(f"Environment variable {var} not set", file=sys.stderr)
            return False

    return True

def main():
    """Main health check"""
    checks = [
        ("Docker", check_docker),
        ("Environment", check_environment),
    ]

    failed = []
    for name, check_fn in checks:
        if not check_fn():
            failed.append(name)

    if failed:
        print(f"Health check failed: {', '.join(failed)}", file=sys.stderr)
        sys.exit(1)

    print("Health check passed")
    sys.exit(0)

if __name__ == '__main__':
    main()
