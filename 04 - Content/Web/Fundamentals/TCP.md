---
aliases:
  - Protocolo TCP
  - Transmission Control Protocol
  - Three-Way Handshake
tags:
  - service/tcp
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[DNS]]"
---
# TCP: Transmission Control Protocol

Protocolo de **transporte orientado a conexión** y **confiable**: garantiza que los bytes lleguen completos, en orden y sin duplicados. Es la capa sobre la que viaja HTTP/HTTPS (puerto 80/443), SSH (22), SMTP (25) y la mayoría de los servicios. Contraparte: **UDP** (sin conexión, sin garantías — DNS, VoIP).

---

## Three-Way Handshake

Antes de transferir datos, cliente y servidor abren la conexión con un saludo de 3 pasos:

```
Cliente  ── SYN ──────────▶  Servidor    (1) quiero conectar, seq=x
Cliente  ◀──── SYN-ACK ───  Servidor    (2) ok, seq=y, ack=x+1
Cliente  ── ACK ──────────▶  Servidor    (3) confirmado, ack=y+1
                                          → tubería abierta
```

Cierre ordenado: `FIN` / `FIN-ACK` / `ACK` (o `RST` para corte abrupto).

^tcp-handshake

> [!tip] Recon
> El handshake es la base de un SYN scan (`nmap -sS`): se manda `SYN`, si vuelve `SYN-ACK` el puerto está **abierto**, si vuelve `RST` está **cerrado** — sin completar la conexión (stealth).

---

## Por qué importa en web

- HTTP/HTTPS dependen de una conexión TCP abierta (handshake) **antes** de mandar la request — ver [[Flujo de Comunicación HTTP]].
- HTTPS suma el handshake **TLS** encima del TCP — ver [[HTTPS]].
- Latencia: cada conexión nueva paga el RTT del handshake (de ahí keep-alive y HTTP/2 multiplexing).

---

## Notas relacionadas
- [[HTTP]] · [[HTTPS]] · [[DNS]] · [[Flujo de Comunicación HTTP]]
