---
aliases:
  - "Proxy Tools"
  - "OWASP ZAP"
  - Burp
  - BurpSuite
tags:
  - tool/burpsuite
  - technique/recon/active
  - asset/web-app
  - technique/exploitation/web
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web Exploitation]]"
tertiary categories:
  - "[[Proxy Tools]]"
linked:
  - "[[Web Fuzzing]]"
  - "[[Crawling]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[SQL Injection]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Insecure Direct Object References (IDOR)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[JWT Attacks]]"
---
# Burp Suite

***

## Overview

Proxy de interceptación web. Editions: **Community** (gratis, limitada — sin Scanner, Intruder throttled), **Professional** ($449/año), **Enterprise** (CI/CD). Este atómico: workflow operativo, tips y atajos.

> Regla: Burp se usa en background durante toda la sesión de pentest web. Cualquier request que pasa por el browser debe quedar en History.

***

## Setup inicial

### Proxy + browser

- **Browser embebido**: `Proxy → Intercept → Open browser` (Chromium con cert preinstalado — uso rápido).
- **Firefox/Chrome externo**: FoxyProxy → `127.0.0.1:8080` → visitar `http://burp` → descargar `cacert.der` → importar en browser como CA.
- **Upstream proxy** (si target detrás de otro proxy): `User options → Upstream Proxy Servers`.
- **Scope**: `Target → Scope → Add URL`. `Use advanced scope control` + `Only in-scope` filtra logs.

### Project / session

- Temporary project para tests rápidos; **Disk project** para engagements largos (backup automático).
- `Project options → Sessions`: macros para relogins automáticos si sesión expira.

***

## Módulos principales

### Proxy

- `Intercept`: pausa requests antes de enviarse. Útil para modificar parámetros, cambiar verbo, manipular cookies.
- `HTTP history`: log completo. Filtrar por scope, status, MIME, extensión.
- `WebSockets history`: WS frames.
- `Match and replace`: reglas globales (e.g., reemplazar header `User-Agent`).

### Target

- `Site map`: árbol auto-poblado mientras navegás.
- `Scope`: include/exclude regex.
- Click derecho en nodo → `Engagement tools → Find comments/scripts/references`.

### Repeater (**principal**)

- `Ctrl+R` desde cualquier request → manda a Repeater.
- `Ctrl+Space` → send. `Ctrl+Shift+U` → URL-decode selection. `Ctrl+U` → URL-encode.
- Tabs ilimitadas — una por endpoint bajo análisis.
- `Inspector` (panel derecho): edita headers/params/cookies tipado. `View → Inspector`.

### Intruder

Ataques:

| Tipo | Payloads | Uso |
|---|---|---|
| **Sniper** | 1 set → 1 posición a la vez | Fuzz de un parámetro |
| **Battering ram** | 1 set → misma carga en todas las posiciones | Mismo valor en varios campos |
| **Pitchfork** | N sets paralelos (user+pass sincronizados) | Cred testing con pares |
| **Cluster bomb** | Producto cartesiano de N sets | Brute full user×pass |

Positions: `§` marca donde inyectar.  
Payloads: Simple list / Numbers / Dates / Brute forcer / Char substitution / Case mod / Recursive grep.  
Extractions: `Options → Grep-Extract` → parsear valor de response (e.g., CSRF token refresh).  
Resource pool: límite de requests concurrentes (CE = 1 thread throttled).

### Scanner (Pro)

- Active / passive / on-demand.
- `New scan → Crawl + audit` sobre scope.
- Dashboard muestra issues por severidad.
- Custom insertion points para params exóticos.

### Decoder

- URL / HTML / Base64 / Hex / Gzip / ASCII hex.
- Smart decode: autodetecta encoding.

### Comparer

- Diff entre requests/responses. Útil para Blind SQLi, enumeration diffs, IDOR.

### Sequencer

- Analiza entropía de tokens (session, CSRF, password reset).
- FIPS tests: Monobit, Poker, Runs, Long Runs.

### Collaborator

- `Burp Collaborator → Copy to clipboard` → DNS/HTTP/SMTP OOB callbacks.
- Crítico para Blind SSRF, XXE, SQLi out-of-band, RCE blind.
- Pro auto-polls; CE usa Collaborator client manual.

### Extender / BApp Store

BApps imprescindibles:

- **JWT Editor** — sign/verify JWTs, key confusion, alg:none (ver [[JWT Attacks]]).
- **Autorize** — auto-testing de authZ / IDOR (compara response como User A vs User B / no-auth).
- **Param Miner** — descubre params ocultos (headers, query, body).
- **Turbo Intruder** — Python-scripted fuzzer (10k+ req/s, HTTP/2 racing).
- **Logger++** — log mejor que History + filtros avanzados.
- **Hackvertor** — encoding/decoding chainable con tags.
- **Active Scan++** — extensiones al scanner.
- **Upload Scanner** — fuzz de file upload.
- **SAML Raider** — XSW, cert swap.
- **HTTP Request Smuggler** — CL.TE / TE.CL / H2 desync.
- **Backslash Powered Scanner** — detección heurística.
- **Retire.js** — JS libs vulns.
- **CO2** — SQLMapper, tools misc.
- **Reshaper** — regex-driven response rewriter.

***

## Workflows

### Fuzzing de parámetro

1. Interceptar request → `Ctrl+R` Repeater.
2. Confirmar reflection/behavior.
3. `Ctrl+I` → Intruder → Sniper, `§val§`.
4. Payloads → lista relevante (XSS polyglots / SQLi payloads / LFI).
5. Grep match → palabra en response que indica éxito.
6. Sort por length/status en results.

### Request smuggling

- HTTP Request Smuggler BApp → `Smuggle probe`.
- `Repeater → Send group in single connection` (Pro).
- Disable `Update Content-Length` para mantener desync.

### Race conditions (Pro)

- Repeater `Send group in parallel` (single-packet attack, HTTP/2).
- Turbo Intruder con `engine=Engine.BURP2`.

### Auth token handling (session)

- `Project options → Sessions → Session handling rules`:
  - `Check session is valid` (regex en response o URL match).
  - `Run macro` para relogin.
  - Scope: Repeater/Intruder/Scanner.

### Macro de CSRF token refresh

1. `Record macro` → GET que retorna token + POST que usa token.
2. `Extract custom parameter` → regex del token.
3. Session rule: `Before each request in Intruder → Run macro → Update param from macro`.

### CSRF PoC generator

Click derecho request → `Engagement tools → Generate CSRF PoC` → HTML listo (ver [[Cross-Site Request Forgery (CSRF)]]).

### Clickjacking PoC

Click derecho → `Engagement tools → Generate clickjacking PoC`.

***

## Atajos

| Shortcut | Acción |
|---|---|
| `Ctrl+R` | Send to Repeater |
| `Ctrl+I` | Send to Intruder |
| `Ctrl+Space` | Send request |
| `Ctrl+U` / `Ctrl+Shift+U` | URL encode / decode selection |
| `Ctrl+B` | Base64 encode |
| `Ctrl+Shift+B` | Base64 decode |
| `Ctrl+F` | Forward intercepted |
| `Ctrl+T` | Toggle intercept |
| `Ctrl+,` / `Ctrl+.` | Cambiar tab Repeater anterior/siguiente |
| `Ctrl+/` | URL bar |
| `Ctrl+=` / `Ctrl+-` | Zoom |

***

## Tips operativos

- **Disable intercept** por defecto salvo que lo estés usando activamente — interrumpe el browsing.
- **Scope estricto** desde el principio: evita loguear requests a dominios externos (Google Analytics, CDNs).
- **Match/replace** para testing: agregar header `X-Forwarded-For: 127.0.0.1` globalmente.
- **Copy as curl command** (click derecho) para sacar request fuera de Burp.
- **Comments + colors** en History: marcar requests interesantes (`Ctrl+Click` → Highlight).
- **Save selected items**: exportar subset de requests como `.burp` file.

***

## Integración con otras herramientas

- **sqlmap**: copy as command → `sqlmap -r req.txt` (ver [[sqlmap]]).
- **ffuf/wfuzz**: copy request → fuzz con header-auth preservado.
- **nuclei**: `-H "Cookie: ..."` desde request capturado.
- **Upstream proxy a mitmproxy** para scripting avanzado.

***

## Referencias

- Docs: https://portswigger.net/burp/documentation
- Academy: https://portswigger.net/web-security (gratis, hands-on labs).
- BApp Store: https://portswigger.net/bappstore
