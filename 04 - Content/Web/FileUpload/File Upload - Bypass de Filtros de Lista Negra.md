---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Bypass de Filtros de Lista Negra

***

## Cheatsheet

|        **Categoría del Bypass**        |            **Técnica / Vector**             | **Descripción y Ejecución Práctica**                                                                                                                                                                                                                                                            |
|:--------------------------------------:|:-------------------------------------------:| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  <br><br>**Extensiones Alternativas**  |   <br><br>Variantes de la extensión real    | <br>El filtro bloquea `.php` pero olvida extensiones _legacy_ o alias.<br>**PHP:** `.php3`, `.php4`, `.php5`, `.php7`, `.phtml`, `.phar`, `.inc`.<br>**ASP/IIS:** `.asp`, `.aspx`, `.cer`, `.asa`.<br>**JSP:** `.jsp`, `.jspx`, `.jws`.<br><br>                                                 |
| <br><br>**Manipulación de Caracteres** |    <br><br>Case Sensitivity (Mayúsculas)    | <br>Aprovecha filtros de validación (ej. _Regex_ o `str_replace` en PHP) que no ignoran mayúsculas/minúsculas.<br><br>_Prueba:_ `.PhP`, `.pHp`, `.PHP`. Útil en servidores Windows (que son _case-insensitive_ al leer el archivo).<br><br>                                                     |
|    <br><br>**Normalización del SO**    | <br><br>Trailing Dot / Space (Solo Windows) | <br>La API de Windows elimina puntos y espacios al final del nombre de archivo al guardarlo en disco.<br><br>_Prueba en Burp:_ `filename="shell.php "` o `filename="shell.php."`. El filtro ve una extensión permitida, pero se guarda como `.php`.<br><br>                                     |
|    <br><br><br>**Engaño al Parseo**    |         <br><br><br>Doble Extensión         | <br>Juega con la configuración de Apache (ej. `AddHandler`) o filtros mal programados.<br><br>_Prueba 1:_ `shell.php.jpg` (Apache a veces ejecuta el `.php` si no reconoce `.jpg` como ejecutable).<br><br>_Prueba 2:_ `shell.jpg.php` (Filtros que solo miran antes del primer punto).<br><br> |
|  <br><br>**Inyección de Caracteres**   |     <br><br>Null Byte Injection (`%00`)     | <br>Corta la cadena de texto en lenguajes basados en C (versiones antiguas de PHP/Java).<br><br>_Prueba:_ `shell.php%00.jpg`. El filtro lee `.jpg`, pero el sistema operativo guarda/ejecuta hasta el `%00` (`shell.php`).                                                                      |
|      <br>**Reglas del Servidor**       |     <br>Sobrescritura de Configuración      | Si bloquean todas las extensiones ejecutables, se sube un archivo de configuración para alterar las reglas del directorio.<br><br>_Prueba:_ Subir un `.htaccess` o `.user.ini` con la regla: `AddType application/x-httpd-php .txt`. Luego subir `shell.txt`.<br><br>                           |
^fu-blacklist

___
