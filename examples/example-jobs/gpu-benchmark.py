#!/usr/bin/env python3
"""
GPU Benchmark Job - Testa performance da GPU
"""

import time
import sys

print("=" * 50)
print("HYPERNODE - GPU Benchmark")
print("=" * 50)

# Try to detect GPU
print("\n🔍 Detecting GPU...")

try:
    import subprocess
    result = subprocess.run(
        ['nvidia-smi', '--query-gpu=name,memory.total,memory.free', '--format=csv,noheader'],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.returncode == 0:
        gpu_info = result.stdout.strip()
        print(f"✅ GPU Found: {gpu_info}")
    else:
        print("⚠️  No NVIDIA GPU detected")

except Exception as e:
    print(f"⚠️  GPU detection failed: {e}")

# Simulate benchmark
print("\n⚡ Running benchmark...")
start = time.time()

# Simulate compute work
for i in range(10):
    _ = sum(range(1000000))
    progress = (i + 1) * 10
    print(f"Progress: {progress}%")
    time.sleep(0.5)

elapsed = time.time() - start
print(f"\n✅ Benchmark completed in {elapsed:.2f} seconds")
print("=" * 50)
