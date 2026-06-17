---
aliases:
tags:
  - env/linux
  - technique/discovery
  - tool/find
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# Comando `find`

> [!info] find
> Busca archivos y directorios por nombre, tipo, tamaño, permisos, fecha, dueño, etc. Sintaxis: `find [directorio] [criterios] [acción]`. Sin directorio, busca desde el actual. Herramienta core de enumeración Linux.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `find / -perm -4000 -type f 2>/dev/null` | Todos los SUID binaries | [[Linux PrivEsc - SUID y SGID]] |
| `find / -perm -2000 -type f 2>/dev/null` | Todos los SGID | Idem |
| `find / -writable -type d 2>/dev/null` | Directorios world-writable | Drop point para exploits |
| `find / -name "*.conf" -readable 2>/dev/null` | Configs leíbles | Hunt credentials |
| `find /home -name ".ssh" -type d 2>/dev/null` | SSH dirs | Cred reuse, key theft |
| `find / -name "id_rsa" 2>/dev/null` | SSH private keys | Cred theft |
| `find / -mtime -1 -type f 2>/dev/null` | Modificados últimas 24h | Recent activity |
| `find / -size +100M 2>/dev/null` | Archivos > 100MB | Backups, dumps |
| `find / -name "*.bak" 2>/dev/null` | Backup files | Source / config leaks |
| `find / -name "*.log" -exec rm {} \;` | Buscar + ejecutar acción | Borrado masivo / -exec |
^find-cheatsheet

---

## Criterios

| **Flag** | **Filtra por** |
|---|---|
| `-name "*.txt"` | Nombre (glob) |
| `-type f` / `-type d` | Tipo: archivo regular / directorio |
| `-size +1M` | Tamaño (ver abajo) |
| `-perm 644` | Permisos (ver abajo) |
| `-mtime -30` | Modificado hace < 30 días |
| `-newermt 2020-03-03` | Modificado después de fecha (`! -newermt` = antes) |
| `-user root` / `-group X` | Dueño / grupo |
| `-writable` / `-readable` | Permiso del usuario actual |
| `-depth N` / `-maxdepth N` | Profundidad |
| `-exec cmd {} \;` | Ejecuta un comando por match (`{}` = el archivo) |

### `-size` (sufijos)

`c` bytes · `k` KB · `M` MB · `G` GB. Prefijo `+` (mayor), `-` (menor), nada (exacto).

```bash
find / -size 100c           # exactamente 100 bytes
find / -size +1M            # > 1 MB
find / -size +500k -size -1M  # entre 500KB y 1MB (rango)
find / -type f -name '*.conf' -size +25k -size -28k -newermt 2020-03-03 2>/dev/null
```

### `-perm` (modos)

| **Sintaxis** | **Matchea** |
|---|---|
| `-perm 0755` | Permisos **exactos** |
| `-perm -u=rwx` | **Al menos** esos bits (`-` antepuesto) |
| `-perm /u=rwx` | **Cualquiera** de esos bits (`/` antepuesto) |
| `! -perm -u=r` | Que **no** tenga ese permiso |

---

> Para **enumerar** SUID: `find / -perm -4000 -type f 2>/dev/null`. La **explotación** (GTFOBins, `find -exec -p`, etc.) vive en [[Linux PrivEsc - SUID y SGID]] — no se repite acá.

---

## Notas Relacionadas

- [[Linux PrivEsc - SUID y SGID]]
- [[Linux Privilege Escalation]]
- [[grep]]
