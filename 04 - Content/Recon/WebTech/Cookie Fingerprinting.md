---
aliases:
  - Cookie Fingerprint
  - Session Cookie Fingerprinting
tags:
  - technique/recon/passive
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[Web Fingerprinting]]"
  - "[[HTTP - Cookies y Sesiones]]"
  - "[[Curl - Fingerprinting]]"
---
# Cookie Fingerprinting

El nombre de la **cookie de sesión** que setea la app delata el lenguaje/framework del backend. Señal **pasiva** — aparece en el primer `Set-Cookie`. Verla con `curl -sI <URL> \| grep -i set-cookie` (ver [[Curl - Fingerprinting]]).

| **Cookie** | **Tecnología** |
|---|---|
| `PHPSESSID` | PHP |
| `JSESSIONID` | Java (Tomcat / JBoss) |
| `ASP.NET_SessionId`, `ASPSESSIONID...` | ASP.NET / IIS |
| `connect.sid` | Node.js (Express) |
| `_session_id` | Ruby on Rails |
| `laravel_session`, `XSRF-TOKEN` | Laravel (PHP) |
| `csrftoken` + `sessionid` | Django (Python) |
| `CAKEPHP` | CakePHP |
| `symfony` | Symfony (PHP) |
| `wordpress_*`, `wp-settings-*` | WordPress |

^cookie-fp

---

## Notas relacionadas
- [[Web Fingerprinting]] · [[HTTP - Cookies y Sesiones]] · [[Web Enumeración]]
