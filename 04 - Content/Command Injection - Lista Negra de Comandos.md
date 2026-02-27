---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Lista Negra de Comandos (Obfuscation)

***

## Cheatsheet

| **Entorno**     | **Técnica**              | **Carácter**                | **Ejemplo (whoami)**               | **Notas / Restricciones**                                             |
| --------------- | ------------------------ | --------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| <br>**Ambos**   | <br>**Comillas Simples** | <pre><code>'</code></pre>   | <pre><code>w'h'o'am'i</code></pre> | Deben ir en **pares** (número par). No se pueden mezclar con dobles.  |
| <br>**Ambos**   | <br>**Comillas Dobles**  | <pre><code>"</code></pre>   | <pre><code>w"h"o"am"i</code></pre> | Deben ir en **pares** (número par). No se pueden mezclar con simples. |
| <br>**Linux**   | <br>**Backslash**        | <pre><code>`\`</code></pre> | <pre><code>w\ho\am\i</code></pre>  | La shell ignora la barra invertida dentro del comando.                |
| <br>**Linux**   | <br>**Positional Param** | <pre><code>$@</code></pre>  | <pre><code>who$@ami</code></pre>   | Bash trata `$@` como un parámetro vacío, uniendo el comando.          |
| <br>**Windows** | <br>**Caret**            | <pre><code>^</code></pre>   | <pre><code>who^ami</code></pre>    | Símbolo de escape en CMD. Se ignora al procesar el comando.           |
^ci-blacklist-comandos

---

### Explicación del Comportamiento

1. **Concatenación (Quotes):**
    El filtro busca la cadena exacta `whoami`. Al inyectar `w'h'o'am'i`, el filtro ve caracteres basura y lo deja pasar. Sin embargo, la shell (Bash/PowerShell) concatena las cadenas antes de ejecutar, reconstruyendo el comando original.

2. **Caracteres Ignorados (Slash/Caret):**
    Tanto `\` en Linux como `^` en Windows actúan como caracteres de escape o continuación de línea en ciertos contextos. Si se colocan en medio de una cadena sin un carácter especial a continuación, el intérprete simplemente los descarta.

3. **Parámetros Vacíos (`$@`):**
    En Bash, `$@` representa "todos los argumentos". Si no hay argumentos, se expande a una cadena vacía, uniendo eficazmente `who` + `ami`.

> [!TIP] Stackear Técnicas
> Si el filtro es avanzado y bloquea comillas, se puede combinar estas técnicas con las de la nota Bypass de Espacios.
> **Ejemplo:** `127.0.0.1%0aw'h'o'am'i` (Salto de línea + Obfuscación).

## Overview


***

## Notas Relacionadas


***
