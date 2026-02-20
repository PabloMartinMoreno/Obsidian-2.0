---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[File Upload Vulnerabilities]]"
---
# File Upload - Bypass de Filtros de Lista Blanca

***

| **Categoría del Bypass**             | **Técnica / Vector**                               | **Descripción y Ejecución Práctica**                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br><br><br>**Evasión de Frontend**  | <br><br><br>Client-Side Bypass                     | <br>La validación de la lista blanca ocurre únicamente en el navegador del usuario (mediante JavaScript/HTML5), no en el backend.<br><br>_Prueba:_ Subir un archivo `.jpg` legítimo para pasar el filtro visual, interceptar la petición HTTP (con Burp) y renombrar el `filename="imagen.jpg"` a `filename="shell.php"`.<br><br>                                                                                                                                 |
| <br><br>**Fallas de Lógica (Regex)** | <br><br>Mala ancla en la Expresión Regular         | <br>El backend busca la extensión permitida pero la expresión regular está mal formulada (ej. verifica que contenga `.jpg` pero no exige que esté al final del string).<br><br>_Prueba:_ Enviar `shell.php.jpg` o `shell.php%00.jpg`. El filtro ve el `.jpg` y lo aprueba, pero el sistema lo interpreta como PHP.<br><br>                                                                                                                                        |
| <br><br><br>**Disfraz de Contenido** | <br><br><br>Polyglots / Archivos Camaleón          | <br>El servidor valida estrictamente que el archivo sea una imagen real (revisa cabeceras, estructura y Magic Bytes) y solo permite extensiones de imagen.<br><br>_Prueba:_ Crear un archivo híbrido que sea una imagen válida pero esconda código en sus metadatos. Ej: usar ExifTool para inyectar `<?php system($_GET['cmd']); ?>` en el comentario de un `.jpg`. Útil si luego podés combinarlo con una vulnerabilidad de LFI (Local File Inclusion).<br><br> |
| <br><br>**Abuso de Procesamiento**   | <br><br>Explotación de Librerías (ej. ImageMagick) | <br>La whitelist es perfecta y el archivo debe ser una imagen sí o sí. En lugar de subir una shell web, se ataca al motor del servidor que recorta o procesa la imagen.<br><br>_Prueba:_ Crear un archivo `.svg` malicioso con inyección de entidades externas (XXE) o un payload para explotar ImageTragick, y subirlo. El RCE ocurre al momento en que el servidor intenta procesar el archivo.<br><br>                                                         |
| <br><br>**Manipulación de Ruta**     | <br><br>Path Traversal vía Filename                | <br>La extensión obligatoriamente tiene que ser `.jpg`, pero el parámetro del nombre de archivo no sanitiza caracteres de salto de directorio.<br><br>_Prueba:_ Renombrar el archivo en la petición a `../../../var/www/html/shell.php`. La idea es que el filtro mire la extensión original, pero el sistema guarde el archivo en otra ruta con el nombre deseado.<br><br>                                                                                       |

```ad-note
Los Polyglots son probablemente la técnica más elegante ante una lista blanca bien configurada. En vez de pelear contra el filtro, se le entrega exactamente lo que pide (una imagen 100% válida), pero envenenada por dentro.
```
