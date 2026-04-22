---
aliases:
  - Linux PrivEsc
  - LPE
tags:
  - type/moc
  - env/linux
  - technique/privilege-escalation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Privilege Escalation]]"
type: MOC
linked:
  - "[[Linux PrivEsc - SUID y SGID]]"
  - "[[Linux PrivEsc - Cron Jobs]]"
  - "[[Linux PrivEsc - PATH Hijacking]]"
  - "[[Linux PrivEsc - Abusing Sudoers]]"
  - "[[PrivEsc Enumeration Tools]]"
  - "[[Pivoting & Port Forwarding]]"
  - "[[john]]"
  - "[[hashcat]]"
---
# Linux Privilege Escalation

***

## Cheatsheet

````tabs
tab: **SUID / SGID**
![[Linux PrivEsc - SUID y SGID#^linux-privesc-suid]]

tab: **Cron**
![[Linux PrivEsc - Cron Jobs#^linux-privesc-cron]]

tab: **PATH Hijack**
![[Linux PrivEsc - PATH Hijacking#^linux-privesc-path-hijack]]

tab: **Sudoers**
![[Linux PrivEsc - Abusing Sudoers#^linux-privesc-sudoers]]
````

***

## Overview

Roadmap de vectores de escalada en Linux. Cada sección apunta al concepto y al comando concreto de explotación. Orden sugerido: **enum automatizada → misconfig alto ROI → kernel exploits como último recurso**.

> Regla: antes de ejecutar exploits, leer `sudo -l`, `id`, `uname -a`, `cat /etc/os-release`, `ls -la /root/ 2>/dev/null`.

***

## 1. Enumeración automatizada

- `linpeas.sh` — cobertura integral, colorea vectores por prob. de éxito.
- `linenum.sh` — más ligero, útil en boxes con bajo ruido de detección.
- `lse.sh` — alternativa silenciosa, 3 niveles de verbosidad.
- `pspy64` — monitorea procesos/cron de otros usuarios sin ser root.

## 2. Credenciales y secretos en disco

- History files: `~/.bash_history`, `~/.mysql_history`, `~/.psql_history`, `~/.python_history`, `~/.viminfo`.
- Config files con creds: `/etc/fstab`, `/etc/crontab`, configs en `/opt/`, `.env`, `wp-config.php`, `config.php`.
- Claves SSH expuestas: `~/.ssh/id_*`, `/home/*/.ssh/authorized_keys`.
- Backups mal protegidos: `/tmp/*.bak`, `/var/backups/*`, `.tar.gz` en home.
- Memoria de procesos: `/proc/*/cmdline` para creds pasadas por args.

## 3. Abuso de `sudo`

- `sudo -l` sin password requerido — ejecutar lo permitido vía [GTFOBins](https://gtfobins.github.io/).
- `LD_PRELOAD` / `LD_LIBRARY_PATH` preservadas en `env_keep` → shared object malicioso.
- `sudoedit` con wildcard / bug de parsing (CVE-2023-22809, CVE-2021-3156 Baron Samedit).
- Sudo version antigua (`sudo -V`) → check Sudo exploits 1.8.x / 1.9.x.

## 4. Binarios SUID / SGID

- `find / -perm -4000 -type f 2>/dev/null` → listar SUID.
- Match contra GTFOBins para shell-escape.
- Binarios custom SUID → revisar con `strings` / `ltrace` / `strace` buscando llamadas a comandos relativos (PATH hijack).
- Capabilities: `getcap -r / 2>/dev/null` — `cap_setuid+ep` en python/perl = root directo.

## 5. Cron y tareas programadas

- `/etc/crontab`, `/etc/cron.*/`, `/var/spool/cron/crontabs/*`.
- Scripts cron con permisos de escritura → sobrescribir → esperar ejecución.
- Wildcard injection en cron (`tar *`, `chown *`) → GTFOBins wildcard tricks.
- `pspy64` detecta cron jobs ocultos no visibles al usuario.

## 6. PATH hijacking

- Binarios SUID que invocan comandos sin path absoluto.
- Crear binario malicioso, prepend a `$PATH`, ejecutar el SUID.
- Relative path en scripts shell ejecutados por root.

## 7. Servicios mal configurados

- Servicios systemd escribibles: `/etc/systemd/system/*.service`, unit file editable → `ExecStart=/bin/bash -c "..."`.
- D-Bus misconfigurations.
- MySQL/PostgreSQL/Redis corriendo como root → UDF exploit / `COPY FROM PROGRAM`.
- Docker group membership = root equivalente (`docker run -v /:/mnt -it alpine chroot /mnt`).
- LXD/LXC group → container con host mount.

## 8. Kernel exploits

- `uname -a` + `cat /etc/os-release` → Searchsploit / Linux Exploit Suggester 2.
- CVEs históricos: DirtyCOW (2016), DirtyPipe (CVE-2022-0847), Sequoia (CVE-2021-33909), PwnKit (CVE-2021-4034), Looney Tunables (CVE-2023-4911), nf_tables (CVE-2024-1086).
- Último recurso: crashea boxes, alerta EDRs.

## 9. NFS misconfig

- `showmount -e target` → mounts con `no_root_squash`.
- Montar desde atacante, crear binario SUID como root, ejecutar en víctima.

## 10. Permisos FS en archivos críticos

- `/etc/passwd` escribible → añadir user con UID 0.
- `/etc/shadow` legible → `john` / `hashcat`.
- `/etc/sudoers` o `/etc/sudoers.d/*` escribible.
- Backups de estos files sin proteger (`passwd-`, `shadow-`).

***

## Checklist de triage inicial

```bash
id
sudo -l
uname -a
cat /etc/os-release
ls -la /home/
ls -la /root/ 2>/dev/null
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
getcap -r / 2>/dev/null
cat /etc/crontab
ls -la /etc/cron.*/
ps auxf | grep root
netstat -tulnp 2>/dev/null || ss -tulnp
```

***

## Recursos

- [GTFOBins](https://gtfobins.github.io/) — lookup de shell-escapes por binario.
- [HackTricks - Linux PrivEsc](https://book.hacktricks.xyz/linux-hardening/privilege-escalation) — referencia exhaustiva.
- [PayloadsAllTheThings - Linux Priv Esc](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Linux%20-%20Privilege%20Escalation.md).

***
