---
aliases:
tags:
  - tool/md5sum
  - env/linux
  - topic/forensics
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---
# md5sum

> [!info] md5sum (**M**essage **D**igest **5** check**sum**)
> Calcula/verifica un hash MD5 (128 bits, 32 hex). El hash es **único** por contenido (un byte distinto → hash totalmente distinto) y **unidireccional** (no se revierte al original). No modifica el archivo.

> [!warning] MD5 está roto para seguridad
> Vulnerable a colisiones (2 entradas → mismo hash). Sirve para **integridad de archivos no sensibles** (descargas, transferencias, backups, detectar duplicados), **no** para criptografía. Usar **SHA-256** (`sha256sum`) para seguridad.
^definicion

---

## Cheatsheet

| **Comando** | **Qué hace** |
|---|---|
| `md5sum archivo` | Hash del archivo |
| `md5sum a.bin b.bin c.bin` | Hash de varios → comparar para detectar **duplicados** |
| `echo -n "texto" \| md5sum` | Hash de un string (`-n` evita el `\n` de echo) |
| `md5sum archivo > archivo.md5` | Guarda el hash |
| `md5sum -c archivo.md5` | **Verifica** que el archivo coincida con el hash guardado |
| `split -b 500M big.iso parte_ && md5sum parte_*` | Hash por partes de un archivo grande |
^md5-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-c` | Verifica hashes desde un archivo `.md5` |
| `-b` | Trata la entrada como binaria |
| `-t` | Trata la entrada como texto (default en Unix) |

> Flujo de verificación de transferencia: en origen `md5sum file > file.md5`; en destino `md5sum -c file.md5`. Si coincide, el archivo llegó íntegro.
^md5-verify
