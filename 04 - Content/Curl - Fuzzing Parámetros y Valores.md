---
aliases:
tags:
  - type/sub-command
type: Sub-Command
linked:
  - "[[curl]]"
---
# Curl - Fuzzing Parámetros y Valores

***

## Cheatsheet

| **Acción**                                                                                                                           | **Descripción**                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| <pre><code>`curl -s http://<IP>:<port>/admin.php \| wc -c`</code></pre>                                                              | **(GET)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.  |
| <pre><code>`curl -s http://<IP>:<port>/admin.php -X POST -H "Content-Type: application/x-www-form-urlencoded" \| wc -c`</code></pre> | **(POST)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos. |
^curl-fuzzing-parametros
