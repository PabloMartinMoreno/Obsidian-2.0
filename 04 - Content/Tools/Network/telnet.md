---
aliases:
  - "Telnet Exploitation"
tags:
  - technique/recon/active
  - asset/network
  - tool/telnet
  - service/telnet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Service Exploitation]]"
kind: Tool
---
# telnet

> [!info]
> Cliente Telnet (cleartext, deprecated pero presente). En pentest: banner grab, interacción manual con servicios TCP (SMTP, HTTP, POP3), CLI directa a equipos legacy.

---

## Uso

```bash
# Conexión básica
telnet <target> 23

# Banner grab cualquier servicio TCP
telnet <target> 25         # SMTP
telnet <target> 80         # HTTP
telnet <target> 110        # POP3
telnet <target> 6379       # Redis
```

---

## SMTP via telnet (manual)

```
telnet target 25
> HELO attacker.com
> MAIL FROM:<test@attacker.com>
> RCPT TO:<victim@target.com>
> DATA
Subject: test

body
.
> QUIT
```

Ver [[SMTP (25,465,587) - Enumeración]].

---

## HTTP via telnet

```
telnet target 80
> GET / HTTP/1.1
> Host: target
> 
(double newline)
```

---

## Notas Relacionadas

- [[nc]]
- [[ncat]]
- [[FTP (21) - Enumeración]]
- [[SMTP (25,465,587) - Enumeración]]
