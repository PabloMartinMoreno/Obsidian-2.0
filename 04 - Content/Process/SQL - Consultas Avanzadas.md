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
# SQL - Consultas Avanzadas

***

## Cheatsheet

|            **Concepto Clave**            |                          **Sintaxis Básica**                          | **Ejemplo Práctico**                                                                                                                                                                                   | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                                                                                                                                                       |
| :--------------------------------------: | :-------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|         <br><br>**Subconsultas**         |             <br><br>`SELECT ... WHERE col = (SELECT ...)`             | <br><br>`SELECT nombre FROM empleados WHERE salario > (SELECT AVG(salario) FROM empleados);`                                                                                                           | <br>Son consultas anidadas dentro de otra consulta principal (`SELECT`, `INSERT`, `UPDATE` o `DELETE`). Operan como un mecanismo estándar para aislar y extraer datos dinámicos que luego se utilizan como condición de filtrado (en el `WHERE`) o como valores calculados.<br><br>                                                                                                                                                  |
| <br><br>**Subconsultas Correlacionadas** | <br><br>`SELECT ... WHERE (SELECT ... WHERE interna.id = externa.id)` | <br><br>`SELECT nombre, salario FROM empleados ext WHERE salario > (SELECT AVG(salario) FROM empleados int WHERE int.departamento_id = ext.departamento_id);`                                          | <br>A diferencia de las subconsultas normales, la interna hace referencia a una o más columnas de la consulta externa, lo que obliga a que se evalúe **fila por fila**. Son útiles para comparaciones dinámicas donde el criterio de búsqueda depende de cada registro individual procesado.<br><br>                                                                                                                                 |
|   <br><br>**Common Table Expressions**   |        <br><br>`WITH cte AS (SELECT ...) SELECT ... FROM cte`         | <br>`WITH VentasMes AS (SELECT id_empleado, SUM(total) as ventas FROM facturas GROUP BY id_empleado) SELECT e.nombre FROM empleados e JOIN VentasMes v ON e.id = v.id_empleado WHERE v.ventas > 5000;` | <br>Definen conjuntos de resultados temporales con nombre usando la cláusula `WITH`. Su propósito principal es simplificar consultas muy complejas, hacer el código mucho más legible, evitar la repetición de subconsultas y permitir la creación de consultas recursivas (para jerarquías o árboles).<br><br>                                                                                                                      |
|       <br><br>**Stacked Queries**        |             <br><br>`consulta_original; NUEVA_SENTENCIA;`             | <br><br>`UPDATE inventario SET stock = stock - 1 WHERE id = 15; INSERT INTO registro_ventas (producto_id, fecha) VALUES (15, NOW());`                                                                  | <br>Permite ejecutar múltiples comandos secuenciales en una sola llamada usando el delimitador punto y coma (`;`). Es muy utilizado en scripts de migración, inicialización de bases de datos o dentro de transacciones donde se deben realizar operaciones encadenadas. _(Nota: El soporte para enviar múltiples sentencias a la vez depende del conector o API del lenguaje de programación que interactúe con el motor)._<br><br> |
^sql-avanzado


___

## Overview

La capacidad de estructurar consultas complejas y anidar lógicas de ejecución es vital para comprender cómo los motores de bases de datos resuelven operaciones en múltiples capas. En el contexto de la seguridad, el dominio de estas técnicas avanzadas me permite sortear limitaciones de sintaxis, extraer información de manera indirecta cuando los operadores convencionales no son viables y, en entornos configurados de forma permisiva, inyectar instrucciones administrativas completamente independientes del flujo original de la aplicación.


___