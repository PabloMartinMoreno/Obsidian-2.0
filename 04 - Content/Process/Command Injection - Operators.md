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
  - "[[Command Injection - Bypass de Espacios]]"
---
# Command Injection - Operators

***

## Cheatsheet

### Operadores Generales

| Operador           |            Carácter            |            URL Encoded            | Comportamiento de Ejecución | Notas                                                                             |
| :----------------- | :----------------------------: | :-------------------------------: | :-------------------------- | :-------------------------------------------------------------------------------- |
| <br>**Semicolon**  |   <pre><code>;</code></pre>    |    <pre><code>%3b</code></pre>    | <br>Ejecuta **Ambos**       | Secuencial (primero uno, luego el otro).                                          |
| <br>**New Line**   |   <pre><code>\n</code></pre>   |    <pre><code>%0a</code></pre>    | <br>Ejecuta **Ambos**       | Simula presionar Enter.                                                           |
| <br>**Background** |   <pre><code>&</code></pre>    |    <pre><code>%26</code></pre>    | <br>Ejecuta **Ambos**       | Ejecuta el comando en segundo plano (background).                                 |
| <br><br>**Pipe**   | <br><pre><code>\|</code></pre> |  <br><pre><code>%7c</code></pre>  | <br><br>Ejecuta **Ambos**   | Pasa la salida del 1º como entrada del 2º (Usualmente solo ves la salida del 2º). |
| <br>**AND**        |   <pre><code>&&</code></pre>   |  <pre><code>%26%26</code></pre>   | <br>**Condicional**         | Ejecuta el 2º **solo si** el 1º tiene éxito.                                      |
| <br>**OR**         |  <pre><code>\|\|</code></pre>  |  <pre><code>%7c%7c</code></pre>   | <br>**Condicional**         | Ejecuta el 2º **solo si** el 1º falla (error).                                    |
| <br>**Sub-Shell**  |   <pre><code>`</code></pre>    |  <pre><code>>%60%60</code></pre>  | <br>Ejecuta **Ambos**       | **Sólo Linux**. Ejecuta el contenido entre comillas primero.                      |
| <br>**Sub-Shell**  |  <pre><code>$()</code></pre>   | <pre><code>%24%28%29</code></pre> | <br>Ejecuta **Ambos**       | **Sólo Linux**. Igual que las backticks.                                          |

> [!WARNING] Excepción en Windows
> El operador de punto y coma (`;`) **NO funcionará** si el servidor backend está usando **Windows CMD**. 
> Sin embargo, **SÍ funcionará** si el backend usa **PowerShell**.

> [!TIP] Truco para CTFs
> El operador `||` es excelente para obtener una salida "limpia". Si omites el argumento esperado (ej: no pones la IP) y empiezas directo con `||`, el primer comando fallará y solo verás tu inyección.

### Operadores Especificos

| Tipo de Inyección            | Operadores Comunes                                          |
| :--------------------------- | :---------------------------------------------------------- |
| <br>**SQL Injection**        | <pre><code>' , ; -- /* */</code></pre>                      |
| <br>**Command Injection**    | <pre><code>;&&</code></pre>                                 |
| <br>**OS Command Injection** | <pre><code>;&\|</code></pre>                                |
| <br>**LDAP Injection**       | <pre><code>* ( ) & \|</code></pre>                          |
| <br>**XPath Injection**      | <pre><code>' or and not substring concat count</code></pre> |
| <br>**Code Injection**       | <pre><code>' ; -- /* */ $() ${} #{} %{} ^</code></pre>      |
| <br>**Directory Traversal**  | <pre><code>../ ..\\ %00</code></pre>                        |
| <br>**Object Injection**     | <pre><code>; & \|</code></pre>                              |
| <br>**XQuery Injection**     | <pre><code>`'` `;` `--` `/* */`</code></pre>                |
| <br>**Shellcode Injection**  | <pre><code>\x \u %u %n</code></pre>                         |
| <br>**Header Injection**     | <pre><code>\n \r\n \t %0d %0a %09</code></pre>              |


---
