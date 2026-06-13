---
aliases:
  - MIME Types
  - Content-Type
tags:
  - service/http
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: SubCheatSheet
linked:
  - "[[HTTP - Headers]]"
  - "[[File Upload - Vulnerabilidades]]"
---
# Web Content Types (MIME)

El header `Content-Type` (request y response) declara el formato del body. El backend suele **rutear el parsing según este valor** → manipularlo habilita bypasses de validación, XXE, deserialización y confusión de parsers.

> Wordlist completa para fuzzing (~2400 tipos): [SecLists — web-all-content-types.txt](https://github.com/danielmiessler/SecLists/raw/master/Discovery/Web-Content/web-all-content-types.txt). Usar con `ffuf -w web-all-content-types.txt -H "Content-Type: FUZZ" ...`.

---

## Relevantes en Pentest

| **MIME** | **Uso legítimo** | **Relevancia ofensiva** |
|:---|:---|:---|
| `text/html` | Páginas HTML | Contexto de reflexión XSS; respuesta servida como HTML. |
| `application/json` | APIs REST | Body de API; cambiar a otro tipo puede saltear validación/CSRF. |
| `application/x-www-form-urlencoded` | Forms clásicos | Default de forms; aceptado donde se espera JSON → CSRF / bypass. |
| `multipart/form-data` | Subida de archivos | Vector de File Upload; manipular `Content-Type` de cada parte. |
| `text/plain` | Texto crudo | Bypass de CSRF preflight (CORS "simple request"). |
| `application/xml`, `text/xml` | SOAP, configs | Habilita [[XML External Entity (XXE)]] si el parser procesa entities. |
| `application/x-yaml` | Configs/APIs | Deserialización insegura (YAML → object injection). |
| `image/png`, `image/jpeg`, `image/gif` | Imágenes | Whitelist de upload → polyglot (magic bytes válidos + payload). |
| `application/octet-stream` | Binario genérico | Fallback que algunos backends procesan sin validar extensión. |
| `application/pdf` | Documentos | SSRF/LFI vía renderers (wkhtmltopdf), XXE en PDFs con XML. |
| `application/x-php`, `application/x-httpd-php` | Scripts PHP | Si el server lo asocia a ejecución → webshell. |
| `text/csv` | Exports | CSV injection (`=cmd|...`) en planillas que abren el export. |

---

## Bypass de Validación de `Content-Type`

| **Técnica** | **Ejemplo** | **Cuándo** |
|:---|:---|:---|
| Cambiar a tipo permitido | `Content-Type: image/png` con body PHP | Whitelist solo chequea el header. |
| Duplicar el header | dos `Content-Type:` (uno válido, uno malicioso) | Parser desync front/back. |
| Case / espacios | `Content-Type: IMAGE/PNG`, `image/png ;` | Validación case-sensitive o por substring. |
| Tipo + charset extra | `application/json; charset=utf-7` | Bypass de filtros + smuggling de encoding. |
| `multipart` con parte mentida | parte con `Content-Type: image/png` y `filename=shell.php` | Validación mira el part header, no el contenido. |

Detalle de upload: [[File Upload - Vulnerabilidades]]. Headers: [[HTTP - Headers]].

---

**Notas relacionadas:**
- [[HTTP - Headers]] · [[File Upload - Vulnerabilidades]] · [[XML External Entity (XXE)]]
