---
aliases:
  - chmod
tags:
  - tool/chmod
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# Comando `chmod`

> [!info] chmod (**ch**ange **mod**e)
> Cambia los permisos de acceso de archivos y directorios. Sintaxis: `chmod [opciones] modo archivo`. El `modo` es **simbólico** (`u+x`) o **numérico octal** (`755`). Ver [[Permisos]].
^definicion

---

## Cheatsheet

| Comando | Qué hace | Cuándo |
|---|---|---|
| `chmod +x script.sh` | Hace ejecutable | Correr un script |
| `chmod 600 id_rsa` | Solo dueño rw | Claves privadas SSH |
| `chmod 644 file` | Dueño rw, resto solo r | Archivos normales |
| `chmod 755 dir` | Dueño rwx, resto rx | Directorios y binarios |
| `chmod 700 ~/.ssh` | Solo dueño rwx | Privado |
| `chmod -R 755 dir/` | Recursivo en el árbol | Carpetas con subdirectorios |
| `chmod u+s binario` | Activa el bit **SUID** | Ver [[Linux PrivEsc - SUID y SGID]] |
^chmod-cheatsheet

---

## Modo Simbólico

| Componente | Valores |
|---|---|
| **Destinatario** | `u` usuario/dueño · `g` grupo · `o` otros · `a` todos (=`ugo`) |
| **Operador** | `+` agregar · `-` quitar · `=` establecer exacto |
| **Permiso** | `r` lectura · `w` escritura · `x` ejecución |

```bash
chmod u+r archivo      # agrega lectura al dueño
chmod go-w archivo     # quita escritura a grupo y otros
chmod a+x archivo      # ejecución a todos
chmod u+x,go-w archivo # combinar con coma
```

---

## Modo Numérico (octal)

`4` lectura · `2` escritura · `1` ejecución → se **suman** por cada terna (dueño / grupo / otros).

| Octal | Permisos | Uso típico |
|---|---|---|
| `644` | `rw- r-- r--` | Archivos |
| `755` | `rwx r-x r-x` | Directorios, binarios |
| `600` | `rw- --- ---` | Claves privadas |
| `700` | `rwx --- ---` | Privado |
| `777` | `rwx rwx rwx` | Todo (peligroso) |

**Bits especiales** (cuarto dígito, antepuesto): `4000` SUID · `2000` SGID · `1000` sticky. Ej: `chmod 4755 binario` (SUID + 755).

---

## Permisos Especiales

- [[Linux PrivEsc - SUID y SGID]]
- [[Sticky Bit]]

## Referencia

- [chmod — IONOS](https://www.ionos.es/digitalguide/servidores/know-how/asignacion-de-permisos-de-acceso-con-chmod/)
