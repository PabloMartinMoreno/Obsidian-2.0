---
aliases:
tags:
  - technique/recon/active
  - asset/web-app
kind: SubCheatSheet
linked:
  - "[[curl]]"
---
# Curl - Enumeración de Sub-Dominios y V.Host

***

## Cheatsheet

| **Acción**                                                                            | **Descripción**                                                                                                                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`curl -s -H "Host: nonexistant.<target>"<IP>:<port> \| wc -c`</code></pre> | <br>Determina el recuento de caracteres de una página "sin host" para filtrar resultados erróneos durante el fuzzing de V-Host (hosts virtuales). |
^curl-enum-subdominios-vhost


***
