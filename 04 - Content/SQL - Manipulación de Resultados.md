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

|              **Concepto Clave**              |          **Sintaxis Básica**          |                                               **Ejemplo Práctico**                                               | **Propósito y Comportamiento**                                                                                                                                                                                 |
| :------------------------------------------: | :-----------------------------------: | :--------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|            <br>**Operador UNION**            |   <br>`SELECT ... UNION SELECT ...`   |                      <br>`SELECT email FROM clientes UNION SELECT email FROM proveedores;`                       | <br>Combina resultados de dos `SELECT`. Técnica principal para exfiltrar datos. Exige estrictamente que ambas consultas tengan la misma cantidad y tipo de columnas.<br><br>                                   |
|          <br>**Operador UNION ALL**          | <br>`SELECT ... UNION ALL SELECT ...` |              <br>`SELECT id_factura FROM ventas_2025 UNION ALL SELECT id_factura FROM ventas_2026;`              | <br>Igual que `UNION`, pero no elimina duplicados. Al no requerir filtrado interno, es más rápido y garantiza la extracción total de registros sin pérdidas.<br><br>                                           |
|          <br>**Cláusula ORDER BY**           |  <br>`ORDER BY columna [ASC\|DESC]`   |                        <br>`SELECT nombre, salario FROM empleados ORDER BY salario DESC;`                        | <br>Ordena resultados. Invaluable para enumerar columnas dinámicamente: incrementar el índice numérico hasta forzar un error revela cuántas columnas tiene la consulta original.<br><br>                       |
|          <br>**Cláusula GROUP BY**           |        <br>`GROUP BY columna`         |           <br>`SELECT departamento, COUNT(*) as cant_empleados FROM empleados GROUP BY departamento;`            | <br>Agrupa filas idénticas. Su manipulación permite desencadenar errores descriptivos (ej. colisiones con `floor()` y `rand()`) para revelar la estructura o datos internos.<br><br>                           |
|           <br>**Cláusula HAVING**            |     <br>`HAVING condicion_logica`     |    <br>`SELECT departamento, SUM(salario) FROM empleados GROUP BY departamento HAVING SUM(salario) > 500000;`    | <br>Filtra los grupos creados por `GROUP BY`. Sirve como una alternativa táctica excelente para aplicar lógica condicional cuando un WAF te bloquea el uso de `WHERE`.<br><br>                                 |
| <br>**Cláusula LIMIT** y **Cláusula OFFSET** |        <br>`LIMIT n OFFSET m`         | <br>`SELECT * FROM productos ORDER BY id ASC LIMIT 10 OFFSET 20;` _(Muestra los productos del 21 al 30)_<br><br> | <br>`LIMIT` restringe la cantidad de filas devueltas y `OFFSET` define desde dónde empezar. Indispensables para exfiltrar datos iterativamente (fila por fila) cuando la web solo muestra un registro.<br><br> |
^sql-resultados


___

## Overview

Controlar la forma en que el motor de base de datos formatea, combina y pagina la información es fundamental para la estructuración y recuperación precisa de los datos. En un contexto de evaluación de seguridad, dominar la manipulación de resultados me otorga la capacidad de anexar información ajena a la consulta original, descubrir la topología interna de las tablas mediante inferencia de ordenamiento y exfiltrar registros de manera secuencial y controlada, superando así las limitaciones visuales de la interfaz de la aplicación.


___