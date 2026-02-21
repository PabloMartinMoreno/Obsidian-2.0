---
aliases:
tags:
  - type/cheatsheet
type: CheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Técnicas de Confusión

***
## Cheatsheet

|           **Categoría del Bypass**            |                **Técnica / Vector**                | **Descripción y Ejecución Práctica**                                                                                                                                                                                                                                                                                                                                                                   |
|:---------------------------------------------:|:--------------------------------------------------:| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|      <br><br>**Confusión de Parámetros**      |       <br><br>HTTP Parameter Pollution (HPP)       | <br>Se envían múltiples parámetros `filename` en el mismo bloque `Content-Disposition`. El WAF suele validar el primero, pero lenguajes como PHP suelen procesar y guardar el último.<br><br>_Prueba en Burp:_ `filename="foto.jpg"; filename="shell.php"`<br><br>                                                                                                                                     |
|    <br><br>**Manipulación del Protocolo**     |   <br><br>Alteración del _Boundary_ (Multipart)    | <br>Romper intencionalmente la sintaxis del límite (`boundary`) en la cabecera `Content-Type` de la petición `multipart/form-data`.<br><br>_Prueba:_ Agregar espacios extra o acortar el boundary definido en el header HTTP respecto al cuerpo. Muchos WAFs dejan de leer al no entender el formato, pero el backend lo "arregla" silenciosamente y procesa el archivo.<br><br>                       |
| <br><br><br>**Límites del Sistema Operativo** | <br><br><br>Truncamiento por Longitud (Max Length) | <br>Los sistemas operativos (Windows/Linux) suelen tener un límite duro de 255 caracteres para el nombre de un archivo.<br><br>_Prueba:_ Enviar `shell.php.[250 caracteres 'A'].jpg`. El filtro lee que termina en `.jpg` y lo aprueba, pero al guardarlo en disco, el OS corta la cadena antes de llegar al `.jpg`, dejando el archivo con extensión `.php` o `.php.A...`.<br><br>                    |
|         <br><br>**Evasión de Parseo**         |  <br><br>Inyección de CRLF (`\r\n`) en el Nombre   | <br>Inyectar saltos de línea (Carriage Return + Line Feed) en el medio del parámetro `filename`.<br><br>_Prueba:_ En Burp, modificar el nombre a `shell.php%0d%0a.jpg` o romper visualmente la línea en el editor hexadecimal. Algunos WAFs leen la primera línea de la cabecera, mientras que el servidor final reensambla el string de forma distinta.<br><br>                                       |
|     <br><br>**Confusión de Codificación**     |      <br><br>URL/Unicode Encoding Inesperado       | <br>El WAF y el backend utilizan distintos _charsets_ o niveles de decodificación.<br><br>_Prueba:_ Enviar el nombre con doble URL Encoding (ej. `shell%252ephp`) o usar caracteres Unicode homóglifos (caracteres que se ven igual pero tienen distinto código hexadecimal). El WAF no los reconoce como peligrosos, pero el backend los normaliza a texto plano (ASCII) antes de guardarlos.<br><br> |
|        <br><br>**Arreglos Dinámicos**         |           <br><br>Array Notation (`[]`)            | <br>Algunos WAFs esperan que el parámetro de subida sea un simple string. Si se envía como un array, el WAF crashea o ignora la validación.<br><br>_Prueba:_ Cambiar el nombre del campo del formulario (el parámetro `name`, no el `filename`) a `file[]` en lugar de `file`. El backend de PHP lo tratará como un array de archivos y guardará el payload.<br><br>                                   |
^fu-confusion

```ad-note
La efectividad de estas técnicas depende casi en un 100% del _stack_ tecnológico que se esté auditando. Un backend en IIS (C#) interpreta las cabeceras HTTP de una manera sutilmente distinta a Tomcat (Java) o a Nginx/PHP-FPM. Identificar la tecnología subyacente durante el _recon_ es lo que va a dictar qué técnica de confusión tiene más chances de éxito.
```


___