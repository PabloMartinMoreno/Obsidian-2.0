---
aliases:
  - Curl Fingerprinting
  - Curl Headers Fingerprint
tags:
  - tool/curl
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
kind: SubCheatSheet
linked:
  - "[[curl]]"
  - "[[Web Fingerprinting]]"
---
# Curl - Fingerprinting

---

## Inspección de Headers

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -sI <URL>` | Todos los response headers | Base del fingerprint pasivo |
| `curl -sI <URL> \| grep -i ^server` | `Server: Apache/2.4.x` → software + versión | Identificar el webserver |
| `curl -sI <URL> \| grep -i x-powered-by` | `X-Powered-By: PHP/8.1` → lenguaje backend | Backend lang |
| `curl -sI <URL> \| grep -i x-aspnet` | `X-AspNet-Version` / `X-AspNetMvc-Version` → .NET | Stack Microsoft |
| `curl -sI <URL> \| grep -i x-generator` | Generador (Drupal, etc.) → CMS | CMS |
| `curl -sI <URL> \| grep -i 'via\|x-cache\|cf-ray'` | Proxy/CDN (Varnish, Cloudflare) | Infra intermedia |
| `curl -sI <URL> \| grep -i set-cookie` | Cookie de sesión → tecnología | Inferir lenguaje por la cookie |

^curl-fp-headers

---

## Error Pages & Version Disclosure

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -s <URL>/noexiste-$RANDOM` | 404 default → server/framework | Provocar error |
| `curl -s "<URL>/?id='"` | Stack trace / error de DB → lenguaje + DB | Forzar excepción |
| `curl -s <URL>/readme.html` · `/license.txt` · `/CHANGELOG.txt` | Versión del CMS | CMS version (WordPress/Drupal) |
| `curl -sI <URL>/x.php` vs `.aspx` vs `.jsp` | Qué extensión responde 200 | Inferir el lenguaje |

^curl-fp-errors

---

## Notas relacionadas
- [[curl]] · [[Web Fingerprinting]] · [[HTTP - Headers]]
