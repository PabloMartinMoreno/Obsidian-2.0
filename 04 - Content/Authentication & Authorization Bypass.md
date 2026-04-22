---
aliases:
  - Auth Bypass
  - Authentication Bypass
tags:
  - type/vulnerability
  - vuln/auth-bypass
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Vulnerability
linked:
---
# Authentication & Authorization Bypass

***

## Cheatsheet

| **Categoría**                       | **Técnica**                                                         | **Ejemplo / PoC**                                                           |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Credenciales default**            | Probar `admin:admin`, `root:root`, docs del producto                | `hydra`, `medusa`, wordlists de SecLists.                                   |
| **SQL Injection en login**          | `' OR 1=1--`                                                        | Bypass del `WHERE user='x' AND pass='y'`.                                   |
| **Truncation attack**               | DB trunca passwords largos                                          | `admin                                      x` → match por prefijo.        |
| **Username enumeration**            | Diferencia en timing o response entre user válido/inválido          | Enumerar usuarios antes de brute force.                                     |
| **Forced browsing**                 | Acceder directo a `/admin/dashboard`                                | Ruta post-login sin check server-side.                                      |
| **HTTP verb tampering**             | `GET /admin` bloqueado → `POST /admin` permite                      | Auth aplicada solo a ciertos verbos.                                        |
| **Header spoofing**                 | `X-Forwarded-For: 127.0.0.1`, `X-Original-URL: /admin`              | Bypass de middleware de path/ip.                                            |
| **JWT none algorithm**              | `{"alg":"none"}` + payload modificado                               | Firma no validada.                                                          |
| **JWT key confusion**               | RS256 → HS256 usando pubkey como secret                             | Atacante firma como servidor.                                               |
| **Session fixation**                | Forzar session ID conocido antes de login                           | Reusar cookie tras auth legítima de víctima.                                |
| **Password reset token predecible** | Token basado en timestamp o UUIDv1                                  | Predecir y usar antes que víctima.                                          |
| **2FA bypass**                      | Flow permite skip vía `POST /verify?code=` con código vacío          | Logic flaw, response-based bypass, race conditions.                         |
| **OAuth redirect_uri manipulation** | `redirect_uri=atacante.com`                                         | Token/code enviado a atacante.                                              |
| **Mass Assignment**                 | `POST /register` con `"role":"admin"` extra                         | Backend sin whitelist de campos.                                            |
| **Insecure Direct Object Reference** | `?user_id=2` en request de otro usuario                             | Ver [[BOLA - IDOR]] para detalle.                                           |
| **Password spraying**               | Lista de users comunes + 1 password común                           | Evita lockouts individuales, efectivo en AD y SaaS.                         |

## Flujo de testing

```bash
# 1. Username enum (timing differ)
ffuf -w users.txt -X POST -u https://target/login -d 'user=FUZZ&pass=x' \
     -o enum.json -of json

# 2. Default creds primero
hydra -L common-users.txt -P common-pass.txt target https-post-form \
      "/login:user=^USER^&pass=^PASS^:F=Invalid"

# 3. SQLi en login
sqlmap -u "https://target/login" --data="user=admin&pass=admin" \
       --level 5 --risk 3 --forms

# 4. JWT analysis
jwt_tool <token> -S  # scan
jwt_tool <token> -X a  # alg none
jwt_tool <token> -X k -pk public.pem  # key confusion

# 5. Forced browsing
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
     -u https://target/FUZZ -fc 301,302,401,403
```

## Overview

El objetivo es **acceder como otro usuario** o **elevar privilegios dentro de la misma cuenta**. Agrupa fallas de autenticación (¿quién sos?) y autorización (¿qué podés hacer?).

### Orden de prioridad en un engagement

1. **Recon de usuarios** antes de tocar passwords — si hay username enum, brute force se vuelve dirigido.
2. **Default creds y weak passwords** — 5 min de trabajo, ROI alto.
3. **Logic flaws en flows de reset/2FA/OAuth** — suelen pasar tests automáticos.
4. **JWT/Session issues** — audita tokens, no solo tráfico.
5. **IDOR / Mass Assignment** una vez dentro — autorización granular falla más que la auth inicial.

### Headers que afectan auth

| Header               | Abuso típico                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `X-Forwarded-For`    | Bypass de IP allowlisting                                        |
| `X-Original-URL`     | Bypass de path-based middleware                                  |
| `X-Rewrite-URL`      | Mismo concepto                                                   |
| `X-Forwarded-Host`   | Host header injection en password reset                          |
| `Host`               | Cache poisoning, password reset hijack                           |
| `Referer`            | Algunos sistemas lo usan para CSRF protection (bypasseable)      |
| `Origin`             | CORS misconfig leads to auth info leak                           |

## Notas relacionadas

- [[BOLA - IDOR]] — bypass de authorization a nivel de objeto.
- [[Cross-Site Request Forgery (CSRF)]] — autenticación válida forzada por atacante.
- [[Session Hijacking XSS]] — robo de sesión post-auth.
- [[JWT]] — tokens específicos, vectores propios.

***
