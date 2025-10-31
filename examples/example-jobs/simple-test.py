#!/usr/bin/env python3
"""
Simple Test Job - Verifica GPU e imprime informações
Este job apenas testa se o ambiente está funcionando
"""

import sys
import platform
import time

print("=" * 50)
print("HYPERNODE - Simple Test Job")
print("=" * 50)

# System info
print(f"\nPython Version: {sys.version}")
print(f"Platform: {platform.system()} {platform.release()}")
print(f"Machine: {platform.machine()}")

# Simulate some work
print("\nExecuting job...")
for i in range(5):
    print(f"Progress: {(i+1)*20}%")
    time.sleep(1)

print("\n✅ Job completed successfully!")
print("=" * 50)
