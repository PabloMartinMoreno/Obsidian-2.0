---
aliases:
  - FeroxBuster
  - ferox
tags:
  - type/tool
  - tool/feroxbuster
  - technique/enumeration
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Recon]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Tool
linked:
  - "[[Fuzzing Directories & Pages]]"
  - "[[ffuf]]"
  - "[[gobuster]]"
---
# feroxbuster

***

## Cheatsheet

| Uso | Comando |
| --- | --- |
| **Básico** | `feroxbuster -u http://host/ -w raft-medium.txt` |
| **+ extensiones** | `feroxbuster -u http://host/ -w w.txt -x php,html,js,bak` |
| **Control profundidad** | `feroxbuster -u http://host/ -w w.txt -d 2` |
| **Filter status** | `feroxbuster -u http://host/ -w w.txt -C 404,500` |
| **Filter size/words** | `feroxbuster -u http://host/ -w w.txt --filter-size 1234 --filter-words 50` |
| **Desde config** | `feroxbuster --resume-from state.ferox` |
| **Auto-filter** | `feroxbuster -u http://host/ -w w.txt --auto-tune --smart` |

***

## Concepto

Content-discovery tool en Rust con **recursión automática** por default. Más inteligente que [[gobuster]]: auto-filtrado adaptativo, collect de extensions/links/backups, resume capability.

Fuerte cuando hay directories listables en cadena — gobuster requiere scripting manual para eso.

## 1. Fuzzing de directorios y archivos
^feroxbuster-fuzzing-directorios

| Acción | Comando |
| --- | --- |
| Fuzzing básico | `feroxbuster -u http://host/ -w wordlist.txt` |
| Con extensiones | `feroxbuster -u http://host/ -w w.txt -x php,html,js` |
| Recursivo explícito (default on) | `feroxbuster -u http://host/ -w w.txt -r` |
| Controlar profundidad | `feroxbuster -u http://host/ -w w.txt -d 2` (0 = infinito) |
| No recurse | `feroxbuster -u http://host/ -w w.txt -n` |
| Filter status | `feroxbuster -u http://host/ -w w.txt -C 403,404,500` |
| Filter size (bytes) | `feroxbuster -u http://host/ -w w.txt -S 1234,5678` |
| Filter words | `feroxbuster -u http://host/ -w w.txt -W 50` |
| Filter regex | `feroxbuster -u http://host/ -w w.txt --filter-regex 'Not Found'` |
| Silent (scripts) | `feroxbuster -u http://host/ -w w.txt -q` |

## 2. Auto-filter modes

```bash
# --auto-tune: ajusta threads según latency
# --smart: baseline filter automático (4xx/5xx patterns)
feroxbuster -u http://host/ -w w.txt --smart

# --auto-bail: abort si WAF/rate-limit detectado
feroxbuster -u http://host/ -w w.txt --auto-bail
```

## 3. Collector features

```bash
# --collect-extensions — agrega extensiones vistas al fuzzing
feroxbuster -u http://host/ -w w.txt --collect-extensions

# --collect-backups — prueba .bak/.old/~ de cada hit
feroxbuster -u http://host/ -w w.txt --collect-backups

# --collect-words — extrae words de responses y las agrega al wordlist
feroxbuster -u http://host/ -w w.txt --collect-words

# Combo "deep scan"
feroxbuster -u http://host/ -w w.txt --collect-extensions --collect-backups --collect-words -d 3
```

## 4. Auth y headers

```bash
# Cookies
feroxbuster -u http://host/ -w w.txt -b 'session=ABC; role=admin'

# Headers arbitrarios
feroxbuster -u http://host/ -w w.txt -H 'Authorization: Bearer X' -H 'X-Forwarded-For: 127.0.0.1'

# Basic auth en URL
feroxbuster -u http://user:pass@host/ -w w.txt

# Query params
feroxbuster -u http://host/ -w w.txt --query 'debug=1&lang=en'
```

## 5. Performance / opsec

| Flag | Uso |
| --- | --- |
| `-t 50` | Threads (default 50). |
| `-T 10` | Timeout por request (s). |
| `--rate-limit 100` | Rate-limit requests/s. |
| `-L 2` | Redirects — seguir N. |
| `-k` | Ignorar TLS invalid. |
| `--random-agent` | Rotate UA. |
| `--proxy http://127.0.0.1:8080` | Via Burp. |
| `--replay-proxy` | Solo mandar hits a proxy. |
| `-r` | Recurse explícito (default). |
| `-n` | No recurse. |

## 6. Resume

```bash
# Ctrl+C → state.ferox escrito
feroxbuster --resume-from state.ferox
```

Ideal para scans largos o WAF timeouts intermitentes.

## 7. Output

```bash
# Text + JSON
feroxbuster -u http://host/ -w w.txt -o results.txt --json

# Solo parseables
feroxbuster -u http://host/ -w w.txt --silent -o urls.txt
```

## Tips

- Wordlists: `raft-medium-words.txt` (SecLists) default razonable; `common.txt` para scans rápidos.
- Para paths específicos: `raft-medium-directories.txt` → `raft-medium-files.txt` stage-2.
- Combina con `--extract-links` (default) para aprender de respuestas HTML automáticamente.
- Si target es SPA → feroxbuster ve poco; combinar con [[Burp Suite]] spider o usar wordlist API-específica.

## Comparativa

| | feroxbuster | [[gobuster]] | [[ffuf]] |
| --- | --- | --- | --- |
| Recursión | **Default on, smart** | No | Manual |
| Auto-tuning | **Sí** | No | Parcial |
| Collector (ext/backup/words) | **Sí** | No | No |
| Modos pitchfork/clusterbomb | No | No | **Sí** |
| Resume | **Sí** | No | Parcial |

## Recursos

- [feroxbuster GitHub](https://github.com/epi052/feroxbuster)

***
