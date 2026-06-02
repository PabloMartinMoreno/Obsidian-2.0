---
aliases:
tags:
  - technique/recon/active
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[curl]]"
---
# Curl - Fuzzing Parámetros y Valores

---

## Cheatsheet

| **Acción**                                                                                                                           | **Descripción**                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| <pre><code>`curl -s http://<IP>:<port>/admin.php \| wc -c`</code></pre>                                                              | **(GET)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.  |
| <pre><code>`curl -s http://<IP>:<port>/admin.php -X POST -H "Content-Type: application/x-www-form-urlencoded" \| wc -c`</code></pre> | **(POST)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos. |
^curl-fuzzing-parametros
