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
# SQLi - Boolean based

***

## Cheatsheet

|      **SGBD**      |   **Vector de Inferencia**   |                   **Payload Estructural**                    |                                                  **Lógica de Evaluación Binaria**                                                  |                                                            **Notas sobre Exfiltración**                                                             |
|:------------------:|:----------------------------:|:------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------:|
|   <br>**MySQL**    | <br>Inferencia por Subcadena |     <br>`AND (SUBSTRING((SELECT database()),1,1)) = 'a'`     |                <br>Evalúa si el primer carácter del nombre de la base de datos es exactamente la letra 'a'.<br><br>                |                             <br>Requiere iteración algorítmica exhaustiva sobre el diccionario de caracteres posibles.                              |
|   <br>**MySQL**    |     <br>Inferencia ASCII     |  <br>`AND (ASCII(SUBSTRING((SELECT version()),1,1))) > 50`   |           <br>Transforma el carácter extraído a su valor numérico ASCII para utilizar operadores de desigualdad.<br><br>           |                   <br>Optimiza drásticamente el número de peticiones de red al permitir el uso de algoritmos de búsqueda binaria.                   |
|   <br>**MSSQL**    |     <br>Inferencia ASCII     |  <br>`AND (ASCII(SUBSTRING((SELECT @@version),1,1))) = 115`  |                  <br>Mecanismo homólogo a MySQL; extrae metadatos del SGBD evaluando condiciones lógicas.<br><br>                  |                   <br>El comportamiento diferencial de la aplicación web define si la inyección se evaluó como `TRUE` o `FALSE`.                    |
| <br>**PostgreSQL** | <br>Inferencia por Subcadena | <br>`AND (SUBSTRING((SELECT current_database()),1,1)) = 'p'` |                <br>Evalúa el primer carácter de la base de datos en uso actual en el contexto de la sesión.<br><br>                | <br>La inferencia depende exclusivamente de detectar cambios en la longitud de la respuesta HTTP, el código de estado o el DOM renderizado.<br><br> |
|   <br>**Oracle**   |     <br>Inferencia ASCII     | <br>`AND (ASCII(SUBSTR((SELECT user FROM dual),1,1))) = 83`  | <br>Aplica la sintaxis nativa de Oracle utilizando `SUBSTR` y consultando obligatoriamente contra la tabla virtual `DUAL`.<br><br> |                    <br>Este vector genera el mayor volumen de tráfico HTTP, haciéndolo altamente ruidoso en logs de red o WAFs.                     |
^sqli-boolean

___

## Overview

El [[Boolean-based Blind SQLi]] es una técnica de exfiltración inferencial empleada cuando la aplicación web es vulnerable a la inyección de código, pero carece de un canal In-Band. Esto significa que los resultados de las consultas no se reflejan en el frontend de la página y el motor de la base de datos no expone errores sintácticos o lógicos. Ante esta ceguera, me veo forzado a interactuar con el backend mediante la formulación de preguntas cerradas (verdadero o falso) anexadas a la consulta original.

El pilar de esta técnica radica en analizar las diferencias deterministas en la respuesta de la aplicación web cuando la consulta SQL subyacente evalúa una condición como verdadera frente a una falsa. Estas variaciones estructurales pueden manifestarse como la carga (o ausencia) de un elemento específico en el DOM, modificaciones en el tamaño en bytes del HTTP Response, o transiciones en los códigos de estado HTTP devueltos por el servidor.


***
