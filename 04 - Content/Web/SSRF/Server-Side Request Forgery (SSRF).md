---
aliases:
  - SSRF
  - Server-Side Request Forgery
tags:
  - type/vulnerability
  - vuln/ssrf
  - technique/initial-access
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[SSRF - Básico]]"
  - "[[SSRF - Protocolos Alternativos]]"
  - "[[SSRF - Blind SSRF]]"
  - "[[SSRF - Cloud Metadata]]"
  - "[[SSRF - CWES]]"
  - "[[Burp Suite]]"
---
# SSRF (Server-Side Request Forgery)

***

## Cheatsheet

### 1. In-Band (respuesta directa)

````tabs
tab: **Básico (loopback + LAN)**
![[SSRF - Básico#^ssrf-basico]]

tab: **Protocolos Alternativos**
![[SSRF - Protocolos Alternativos#^ssrf-protocols]]
````

### 2. Blind / Out-of-Band

````tabs
tab: **Blind SSRF**
![[SSRF - Blind SSRF#^ssrf-blind]]
````

### 3. Cloud-specific

````tabs
tab: **Cloud Metadata (AWS/GCP/Azure)**
![[SSRF - Cloud Metadata#^ssrf-cloud]]
````

___

> **Flujo examen HTB CWES/CBBH** → ver [[SSRF - CWES]] (índice linealizado: mecanismo lógico → reconocimiento → explotación → gopher smuggling, orientado al lab).

___

## Overview

**SSRF (Server-Side Request Forgery)** es una vulnerabilidad donde el atacante induce a la aplicación server-side a realizar requests HTTP (u otros protocolos) a destinos controlados por él — típicamente servicios internos inaccesibles desde internet (loopback, LAN, metadata endpoints).

El backend se convierte en **proxy no intencional** — el atacante hereda la perspectiva de red del server.

### Vectores de inyección típicos

| Funcionalidad | Ejemplo |
|---|---|
| Import URL / file fetcher | `POST /api/import` con `{"url": "http://atk/image.jpg"}` |
| Link preview / OG metadata | Red sociales, chat apps renderizando URLs pegadas |
| Webhooks | Webhook target URL controlado por user |
| PDF/HTML renderers | wkhtmltopdf, Puppeteer — renderiza remote images/iframes |
| XML parsers (XXE → SSRF) | `<!ENTITY x SYSTEM "http://internal/">` |
| OAuth redirect / SSO callbacks | `redirect_uri=http://internal-admin/` |
| Proxy endpoints explícitos | `/fetch?url=` (obvio pero común) |

### Impacto

- **Credential access**: robar IAM tokens via cloud metadata ([[SSRF - Cloud Metadata]]).
- **Internal service enum**: detectar servicios internos bindeados a loopback.
- **RCE**: chain SSRF → Redis / ElasticSearch / memcached sin auth + gopher smuggling ([[SSRF - Protocolos Alternativos]]).
- **Data exfil**: leer files locales via `file://`, leer responses de APIs internas.
- **Pivot**: server víctima se vuelve pivote a otros hosts inalcanzables.
- **Bypass de WAF/FW**: traffic originado internamente no pasa por controles perimetrales.

___

## Detection workflow

1. **Input mapping**: identificar todo campo que acepte URL o hostname.
2. **Callback test**: apuntar URL al Burp Collaborator / interactsh.
   ```
   http://<unique>.oastify.com/
   ```
3. **Si hay DNS hit**: confirmado fetch server-side.
4. **Si hay HTTP hit**: confirmado SSRF in-band completo.
5. **Si solo DNS**: pasar a [[SSRF - Blind SSRF]] playbook.
6. **Escalación**: probar loopback, LAN, metadata endpoints.

___

## Filtros comunes y evasión

| Filtro | Bypass |
|---|---|
| Blacklist `127.0.0.1`, `localhost` | `0.0.0.0`, `[::1]`, `127.1`, `127.0.0.0.1`, IP en decimal/hex/octal. |
| Blacklist `192.168.*`, `10.*` | IPv6-mapped (`[::ffff:10.0.0.1]`), hostnames internos (`db.internal`). |
| DNS whitelist scheme | Redirect 302 desde host atacante whitelisted a `file://` / `gopher://`. |
| URL parser vs DNS resolver diff | `http://allowed.com#@evil.com/`, `http://evil.com\\@allowed.com/`, `http://allowed.com.evil.com/`. |
| SSRF en URL sin schema | `//evil.com/` (schema-relative), depende de lib. |
| Regex dotted-quad | `http://[0:0:0:0:0:ffff:7f00:0001]/` (IPv6 literal). |

### DNS rebinding

Truco clásico: el atacante controla `rebind.evil.com` con TTL=0. Primera resolución → IP pública whitelisted. Segunda (desde el fetch) → `127.0.0.1`. Vulnerable solo si la validación y el fetch resuelven DNS por separado.

___

## Para entender SSRF

**Modelo de red del server**
- El server corre dentro de una red interna — puede ver cosas que vos desde internet no.
- Servicios internos a menudo asumen "si llega request, es legit" → sin auth.
- Metadata endpoints de cloud bindeados a link-local IPs.

**Dos validaciones separadas**
- Parser URL (qué hostname extraer) ≠ DNS resolver (qué IP es).
- Parser HTTP (ver URL "como humano") ≠ socket connect (qué IP usa realmente).
- Gap entre ambos = bypass territory.

**Time of check vs time of use (TOCTOU)**
- Validar URL, resolve una vez, luego fetch resuelve de nuevo → DNS rebinding.

**Impacto por cloud**
- Metadata endpoints = IAM tokens = full cloud compromise.
- IMDSv2 mitigó muchos, pero IMDSv1 aún común en VMs legacy.

___

## Recursos

- [PortSwigger - SSRF](https://portswigger.net/web-security/ssrf)
- [PayloadsAllTheThings - SSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery)
- [HackTricks - SSRF](https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery)
- [OWASP - SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

***
