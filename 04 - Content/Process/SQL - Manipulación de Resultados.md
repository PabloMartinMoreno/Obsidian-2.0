---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Commands]]"
---
# SQL - Manipulación de Resultados

***

## Cheatsheet

|              **Concepto Clave**              |          **Sintaxis Básica**          | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                             |
| :------------------------------------------: | :-----------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|            <br>**Operador UNION**            |   <br>`SELECT ... UNION SELECT ...`   | <br>Combina los conjuntos de resultados de dos o más sentencias SELECT en una única salida, eliminando registros duplicados. Constituye la técnica principal para extraer datos de tablas arbitrarias, exigiendo estrictamente que ambas consultas compartan la misma cantidad y tipo de columnas.<br><br> |
|          <br>**Operador UNION ALL**          | <br>`SELECT ... UNION ALL SELECT ...` | <br>Funciona de manera idéntica a UNION, pero preserva los registros duplicados. Al no requerir la operación de filtrado interno, es computacionalmente más rápido y asegura la recuperación total de filas durante extracciones masivas o secuenciales.<br><br>                                           |
|          <br>**Cláusula ORDER BY**           |  <br>`ORDER BY columna [ASC\|DESC]`   | <br>Ordena el conjunto de resultados. Resulta invaluable para la enumeración dinámica de columnas; incrementar el índice posicional (ej. `ORDER BY 1`, luego `ORDER BY 2`) hasta forzar una excepción permite determinar la cantidad exacta de campos proyectados por la consulta original.<br><br>        |
|          <br>**Cláusula GROUP BY**           |        <br>`GROUP BY columna`         | <br>Agrupa filas que comparten valores idénticos en columnas específicas, comúnmente empleada junto a funciones de agregación. Su manipulación permite desencadenar errores descriptivos útiles para mapear el esquema de la base de datos.<br><br>                                                        |
|           <br>**Cláusula HAVING**            |     <br>`HAVING condicion_logica`     | <br>Aplica condiciones de filtrado exclusivamente sobre los grupos creados por `GROUP BY`. Funciona como una alternativa táctica para condicionar lógicas cuando los filtros de seguridad bloquean la inyección dentro de la cláusula `WHERE`.<br><br>                                                     |
| <br>**Cláusula LIMIT** y **Cláusula OFFSET** |        <br>`LIMIT n OFFSET m`         | <br>Restringe el volumen de filas devueltas (`LIMIT`) y define el índice de inicio para la lectura (`OFFSET`). Son directivas indispensables para la exfiltración metódica e iterativa (extrayendo fila por fila) en escenarios donde la aplicación solo renderiza el primer registro obtenido.<br><br>    |
^sql-resultados


___

## Overview

Controlar la forma en que el motor de base de datos formatea, combina y pagina la información es fundamental para la estructuración y recuperación precisa de los datos. En un contexto de evaluación de seguridad, dominar la manipulación de resultados me otorga la capacidad de anexar información ajena a la consulta original, descubrir la topología interna de las tablas mediante inferencia de ordenamiento y exfiltrar registros de manera secuencial y controlada, superando así las limitaciones visuales de la interfaz de la aplicación.


___