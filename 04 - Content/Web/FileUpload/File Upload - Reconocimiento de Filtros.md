---
aliases:
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Reconocimiento de Filtro

***

## Cheatsheet

|           **Vector o Técnica**            |                                        **Descripción y Comportamiento**                                        | **Prueba de Reconocimiento (Síntoma / Resultado)**                                                                                                                                                                            |
|:-----------------------------------------:|:--------------------------------------------------------------------------------------------------------------:| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      <br><br>**Política: Blacklist**      |          <br><br>Bloquea explícitamente extensiones consideradas peligrosas (`.php`, `.exe`, `.jsp`).          | <br>_Prueba:_ Subir un archivo con extensión inventada (`.hack`).<br><br>_Resultado:_ Si el archivo **se sube con éxito**, el servidor usa Blacklist (deja pasar lo que no conoce).<br><br>                                   |
|      <br><br>**Política: Whitelist**      |         <br><br>Solo permite una lista estricta de extensiones seguras predefinidas (`.jpg`, `.pdf`).          | <br>_Prueba:_ Subir un archivo con extensión inventada (`.hack`).<br><br>_Resultado:_ Si el archivo **es rechazado** (suele dar un error genérico como "Invalid file type"), usa Whitelist.<br><br>                           |
| <br><br>**Mecanismo: Parseo del Nombre**  |        <br><br>Define qué parte del string el servidor considera como la verdadera extensión a evaluar.        | <br>_Prueba:_ Subir `file.php.jpg` y luego `file.jpg.php`.<br><br>_Resultado:_ Si acepta el primero, valida solo la **última** extensión. Si rechaza ambos o el primero, valida la **primera** o usa Regex estricta.<br><br>  |
|   <br><br>**Validación: Content-Type**    |             <br><br>El backend confía en la cabecera HTTP `Content-Type` enviada por el navegador.             | <br>_Prueba:_ Subir `shell.php`, interceptar la petición y cambiar el `Content-Type` a `image/jpeg`.<br><br>_Resultado:_ Si el archivo sube, la validación era superficial y solo dependía de la cabecera HTTP.<br><br>       |
|    <br><br>**Validación: Magic Bytes**    |       <br><br>El servidor lee los primeros bytes hexadecimales del archivo para comprobar su tipo real.        | <br>_Prueba:_ Subir `shell.php` (falla). Luego subir el mismo archivo pero escribiendo `GIF89a;` en la primera línea.<br><br>_Resultado:_ Si el archivo ahora sube, el servidor está validando las firmas de archivo.<br><br> |
| <br><br>**Inspección de Contenido (WAF)** | <br><br>Análisis estático del interior del archivo buscando funciones maliciosas o firmas (`<?php`, `system`). | <br>_Prueba:_ Subir un `archivo.jpg` válido, pero insertarle el texto `<?php phpinfo(); ?>` en el medio de la imagen.<br><br>_Resultado:_ Si lo bloquea, hay un WAF/Antivirus escaneando el contenido interno.<br><br>        |
^fu-reconocimiento

```ad-note
Al hacer _recon_, es clave probar estos vectores **uno por uno y en orden**. Si intentás bypassear la extensión y el contenido al mismo tiempo, y el servidor te rechaza el archivo, no vas a saber cuál de las dos validaciones fue la que te bloqueó.
```

___
