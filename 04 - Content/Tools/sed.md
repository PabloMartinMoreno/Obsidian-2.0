---
aliases:
  - sed
tags:
  - tool/sed
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
  - "[[awk]]"
  - "[[Common Linux Utilities]]"
---
# Comando `sed`

> [!info] sed (**S**tream **Ed**itor)
> Edita texto en streaming: aplica transformaciones (sustituir, borrar, insertar) línea por línea. Su fuerte es la **sustitución** `s/regex/reemplazo/`. Sintaxis: `sed [opciones] 'comando' [archivo]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `sed 's/foo/bar/' file` | Reemplaza la **1ª** ocurrencia por línea | Sustitución básica |
| `sed 's/foo/bar/g' file` | Reemplaza **todas** (global) | Reemplazo total |
| `sed -i 's/foo/bar/g' file` | Edita el archivo **in-place** | Modificar sin redirigir |
| `sed -n '5p' file` | Imprime solo la línea 5 | Pinpoint (`-n` + `p`) |
| `sed -n '10,20p' file` | Rango de líneas 10-20 | Extraer bloque |
| `sed '/patrón/d' file` | **Borra** líneas que matchean | Limpiar |
| `sed 's/#.*//' file` | Quita comentarios inline | Limpiar configs |
| `sed 's/.*://' file` | Deja lo que está tras el último `:` | Parseo rápido |
^sed-cheatsheet

---

## Opciones / Sintaxis

| **Elemento** | **Qué hace** |
|---|---|
| `s/a/b/` | Sustituye `a` por `b` |
| `g` (flag) | Global: todas las ocurrencias de la línea |
| `-i` | In-place (modifica el archivo); `-i.bak` hace backup |
| `-n` | No imprime por defecto (usar con `p`) |
| `-E` / `-r` | Regex extendida (ERE) |
| `Np` / `N,Md` | Imprimir línea N / borrar rango N a M |
| `&` (reemplazo) | El texto matcheado |

> Delimitador alternativo si el patrón tiene `/`: `sed 's#/var/www#/srv#g'`. Complementa [[grep]] (filtrar) y [[awk]] (columnas).
^sed-opciones
