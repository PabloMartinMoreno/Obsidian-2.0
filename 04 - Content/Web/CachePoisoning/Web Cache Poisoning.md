---
aliases:
  - Web Cache Poisoning
  - WCP
  - Cache Poisoning
  - Cache Deception
tags:
  - vuln/cache-poisoning
  - technique/initial-access
  - technique/impact
  - technique/credential-access
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
  - "[[Web Cache Poisoning - Unkeyed Inputs]]"
  - "[[Web Cache Poisoning - Vectores de Poisoning]]"
  - "[[Web Cache Poisoning - Cache Deception]]"
  - "[[Web Cache Poisoning - Tooling]]"
  - "[[Web Cache Poisoning - Bypasses Avanzados]]"
  - "[[HTTP Request Smuggling]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Burp Suite]]"
---
# Web Cache Poisoning

---

## Cheatsheet

### 🎯 Identificación de Unkeyed Inputs

````tabs
tab: **Headers No Incluidos en Cache Key**
![[Web Cache Poisoning - Unkeyed Inputs#^wcp-unkeyed-headers]]

tab: **Param Miner Workflow**
![[Web Cache Poisoning - Unkeyed Inputs#^wcp-unkeyed-paramminer]]

tab: **Method / Path Normalization**
![[Web Cache Poisoning - Unkeyed Inputs#^wcp-unkeyed-normalization]]
````

### 💉 Vectores de Cache Poisoning

````tabs
tab: **Reflected XSS via Unkeyed Header**
![[Web Cache Poisoning - Vectores de Poisoning#^wcp-vector-xss]]

tab: **Open Redirect via Host**
![[Web Cache Poisoning - Vectores de Poisoning#^wcp-vector-redirect]]

tab: **DoS via Cache (404/500)**
![[Web Cache Poisoning - Vectores de Poisoning#^wcp-vector-dos]]

tab: **Cookie Injection**
![[Web Cache Poisoning - Vectores de Poisoning#^wcp-vector-cookie]]

tab: **Internal Header Injection**
![[Web Cache Poisoning - Vectores de Poisoning#^wcp-vector-internal]]
````

### 🪞 Cache Deception

````tabs
tab: **Path Confusion (.css extension)**
![[Web Cache Poisoning - Cache Deception#^wcp-deception-extension]]

tab: **Path Normalization Differences**
![[Web Cache Poisoning - Cache Deception#^wcp-deception-normalization]]

tab: **Static Prefix Abuse**
![[Web Cache Poisoning - Cache Deception#^wcp-deception-prefix]]

tab: **Encoded Slashes y Variantes**
![[Web Cache Poisoning - Cache Deception#^wcp-deception-encoded]]
````

### 🛠️ Tooling

````tabs
tab: **Param Miner (Burp)**
![[Web Cache Poisoning - Tooling#^wcp-tool-param-miner]]

tab: **HTTP Request Smuggler (Combo)**
![[Web Cache Poisoning - Tooling#^wcp-tool-smuggler]]

tab: **WCVS Scanner**
![[Web Cache Poisoning - Tooling#^wcp-tool-wcvs]]

tab: **Manual curl / Repeater**
![[Web Cache Poisoning - Tooling#^wcp-tool-manual]]
````

### 🛡️ Bypasses Avanzados

````tabs
tab: **Cache Key Normalization**
![[Web Cache Poisoning - Bypasses Avanzados#^wcp-bypass-normalization]]

tab: **Race Conditions Cache Fill**
![[Web Cache Poisoning - Bypasses Avanzados#^wcp-bypass-race]]

tab: **Multi-CDN Chains**
![[Web Cache Poisoning - Bypasses Avanzados#^wcp-bypass-multicdn]]

tab: **Fat GET / Fat POST**
![[Web Cache Poisoning - Bypasses Avanzados#^wcp-bypass-fat]]
````

---

## Overview

**Web Cache Poisoning (WCP)** = atacante manipula response cacheada por capa intermedia (CDN / proxy / Varnish / nginx) inyectando contenido malicioso vía **unkeyed inputs** (headers, cookies, params no incluidos en cache key). Cache distribuye la response venenosa a todo user que pegue cache hit por la duración del TTL.

**Cache Deception (WCD)** = variante donde atacante hace que cache **almacene response privada de víctima** (con cookies / data sensible) bajo URL pública. Atacante refetcha URL → recibe data víctima.

Vector clase A — descubierto por James Kettle (PortSwigger, 2018-2020). CVEs masivos en CDNs, frameworks (Drupal, GitHub, Mozilla). High-impact: stored-effect XSS sin storage, mass DoS, ATO via cache deception.

### Diferencia entre Poisoning y Deception

| | **Cache Poisoning** | **Cache Deception** |
|---|---|---|
| Atacante controla | Headers/inputs unkeyed | Path con extensión / normalización |
| Cache stores | Response controlada por atacante | Response privada de víctima |
| Víctima | Recibe contenido del atacante | Genera contenido cacheado |
| Mitigación | Include unkeyed inputs en cache key | Validar path normalization match cache config |

### Stack común afectado

| Cache layer | Common misconfig |
|---|---|
| **Cloudflare** | "Cache Everything" rules con extensiones permisivas |
| **AWS CloudFront** | TTL agresivo + headers no whitelisted |
| **Akamai** | Path-based caching con normalización distinta a origin |
| **Fastly** | VCL custom con bugs de normalization |
| **Varnish** | Configs default que ignoran custom headers en VCL |
| **nginx proxy_cache** | `proxy_cache_key` minimalista |
| **Apache mod_cache** | mod_cache_disk con TTL agresivo |
| **Squid** | Reverse proxy en deploys legacy |

---

## Workflow de explotación

```
1. Identificar capa de cache:
   - curl -I → headers X-Cache, Age, Via, Cf-Cache-Status
   - graphw00f-style fingerprint (custom).

2. Confirmar caching activo:
   - Doble request mismo URL → segundo HIT.
   - Age incrementa.

3. Mapear cache key:
   - Cambiar header X → ¿response cambia? ¿cache key cambia?
   - Si response cambia pero cache mismo HIT → header UNKEYED.

4. Identificar inputs reflejados (Param Miner):
   - Right-click en Burp → "Guess headers"
   - Output: lista de headers que reflejan en response.

5. Identificar vector:
   a. Header reflejado en HTML → reflected XSS via cache.
   b. Header en `<base href>` o `Location:` → open redirect.
   c. Backend trustea X-Forwarded-Host → SSRF / auth bypass.
   d. Force 404/500 cached → DoS.
   e. Path confusion (.css trick) → cache deception.

6. Forge poisoned request:
   - Inyectar payload en unkeyed input.
   - Confirmar cached: refetch sin payload → response contiene payload.

7. Validate impact:
   - TTL del cache (cuánto persiste).
   - Geographic edge nodes (multi-region poison?).
   - Affected users (cookie-keyed cache subset?).
```

---

## Detección rápida

### Indicadores de stack vulnerable

- `Cache-Control: public, max-age=3600+` en endpoints dinámicos.
- `X-Cache: HIT` con `Age > 0`.
- Headers reflejados en response body (`<base href="https://${HOST}">`).
- Multi-tier deployment (CDN + origin).
- Configs aggressive caching (`Cache Everything` rule).

### Probes mínimos

```bash
# 1. Detectar caching activo
URL="https://target/?cb=$(date +%s)"
curl -sI "$URL" | grep -iE 'x-cache|age|cache-control|cf-cache'
sleep 2
curl -sI "$URL" | grep -i age
# Si Age incrementa → cached

# 2. Probe header unkeyed reflexión
URL2="https://target/?cb=$(date +%s)-2"
RESP=$(curl -s -H "X-Forwarded-Host: PROBE-MARKER" "$URL2")
echo "$RESP" | grep -i "PROBE-MARKER"
# Si refleja → vector candidate

# 3. Confirmar cached
RESP2=$(curl -s "$URL2")
echo "$RESP2" | grep -i "PROBE-MARKER"
# Si refleja sin enviar header → POISONING CONFIRMED

# 4. Auto-mining (Burp)
# Param Miner → Right-click → Guess headers
```

---

## Impacto

- **Stored-effect XSS sin storage** — XSS persiste por TTL del cache (horas-días) sin DB storage.
- **Mass DoS** — 404/500 cached en URL crítica → toda base de users afectada.
- **Open redirect mass phishing** — Location header poisoned → users redirected a atacante.
- **Cookie injection / session fixation** — forced cookie en cached response.
- **Auth bypass via internal headers** — cache poison de `X-Forwarded-For: 127.0.0.1`.
- **Account takeover via cache deception** — atacante recibe data privada de víctima.
- **CSRF token leak** — cached form con fixed token → predictable.
- **Internal endpoint disclosure** — cache poison redirect a internal admin.

---

## Mitigación (defender)

- **Include all relevant inputs en cache key** — `Vary: X-Forwarded-Host, Origin, ...` exhaustivo.
- **No cachear responses dinámicas con headers reflejados** — `Cache-Control: private` para personalized.
- **Strict path normalization** — cache y backend deben normalizar idéntico (slashes, encoding, case).
- **Deshabilitar headers de override** — strip `X-Forwarded-Host` / `X-Original-Url` en frontend si no necesarios.
- **Solo whitelist extensions estáticos** — `.css`, `.js`, `.png` con paths estrictamente bajo `/static/`.
- **Validate Host header en origin** — rejectar requests con Host incorrecto.
- **Sanitize reflected output** — encoding correcto en `<base href>`, `Location:`, etc.
- **Disable response splitting** — strip CRLF en headers reflejados.
- **No cachear responses con `Set-Cookie`** — default behavior.
- **Cache-Control: no-store en endpoints sensibles**.
- **Monitor cache anomalies** — alertas en HIT rate sudden spike.
- **Audit con Param Miner / WCVS en CI/CD**.

---

## Para entender Web Cache Poisoning

**Por qué existe el vector:**

Caches HTTP (CDN, reverse proxy, browser) optimizan latencia almacenando responses. Para servir copia correcta a cliente correcto, cache calcula **cache key** = hash de inputs que afectan response. Idealmente todos los inputs van en key. **En la práctica**, devs simplifican: solo URL + algunos headers. Resto = unkeyed.

Si un input unkeyed cambia la response, cache stores la versión "para alguien" y la sirve a "todos los demás" cuando piden la misma URL. Atacante:
1. Inyecta payload en input unkeyed.
2. Cache stores la response con payload.
3. Víctimas reciben hit → ven el payload.

**Por qué Cache Deception es complementario:**

Caches frecuentemente cachean según extensión de path (`*.css` → cache 1 año). Si backend ignora la extensión y procesa endpoint dinámico, cache stores **response privada** bajo URL pública. Atacante refetcha URL → recibe data privada.

**Por qué fue redescubierto en 2018:**

Cache poisoning conocido desde 2008 (Carlos Bueno). Pero infraestructura moderna (CDN ubicuos, multi-tier) amplificó la superficie. James Kettle popularizó workflow de exploitation con Param Miner — antes era manual + tedioso.

**Diferencia con HTTP Request Smuggling:**

- HRS: desync front/back parser → smuggle request.
- WCP: cache key incompleto → poison response.
- Combinables: HRS para inyectar response que cache stores como otro path.

---

## Recursos

- [PortSwigger - Web Cache Poisoning](https://portswigger.net/web-security/web-cache-poisoning) — labs y conceptos.
- [PortSwigger Research - Practical WCP (Kettle 2018)](https://portswigger.net/research/practical-web-cache-poisoning) — paper original moderno.
- [PortSwigger Research - Web Cache Entanglement (Kettle 2020)](https://portswigger.net/research/web-cache-entanglement) — variants avanzados.
- [Omer Gil - Web Cache Deception (2017)](https://www.blackhat.com/docs/us-17/wednesday/us-17-Gil-Web-Cache-Deception-Attack.pdf) — paper deception.
- [PayloadsAllTheThings - WCP](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Web%20Cache%20Deception) — payloads.
- [HackTricks - Cache Poisoning](https://book.hacktricks.xyz/pentesting-web/cache-deception) — referencia.
- [Param Miner](https://github.com/PortSwigger/param-miner) — Burp ext.
- [Web Cache Vulnerability Scanner](https://github.com/Hackmanit/Web-Cache-Vulnerability-Scanner) — CLI scanner.
- [OWASP - Cache Poisoning](https://owasp.org/www-community/attacks/Cache_Poisoning) — overview.

---
