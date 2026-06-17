---
aliases:
  - cut
tags:
  - tool/cut
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[awk]]"
  - "[[grep]]"
  - "[[Common Linux Utilities]]"
---
# Comando `cut`

> [!info] cut
> Extrae **columnas** (campos) o rangos de caracteres de cada línea. Más simple y rápido que [[awk]] para cortes fijos. Sintaxis: `cut [opciones] [archivo]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `cut -d':' -f1 /etc/passwd` | Campo 1 (usuarios), separador `:` | Parseo de archivos delimitados |
| `cut -d':' -f1,3 /etc/passwd` | Campos 1 y 3 | Varias columnas |
| `cut -d',' -f2- file.csv` | Del campo 2 al final | CSV |
| `cut -c1-10 file` | Caracteres 1 a 10 | Cortar por posición fija |
| `ss -tnp \| cut -d' ' -f5` | Aislar una columna de una salida | Pipe rápido |
| `cut -d'/' -f3 <<< 'http://a.com/x'` | Tercer campo por `/` | Sacar host de URL |
^cut-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-d C` | Delimitador de campo (default: TAB) |
| `-f N` | Campo(s): `1`, `1,3`, `2-`, `-3` |
| `-c N` | Por posición de **carácter** (`1-10`, `5-`) |
| `--complement` | Todo **menos** los campos indicados |

> Limitación: `cut -d' '` no colapsa espacios múltiples (a diferencia de [[awk]], que sí). Para columnas con whitespace variable, usar awk.
^cut-opciones
