---
aliases:
  - HRS
  - HTTP Smuggling
  - HTTP Desync
  - Request Smuggling
  - Response Queue Poisoning
tags:
  - vuln/http-smuggling
  - technique/initial-access
  - technique/credential-access
  - technique/defense-evasion
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[HTTP Request Smuggling - Variantes Clasicas]]"
  - "[[HTTP Request Smuggling - HTTP2 Downgrade]]"
  - "[[HTTP Request Smuggling - Explotacion]]"
  - "[[HTTP Request Smuggling - Tooling]]"
  - "[[HTTP Request Smuggling - Bypasses]]"
  - "[[Burp Suite]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# HTTP Request Smuggling

***

## Cheatsheet

### 🔄 Variantes Clásicas (HTTP/1.1)

````tabs
tab: **CL.TE**
![[HTTP Request Smuggling - Variantes Clasicas#^hrs-cl-te]]

tab: **TE.CL**
![[HTTP Request Smuggling - Variantes Clasicas#^hrs-te-cl]]

tab: **TE.TE (Header Obfuscation)**
![[HTTP Request Smuggling - Variantes Clasicas#^hrs-te-te]]

tab: **CL.CL (Header Doubling)**
![[HTTP Request Smuggling - Variantes Clasicas#^hrs-cl-cl]]
````

### 🔁 Variantes HTTP/2 (Downgrade)

````tabs
tab: **H2.CL**
![[HTTP Request Smuggling - HTTP2 Downgrade#^hrs-h2-cl]]

tab: **H2.TE**
![[HTTP Request Smuggling - HTTP2 Downgrade#^hrs-h2-te]]

tab: **Request Line Injection (CRLF)**
![[HTTP Request Smuggling - HTTP2 Downgrade#^hrs-h2-request-line]]

tab: **Pseudo-Header / h2c Smuggling**
![[HTTP Request Smuggling - HTTP2 Downgrade#^hrs-h2-pseudo-header]]
````

### 🎯 Explotación

````tabs
tab: **Bypass Front-end Controls**
![[HTTP Request Smuggling - Explotacion#^hrs-exploit-bypass]]

tab: **Request Capture / Hijack**
![[HTTP Request Smuggling - Explotacion#^hrs-exploit-capture]]

tab: **Web Cache Poisoning**
![[HTTP Request Smuggling - Explotacion#^hrs-exploit-cache]]

tab: **Response Queue Poisoning**
![[HTTP Request Smuggling - Explotacion#^hrs-exploit-queue]]

tab: **Reflected XSS Chain**
![[HTTP Request Smuggling - Explotacion#^hrs-exploit-xss]]
````

### 🛠️ Tooling

````tabs
tab: **HTTP Request Smuggler (Burp)**
![[HTTP Request Smuggling - Tooling#^hrs-tool-burp]]

tab: **smuggler.py (defparam)**
![[HTTP Request Smuggling - Tooling#^hrs-tool-smuggler-py]]

tab: **h2cSmuggler**
![[HTTP Request Smuggling - Tooling#^hrs-tool-h2csmuggler]]

tab: **Turbo Intruder Scripts**
![[HTTP Request Smuggling - Tooling#^hrs-tool-turbo]]
````

### 🛡️ Bypasses y Header Obfuscation

````tabs
tab: **TE Obfuscation**
![[HTTP Request Smuggling - Bypasses#^hrs-bypass-te]]

tab: **CL Obfuscation**
![[HTTP Request Smuggling - Bypasses#^hrs-bypass-cl]]

tab: **Whitespace Tricks**
![[HTTP Request Smuggling - Bypasses#^hrs-bypass-whitespace]]

tab: **Connection: close Abuse**
![[HTTP Request Smuggling - Bypasses#^hrs-bypass-connection]]
````

___

## Overview

**HTTP Request Smuggling (HRS)** = explotar **discrepancias entre cómo dos servidores HTTP en cadena interpretan el límite entre dos requests** sobre la misma conexión TCP. Cuando un frontend (CDN / WAF / proxy / load balancer) y un backend (origin server) se desincronizan al parsear `Content-Length` y `Transfer-Encoding`, el atacante "esconde" un segundo request dentro del cuerpo del primero. El backend lo procesa como si viniera de otro cliente — bypaseando el frontend en todo lo que importa: auth, ACL, WAF, rate limit.

**Por qué existe el vector:**

1. HTTP/1.1 permite **dos formas** de delimitar el body — `Content-Length` (bytes) y `Transfer-Encoding: chunked` (terminador).
2. RFC 7230 dice "si ambos están presentes, ignorar `Content-Length`" — pero parsers difieren.
3. Frontend y backend frecuentemente son productos distintos (nginx + Apache, F5 + Tomcat, Cloudflare + origin).
4. Cada uno implementa el RFC con bugs ligeros — el atacante explota la diferencia.
5. HTTP/2 agrega una nueva superficie: downgrade a H1 reactiva todos los bugs viejos + algunos nuevos.

### Variantes principales

| Variante | Frontend usa | Backend usa | Vector |
|---|---|---|---|
| **CL.TE** | Content-Length | Transfer-Encoding | Body chunked smuggleado en CL del front |
| **TE.CL** | Transfer-Encoding | Content-Length | Chunk-size smuggleado dentro del body CL del back |
| **TE.TE** | TE válido | TE ofuscado (o viceversa) | Header obfuscation (whitespace, doubling, etc) |
| **CL.CL** | CL valor 1 | CL valor 2 | Header doubling con valores distintos |
| **H2.CL** | HTTP/2 | HTTP/1.1 + CL del request H2 | Frontend pasa CL de cliente sin recalcular |
| **H2.TE** | HTTP/2 | HTTP/1.1 + TE | Frontend forwarda TE prohibido en H2 al backend H1 |

___

## Workflow de explotación

```
1. Identificar arquitectura: ¿hay proxy/CDN/WAF + backend?
   - curl -v target → ver Server / Via / X-Cache headers
   - HTTP/2 vs HTTP/1.1 negociación

2. Detección con probe timing (CL.TE / TE.CL / TE.TE):
   - Smuggler ext de Burp → "Smuggle Probe"
   - smuggler.py contra single URL
   - Calibrar baseline antes

3. Confirmación con differential response:
   - Self-poison: 2 requests propios — segundo recibe efecto smuggle
   - Status code o body que aparezca de un endpoint distinto

4. Identificar variante exacta:
   - CL.TE / TE.CL / TE.TE / H2.CL / H2.TE
   - Cada una requiere payload distinto

5. Decidir explotación:
   - Bypass auth / WAF (smuggle a /admin)
   - Capture de request user (smuggle con CL grande)
   - Cache poisoning (response cacheada como otra URL)
   - Queue poisoning (responses desplazadas permanentemente)

6. Forge + enviar (Burp Repeater "single connection" + send group)
   - O Turbo Intruder script para volumen.

7. Validar impacto: cookies de víctima, contenido cacheado, endpoints internos accedidos.
```

___

## Detección rápida

### Indicadores arquitecturales

- Header `Via:` en response → proxy chain confirmado.
- Header `Server:` distinto en distintos paths → multi-server arch.
- Headers `X-Cache:`, `X-Backend:`, `X-Forwarded-*` → CDN + origin.
- HTTP/1.1 en HTTPS handshake (sin H2 ALPN) → más vulnerable que H2-only.
- Servers identificados con vulns conocidos: F5 BIG-IP, AWS ALB, Imperva, Akamai (CVE históricos).

### Probes mínimos

```bash
# 1. Identificar HTTP/1.1 vs H2
curl -v --http1.1 https://target/  # forzar H1
curl -v --http2 https://target/    # forzar H2

# 2. Probe CL.TE timing
curl -v --max-time 5 --http1.1 \
  -H "Transfer-Encoding: chunked" \
  -H "Content-Length: 4" \
  --data-binary $'1\r\nA\r\nX' \
  https://target/

# 3. Probe TE.CL timing
curl -v --max-time 5 --http1.1 \
  -H "Content-Length: 6" \
  -H "Transfer-Encoding: chunked" \
  --data-binary $'0\r\n\r\nX' \
  https://target/

# 4. Burp extension (recomendado)
# HTTP Request Smuggler → Right-click → Smuggle Probe
```

___

## Impacto

- **Bypass de WAF / autenticación** — smuggled request no pasa por front-end controls.
- **Hijack de requests de otros usuarios** — capture de Cookies / Authorization headers.
- **Web cache poisoning** — contenido controlado servido como respuesta cacheada para todos.
- **Response queue poisoning** — desync permanente entre front y back; atacante recibe responses destinadas a otros.
- **Acceso a endpoints internos** — `Host:` injection apunta a virtual hosts no expuestos.
- **Stored XSS sin storage** — smuggle inyecta script en response cacheada.
- **Account takeover automatizado** — capture de creds de victims sin user interaction.

___

## Mitigación (defender)

- **Frontend rechaza requests ambiguos**: `Content-Length` + `Transfer-Encoding` simultáneos → HTTP 400.
- **Backend ignora `Content-Length` cuando `Transfer-Encoding: chunked` presente** (RFC 7230 §3.3.3).
- **Frontend normaliza headers** antes de forward: strip whitespace raro, lowercase, descartar duplicates.
- **HTTP/2 end-to-end** — eliminar downgrade a H1 (mata H2.CL / H2.TE).
- **Frontend recalcula CL en downgrade** — descartar CL del cliente H2 antes de pasar a back H1.
- **Strict header validation**: whitespace en header name = reject, header folding = reject.
- **Frontend reject `Connection: ` con headers hop-by-hop arbitrarios**.
- **Per-conn isolation**: no compartir backend conns entre clients (mata response queue poisoning).
- **TLS termination en backend** (no en frontend) — elimina la cadena.
- **WAF actualizado** con reglas anti-HRS (ModSecurity OWASP CRS lo tiene).
- **Monitoreo**: requests con `GPOST` o paths raros en logs del backend = signal de smuggle.

___

## Para entender HRS

**Cómo se delimitan dos requests en una conn TCP HTTP/1.1:**

```
GET /a HTTP/1.1\r\nHost: x\r\n\r\n
GET /b HTTP/1.1\r\nHost: x\r\n\r\n
```

Doble `\r\n\r\n` separa requests. Si hay body, hay que saber dónde termina:
- `Content-Length: N` → leer N bytes de body.
- `Transfer-Encoding: chunked` → leer hasta `0\r\n\r\n` terminator.

**El problema:** si las dos opciones se contradicen, qué hace el server?
- RFC dice ignorar CL. Algunos servers lo siguen, otros no.
- Si front sigue RFC y back no → desync. El "límite" entre requests es distinto para cada uno.

**Por qué importa el frontend:**

El frontend procesa cada request "como una unidad". Aplica auth, WAF, rate limit. Reescribe headers. Forwarda al backend. Si ambos están de acuerdo en dónde termina cada request, no hay problema. **Si no — el atacante mete un request escondido dentro del body — y ese request escapa los controles del frontend**.

**HTTP/2 reabre todo:**

H2 fixea HRS-clásica (binary framing tiene length explícito en cada frame). PERO frontends que hacen H2→H1 downgrade reintroducen el bug porque tienen que **traducir** y la traducción a menudo conserva headers tóxicos del request H2 (`content-length` mismatch, `transfer-encoding`, CRLF en pseudo-headers).

El paper "HTTP/2: The Sequel is Always Worse" de James Kettle (2021) cataloga estos vectors.

___

## Recursos

- [PortSwigger - Request Smuggling](https://portswigger.net/web-security/request-smuggling) — labs y conceptos.
- [PortSwigger - HTTP Desync Attacks (2019)](https://portswigger.net/research/http-desync-attacks-request-smuggling-reborn) — paper original que revivió el vector.
- [PortSwigger - HTTP/2: The Sequel is Always Worse (2021)](https://portswigger.net/research/http2) — H2 downgrade smuggling.
- [PayloadsAllTheThings - Request Smuggling](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Request%20Smuggling) — payloads.
- [HackTricks - HTTP Request Smuggling](https://book.hacktricks.xyz/pentesting-web/http-request-smuggling) — referencia.
- [HTTP Request Smuggler (Burp ext)](https://github.com/PortSwigger/http-request-smuggler) — tool oficial.
- [smuggler.py (defparam)](https://github.com/defparam/smuggler) — CLI.
- [h2cSmuggler (BishopFox)](https://github.com/BishopFox/h2csmuggler) — h2c upgrade.
- [The Tale of Disappearing Length](https://i.blackhat.com/USA-19/Wednesday/us-19-Kettle-HTTP-Desync-Attacks-Smashing-Into-The-Cell-Next-Door-wp.pdf) — Kettle BlackHat paper.

***
