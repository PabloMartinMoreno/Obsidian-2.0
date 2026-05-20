---
aliases: null
tags:
  - type/technique
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Operadores Generales

***

## Cheatsheet

|    **Operador**    |         **Carácter**         |          **URL Encoded**          | **Comportamiento de Ejecución** |                                       **Notas**                                       |
|:------------------:|:----------------------------:|:---------------------------------:|:-------------------------------:|:-------------------------------------------------------------------------------------:|
| <br>**Semicolon**  |  <pre><code>;</code></pre>   |    <pre><code>%3b</code></pre>    |      <br>Ejecuta **Ambos**      |                     <br>Secuencial (primero uno, luego el otro).                      |
|  <br>**New Line**  |  <pre><code>\n</code></pre>  |    <pre><code>%0a</code></pre>    |      <br>Ejecuta **Ambos**      |                              <br>Simula presionar Enter.                              |
| <br>**Background** |  <pre><code>&</code></pre>   |    <pre><code>%26</code></pre>    |      <br>Ejecuta **Ambos**      |                 <br>Ejecuta el comando en segundo plano (background).                 |
|    <br>**Pipe**    |  <pre><code>\|</code></pre>  |    <pre><code>%7c</code></pre>    |      <br>Ejecuta **Ambos**      | <br>Pasa la salida del 1º como entrada del 2º (Usualmente solo ves la salida del 2º). |
|    <br>**AND**     |  <pre><code>&&</code></pre>  |  <pre><code>%26%26</code></pre>   |       <br>**Condicional**       |                   <br>Ejecuta el 2º **solo si** el 1º tiene éxito.                    |
|     <br>**OR**     | <pre><code>\|\|</code></pre> |  <pre><code>%7c%7c</code></pre>   |       <br>**Condicional**       |                  <br>Ejecuta el 2º **solo si** el 1º falla (error).                   |
| <br>**Sub-Shell**  |  <pre><code>`</code></pre>   |  <pre><code>>%60%60</code></pre>  |      <br>Ejecuta **Ambos**      |           <br>**Sólo Linux**. Ejecuta el contenido entre comillas primero.            |
| <br>**Sub-Shell**  | <pre><code>$()</code></pre>  | <pre><code>%24%28%29</code></pre> |      <br>Ejecuta **Ambos**      |                     <br>**Sólo Linux**. Igual que las backticks.                      |
^ci-operadores-generales

> [!WARNING] Excepción en Windows
> El operador de punto y coma (`;`) **NO funcionará** si el servidor backend está usando **Windows CMD**. 
> Sin embargo, **SÍ funcionará** si el backend usa **PowerShell**.

> [!TIP] Truco para CTFs
> El operador `||` es excelente para obtener una salida "limpia". Si omites el argumento esperado (ej: no pones la IP) y empiezas directo con `||`, el primer comando fallará y solo verás tu inyección.


---
