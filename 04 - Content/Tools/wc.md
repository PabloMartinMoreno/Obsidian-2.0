---
aliases:
  - wc
tags:
  - tool/wc
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[grep]]"
  - "[[Common Linux Utilities]]"
---
# Comando `wc`

> [!info] wc (**w**ord **c**ount)
> Cuenta líneas, palabras y bytes de un archivo o stdin. El uso más común es `-l` (contar **líneas**). Sintaxis: `wc [opciones] [archivo]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `wc -l file` | Número de líneas | Tamaño de wordlist / logs |
| `cat file \| wc -l` | Líneas de un stream | Contar resultados de un pipe |
| `grep -c` vs `wc -l` | Conteo | `grep -c` cuenta matches; `wc -l` cuenta líneas totales |
| `wc -w file` | Número de palabras | Análisis de texto |
| `wc -c file` | Número de **bytes** | Tamaño exacto |
| `wc -L file` | Largo de la línea más larga | Detectar líneas anómalas |
| `ls /dir \| wc -l` | Cantidad de archivos | Inventario rápido |
^wc-cheatsheet

---

## Opciones

| **Flag** | **Qué cuenta** |
|---|---|
| `-l` | Líneas |
| `-w` | Palabras |
| `-c` | Bytes |
| `-m` | Caracteres (multibyte) |
| `-L` | Largo de la línea más larga |

> Para contar **coincidencias** de un patrón usar `grep -c` ([[grep]]); `wc -l` cuenta líneas, no matches dentro de una línea.
^wc-opciones
