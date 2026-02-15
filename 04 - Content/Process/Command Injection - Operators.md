---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# Command Injection - Operators

***
<pre><code></code></pre>
## Cheatsheet

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


---

### 🧪 Ejemplo de uso (Payload Construction)

Si el servidor ejecuta: `ping -c 1 [USER_INPUT]`

**Payload Normal:** `127.0.0.1`
**Payload Malicioso (Pipe):** `127.0.0.1 | whoami`

**Resultado en Backend:**
```bash
ping -c 1 127.0.0.1 | whoami
# El ping se ejecuta, su salida se pasa a whoami, y la web muestra el usuario actual.
```

