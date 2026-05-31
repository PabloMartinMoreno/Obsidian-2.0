---
aliases:
  - wfuzz
  - Ffuf
  - Fuff
tags:
  - tool/ffuf
  - technique/recon/active
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Fuzzing]]"
kind: Tool
linked:
  - "[[Web Fuzzing]]"
  - "[[Crawling]]"
  - "[[Fuzzing Directories & Pages]]"
  - "[[Fuzzing Parameters & Values]]"
  - "[[Fuzzing Subdomains & Virtual Hosts]]"
  - "[[Burp Suite]]"
---
# ffuf

***

## Overview

Fuzzer web en Go (**Fuzz Faster U Fool**). Descubrimiento de rutas, parámetros, vhosts, subdominios y mutaciones de request. Token `FUZZ` (default) o custom por `-w <list>:KEYWORD`.

Install: `go install github.com/ffuf/ffuf/v2@latest` / `apt install ffuf`.

> Regla: `ffuf` reemplaza a `dirb`/`gobuster` en casi todo. Más rápido, más flexible, mejor filtering.

***

## Sintaxis base

```bash
ffuf -w <wordlist> -u <url>
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt \
     -u http://target/FUZZ
```

### Keywords múltiples

```bash
ffuf -w hosts.txt:VHOST -w paths.txt:PATH \
     -u http://target/PATH -H 'Host: VHOST.target.com'
```

### Matchers / filters

| Flag | Función |
|---|---|
| `-mc 200,301,302,401` | Match status code |
| `-ml 50` | Match lines |
| `-mw 100` | Match words |
| `-ms 1024` | Match size (bytes) |
| `-mr regex` | Match regex en response |
| `-fc 404` | Filter status |
| `-fl 0` | Filter lines |
| `-fw 50` | Filter words |
| `-fs 1234` | Filter size |
| `-fr regex` | Filter regex |

Workflow: 1) request baseline → 2) `-fs <size>` / `-fc 404` para descartar ruido → 3) releer resultados.

### Modes de ejecución

```bash
-mode clusterbomb    # (default) producto cartesiano entre keywords
-mode pitchfork      # pares sincronizados (user+pass línea N)
-mode sniper         # un keyword a la vez (varios KEYWORD en URL)
```

### Performance

```bash
-t 100               # threads (default 40)
-p 0.1-1.0           # random delay entre requests
-rate 50             # rate limit req/s
-timeout 10
-maxtime 300         # abort tras N segundos
-maxtime-job 60      # por job (recursivo)
```

### Output

```bash
-o results.json -of json               # json / csv / html / md / all
-o results -of all                     # genera múltiples formatos con prefix
-or                                    # output solo si hay resultados
-s                                     # silent (solo URLs matcheadas)
-v                                     # verbose
```

***

## Fuzzing de directorios y archivos

```bash
# Directorios
ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ

# Archivos con extensión específica
ffuf -c -w <ext-wordlist> -u http://<IP>:<port>/indexFUZZ

# Archivos de nombre variable con extensión fija
ffuf -c -w <filename-wordlist> -u http://<IP>:<port>/FUZZ<extension>

# Extensiones múltiples desde flag
ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ -e .php,.html,.bak,.txt

# Recursivo
ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ \
     -recursion -recursion-depth 3 -e .php,.html
```
^ffuf-fuzzing-directorios

### Consejos

- `-ic` ignora comentarios en wordlist (`#`).
- `-D` DirSearch-style: aplica extensiones automáticamente al token FUZZ.
- Wordlists recomendadas:
  - `/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt`
  - `/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt`
  - `/usr/share/seclists/Discovery/Web-Content/big.txt`
  - Tecnología-específica: `/usr/share/seclists/Discovery/Web-Content/CMS/`
  - Backup/archive: `/usr/share/seclists/Discovery/Web-Content/backup-files-only.txt`

***

## Fuzzing de parámetros

```bash
# GET params — filtrar por tamaño baseline
ffuf -c -w <param-wordlist> \
     -u 'http://<IP>:<port>/admin.php?FUZZ=<valid-value>' \
     -fs <char-count>

# POST params
ffuf -c -w <param-wordlist> \
     -u 'http://<IP>:<port>/admin.php' \
     -X POST -d 'FUZZ=<valid-value>' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -fs <char-count>

# JSON body
ffuf -c -w <param-wordlist> \
     -u 'http://<IP>:<port>/api/x' \
     -X POST -H 'Content-Type: application/json' \
     -d '{"FUZZ":"test"}' -fc 404,500
```
^ffuf-fuzzing-parametros

### Wordlists

- `/usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt`
- `/usr/share/seclists/Discovery/Web-Content/common.txt`

### Fuzz de valores

```bash
# Valores SQLi / LFI / XSS
ffuf -c -w sqli-payloads.txt -u 'http://t/x?id=FUZZ' -mr 'SQL syntax'
ffuf -c -w lfi-payloads.txt -u 'http://t/x?file=FUZZ' -mr 'root:'
```

***

## Subdominios y Virtual Hosts

```bash
# Vhost discovery (Host header)
ffuf -c -w <wordlist> \
     -u http://<IP>:<port>/ \
     -H 'Host: FUZZ.<domain>' \
     -fs <char-count>

# Subdomain DNS brute (requiere DNS funcional)
ffuf -c -w <wordlist> -u http://FUZZ.<domain>/
```
^ffuf-enum-vhost

### Wordlists

- `/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt`
- `/usr/share/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt`
- `/usr/share/seclists/Discovery/DNS/fierce-hostlist.txt`

Validar manualmente con `curl -H "Host: found.domain" http://<IP>` antes de añadir a `/etc/hosts`.

***

## HTTP auth / cookies / headers

```bash
# Basic auth
ffuf -u http://t/FUZZ -w w.txt -H 'Authorization: Basic dXNlcjpwYXNz'

# Cookie session
ffuf -u http://t/FUZZ -w w.txt -b 'PHPSESSID=abc; role=admin'
ffuf -u http://t/FUZZ -w w.txt -H 'Cookie: PHPSESSID=abc'

# Bearer token
ffuf -u http://t/api/FUZZ -w w.txt -H 'Authorization: Bearer eyJ...'

# User-Agent rotation manual
ffuf -u http://t/FUZZ -w w.txt -H "User-Agent: Mozilla/5.0 ..."

# Desde request de Burp
ffuf -request req.txt -w w.txt -request-proto http
```

***

## Request desde archivo (Burp export)

```bash
# Copiar request en Burp → save as req.txt → reemplazar valor con FUZZ
ffuf -request req.txt -request-proto https -w w.txt -mc 200
```

Mantiene headers, cookies, método, body.

***

## Recetas frecuentes

### Login brute (cred stuffing)

```bash
ffuf -w users.txt:USER -w passwords.txt:PASS \
     -u http://t/login \
     -X POST -d 'username=USER&password=PASS' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -mode clusterbomb \
     -fr 'Invalid credentials'
```

### Pitchfork (pares user:pass de combo list)

```bash
# combo.txt tiene líneas user:pass → separar antes
cut -d: -f1 combo.txt > u.txt
cut -d: -f2 combo.txt > p.txt
ffuf -w u.txt:U -w p.txt:P -mode pitchfork \
     -u http://t/login -X POST -d 'user=U&pass=P' -fr 'Invalid'
```

### Filter auto-calibration

```bash
ffuf -u http://t/FUZZ -w w.txt -ac                # auto-calibration: filter responses
ffuf -u http://t/FUZZ -w w.txt -acc 'notfound'    # custom baseline string
```

### Scan recursivo con match code

```bash
ffuf -u http://t/FUZZ -w w.txt -recursion -recursion-depth 3 \
     -e .php,.txt,.bak,.zip -mc 200,204,301,302,307,401,403
```

### HTTP method fuzz

```bash
ffuf -u http://t/admin -X FUZZ \
     -w <(printf "GET\nPOST\nPUT\nDELETE\nPATCH\nOPTIONS\nHEAD\nTRACE\nCONNECT")
```

### Path traversal fuzz

```bash
ffuf -u 'http://t/download?file=FUZZ' \
     -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
     -mr 'root:'
```

### GraphQL field enum

```bash
ffuf -u http://t/graphql \
     -X POST -H 'Content-Type: application/json' \
     -d '{"query":"{ FUZZ { id } }"}' \
     -w graphql-fields.txt \
     -fr 'Cannot query field'
```

***

## Config file

Usar `~/.config/ffuf/ffufrc`:

```toml
[general]
colors = true
delay = "0.1-0.5"

[http]
header = "User-Agent: Mozilla/5.0 (compatible; Bot/1.0)"
timeout = 10
```

***

## Tips

- Siempre correr baseline (`curl http://t/<junk>`) para saber `-fs/-fl` antes de fuzzear.
- `-of all` deja json + html + csv con el mismo prefix → útil para reports.
- Arrancar con threads moderados (`-t 50`) y subir — apps frágiles se caen con 200.
- Usar `-replay-proxy http://127.0.0.1:8080` para mandar hits interesantes a Burp (solo matches, no todo).
- `-recursion-strategy greedy` vs `default` — greedy entra a cualquier dir encontrado.
- Para WAF: `-p 2-8 -t 1 -H 'User-Agent: ...'` + proxy SOCKS.

***

## Comparación rápida

| Tool | Uso |
|---|---|
| **ffuf** | Default, flexible, HTTP only |
| **wfuzz** | Python, slower, más plugins |
| **gobuster** | DNS/vhost/dir, menos flexible pero simple |
| **dirsearch** | Dir brute opinionado, buenas defaults |
| **feroxbuster** | Rust, muy rápido, recursion agresiva |

***

## Referencias

- Repo: https://github.com/ffuf/ffuf
- Wiki: https://github.com/ffuf/ffuf/wiki
- Cheatsheet: https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/web-tool-wfuzz
