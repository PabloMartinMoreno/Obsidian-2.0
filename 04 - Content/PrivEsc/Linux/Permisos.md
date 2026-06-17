---
aliases:
  - Permisos
  - Sticky Bit
  - Permisos Linux
  - Permisos Especiales
tags:
  - env/linux
  - topic/permissions
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Linux Post-Explotación]]"
kind: Concept
linked:
  - "[[chmod]]"
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# Permisos (Linux)

> [!info] Overview
> Cada archivo/directorio tiene permisos para **3 destinatarios** (dueño, grupo, otros) × **3 acciones** (lectura, escritura, ejecución). Se ven con `ls -l` y se cambian con [[chmod]]. Entenderlos es base de la escalada de privilegios en Linux.

---

## Leer `ls -l`

```
-rwxr-xr--  1 root  dev  ...  archivo
└┬┘└┬┘└┬┘└┬┘
 │  │  │  └── otros: r-- (solo lectura)
 │  │  └───── grupo: r-x (lectura + ejecución)
 │  └──────── dueño: rwx (todo)
 └─────────── tipo: - archivo, d directorio, l symlink
```

---

## Triada r/w/x

| **Permiso** | **En archivo** | **En directorio** |
|---|---|---|
| `r` (4) | Leer el contenido | Listar los archivos (`ls`) |
| `w` (2) | Modificar el contenido | Crear/borrar archivos dentro |
| `x` (1) | Ejecutarlo | Entrar (`cd`) / atravesarlo |

## Octal

Se **suman** por terna (dueño / grupo / otros): `r=4 w=2 x=1`.

| **Octal** | **Símbolo** | **Uso** |
|---|---|---|
| `644` | `rw- r-- r--` | Archivos |
| `755` | `rwx r-x r-x` | Directorios, binarios |
| `600` | `rw- --- ---` | Claves privadas |
| `777` | `rwx rwx rwx` | Todo (peligroso) |

---

## Permisos Especiales

Cuarto dígito octal antepuesto (ej. `chmod 4755`):

| **Bit** | **Octal** | **Se ve como** | **Qué hace** |
|---|---|---|---|
| **SUID** | `4000` | `s` en la `x` del **dueño** (`-rwsr-xr-x`) | El ejecutable corre con privilegios del **dueño** (no del que lo ejecuta). Vector de privesc → [[Linux PrivEsc - SUID y SGID]] |
| **SGID** | `2000` | `s` en la `x` del **grupo** | Corre con privilegios del **grupo**; en directorios, los archivos nuevos heredan el grupo |
| **Sticky Bit** | `1000` | `t` en la `x` de **otros** (`drwxrwxrwt`) | En directorios compartidos (ej. `/tmp`): solo el **dueño** de cada archivo puede borrarlo, aunque otros tengan `w` |

```bash
ls -l /usr/bin/passwd   # -rwsr-xr-x → SUID
ls -ld /tmp             # drwxrwxrwt → sticky bit
find / -perm -4000 -type f 2>/dev/null   # enumerar SUID
```

> Mayúscula `S`/`T` (en vez de `s`/`t`) = el bit especial está seteado pero **falta** el `x` subyacente.

---

## Relacionadas

- [[chmod]] — cambiar permisos
- [[Linux PrivEsc - SUID y SGID]] — explotación de SUID/SGID
