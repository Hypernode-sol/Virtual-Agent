#!/usr/bin/env python3
"""
AI Inference Job - Simula inferência de modelo de IA
Este é um exemplo simplificado sem dependências pesadas
"""

import time
import random

print("=" * 50)
print("HYPERNODE - AI Inference Job")
print("=" * 50)

# Model info
model_name = "gpt-mini-demo"
num_samples = 100

print(f"\n🤖 Loading model: {model_name}")
time.sleep(2)
print("✅ Model loaded successfully")

# Simulate inference
print(f"\n⚡ Running inference on {num_samples} samples...")

predictions = []
for i in range(num_samples):
    # Simulate prediction
    prediction = random.choice(['cat', 'dog', 'bird', 'fish'])
    confidence = random.uniform(0.7, 0.99)
    predictions.append((prediction, confidence))

    if (i + 1) % 20 == 0:
        print(f"Processed: {i + 1}/{num_samples} samples")

    time.sleep(0.05)

# Results
print(f"\n📊 Results:")
print(f"Total samples: {num_samples}")
print(f"Average confidence: {sum(p[1] for p in predictions) / len(predictions):.2%}")
print(f"\n✅ Inference completed successfully!")
print("=" * 50)
