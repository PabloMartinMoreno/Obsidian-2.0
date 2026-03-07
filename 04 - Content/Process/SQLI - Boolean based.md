---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLI - Boolean based

***

## Cheatsheet

|**SGBD**|**Vector de Inferencia**|**Payload Estructural**|**Lógica de Evaluación Binaria**|**Notas sobre Exfiltración**|
|---|---|---|---|---|
|[[MySQL]]|Inferencia por Subcadena|`AND (SUBSTRING((SELECT database()),1,1)) = 'a'`|Evalúa si el primer carácter del nombre de la base de datos es exactamente la letra 'a'.|Requiere iteración algorítmica exhaustiva sobre el diccionario de caracteres posibles.|
|[[MySQL]]|Inferencia ASCII|`AND (ASCII(SUBSTRING((SELECT version()),1,1))) > 50`|Transforma el carácter extraído a su valor numérico ASCII para utilizar operadores de desigualdad.|Optimiza drásticamente el número de peticiones de red al permitir el uso de algoritmos de búsqueda binaria.|
|[[MSSQL]]|Inferencia ASCII|`AND (ASCII(SUBSTRING((SELECT @@version),1,1))) = 115`|Mecanismo homólogo a MySQL; extrae metadatos del SGBD evaluando condiciones lógicas.|El comportamiento diferencial de la aplicación web define si la inyección se evaluó como `TRUE` o `FALSE`.|
|[[PostgreSQL]]|Inferencia por Subcadena|`AND (SUBSTRING((SELECT current_database()),1,1)) = 'p'`|Evalúa el primer carácter de la base de datos en uso actual en el contexto de la sesión.|La inferencia depende exclusivamente de detectar cambios en la longitud de la respuesta HTTP, el código de estado o el DOM renderizado.|
|[[Oracle]]|Inferencia ASCII|`AND (ASCII(SUBSTR((SELECT user FROM dual),1,1))) = 83`|Aplica la sintaxis nativa de Oracle utilizando `SUBSTR` y consultando obligatoriamente contra la tabla virtual `DUAL`.|Este vector genera el mayor volumen de tráfico HTTP, haciéndolo altamente ruidoso en logs de red o WAFs.|

## Overview

El [[Boolean-based Blind SQLi]] es una técnica de exfiltración inferencial empleada cuando la aplicación web es vulnerable a la inyección de código, pero carece de un canal In-Band. Esto significa que los resultados de las consultas no se reflejan en el frontend de la página y el motor de la base de datos no expone errores sintácticos o lógicos. Ante esta ceguera, me veo forzado a interactuar con el backend mediante la formulación de preguntas cerradas (verdadero o falso) anexadas a la consulta original.

El pilar de esta técnica radica en analizar las diferencias deterministas en la respuesta de la aplicación web cuando la consulta SQL subyacente evalúa una condición como verdadera frente a una falsa. Estas variaciones estructurales pueden manifestarse como la carga (o ausencia) de un elemento específico en el DOM, modificaciones en el tamaño en bytes del HTTP Response, o transiciones en los códigos de estado HTTP devueltos por el servidor.


***
