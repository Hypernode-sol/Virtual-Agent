# 📝 Exemplos de Jobs para HYPERNODE

Esta pasta contém scripts Python de exemplo que você pode usar para testar o sistema HYPERNODE.

## 🎯 Scripts Disponíveis

### 1. **simple-test.py** (Mais simples)
- **Descrição**: Testa se o ambiente está funcionando
- **Tempo**: ~5 segundos
- **Uso**: Teste rápido de conectividade
- **Requirements**: Nenhum

**Exemplo de submissão:**
```
Job Type: AI Inference
Resource Type: GPU
Estimated Time: 1 hour
Description: Simple environment test
Script: simple-test.py
```

---

### 2. **gpu-benchmark.py** (Intermediário)
- **Descrição**: Detecta GPU e testa performance
- **Tempo**: ~5 segundos
- **Uso**: Verificar se GPU está sendo detectada
- **Requirements**: Nenhum (usa nvidia-smi se disponível)

**Exemplo de submissão:**
```
Job Type: AI Inference
Resource Type: GPU
Estimated Time: 1 hour
Description: GPU detection and benchmark test
Script: gpu-benchmark.py
```

---

### 3. **ai-inference.py** (Simulação)
- **Descrição**: Simula inferência de modelo de IA
- **Tempo**: ~10 segundos
- **Uso**: Demonstrar workflow de inferência
- **Requirements**: Nenhum

**Exemplo de submissão:**
```
Job Type: AI Inference
Resource Type: GPU
Estimated Time: 1 hour
Description: AI model inference on 100 samples
Script: ai-inference.py
```

---

### 4. **3d-rendering.py** (Simulação)
- **Descrição**: Simula renderização 3D
- **Tempo**: ~60 segundos
- **Uso**: Demonstrar workflow de rendering
- **Requirements**: Nenhum

**Exemplo de submissão:**
```
Job Type: Rendering
Resource Type: GPU
Estimated Time: 1 hour
Description: 3D scene rendering - 30 frames at 1920x1080
Script: 3d-rendering.py
```

---

## 🚀 Como Usar

### Opção 1: Pelo Site (http://localhost:3000/app)

1. Conecte sua carteira Solana
2. Role até "Compute Marketplace"
3. Clique em "Submit Compute Job"
4. Preencha os campos:
   - Job Type: Escolha um
   - Resource Type: GPU (recomendado)
   - Estimated Time: 1 hour
   - Description: Copie a descrição acima
   - **Python Script**: Clique e selecione um dos arquivos .py
5. Clique "Submit Job"

### Opção 2: Teste Rápido Direto

Se quiser testar localmente antes de submeter:

```bash
cd examples/example-jobs
python simple-test.py
```

---

## 📊 O Que Esperar

### No PowerShell do Nó:
```
[HH:MM:SS] 📋 Received job: job-abc123
[HH:MM:SS] Executing job job-abc123: python script.py
[Output do script aparece aqui]
[HH:MM:SS] ✅ Job job-abc123 completed
```

### No Site:
- Status muda: Pending → Running → Completed
- "Earned" aumenta na tabela "My GPU Nodes"
- Notificação de sucesso

---

## ⚙️ Personalizando

Você pode criar seus próprios scripts Python! Apenas garanta que:

✅ Seja um arquivo .py válido
✅ Imprima output (para debug)
✅ Finalize (não rode infinitamente)
✅ Trate erros gracefully

---

## 🎓 Scripts Mais Avançados (Requerem Dependências)

Se quiser submeter jobs reais de Machine Learning:

### Exemplo: PyTorch Training

**Script**: `train_model.py`
```python
import torch
import torch.nn as nn

print("Training PyTorch model...")
model = nn.Linear(10, 1)
# ... seu código de treino
```

**Requirements**:
```
torch==2.0.0
numpy>=1.24.0
```

⚠️ **Nota**: O nó precisa instalar as dependências, o que pode levar tempo na primeira execução.

---

**Dúvidas?** Consulte QUICK_TEST_GUIDE.md na raiz do projeto.
