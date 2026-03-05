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

|          **Concepto Clave**          |                        **Sintaxis Básica**                        | **Ejemplo Práctico**                                                                                                                                                                                   | **Propósito y Comportamiento**                                                                                                                                                                          |
| :----------------------------------: | :---------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         <br>**Subconsultas**         |             <br>`SELECT ... WHERE col = (SELECT ...)`             | <br>`SELECT nombre FROM empleados WHERE salario > (SELECT AVG(salario) FROM empleados);`                                                                                                               | <br>Consultas anidadas. Son el mecanismo estándar para extraer datos de otras tablas o inyectar vectores de exfiltración directamente dentro de un `WHERE` o `SELECT`.<br><br>                          |
| <br>**Subconsultas Correlacionadas** | <br>`SELECT ... WHERE (SELECT ... WHERE interna.id = externa.id)` | <br>`SELECT nombre, salario FROM empleados ext WHERE salario > (SELECT AVG(salario) FROM empleados int WHERE int.departamento_id = ext.departamento_id);`                                              | <br>La consulta interna referencia a la externa, evaluándose por cada fila. Útiles para realizar inferencias complejas en escenarios de _Blind SQLi_ y evadir ciertos filtros de la aplicación.<br><br> |
|   <br>**Common Table Expressions**   |        <br>`WITH cte AS (SELECT ...) SELECT ... FROM cte`         | <br>`WITH VentasMes AS (SELECT id_empleado, SUM(total) as ventas FROM facturas GROUP BY id_empleado) SELECT e.nombre FROM empleados e JOIN VentasMes v ON e.id = v.id_empleado WHERE v.ventas > 5000;` | <br>Crean conjuntos de resultados temporales en memoria. Su comprensión es clave para identificar y explotar inyecciones en sistemas de generación de reportes o lógicas de vistas complejas.<br><br>   |
|     <br><br>**Stacked Queries**      |           <br><br>`consulta_original; NUEVA_SENTENCIA;`           | <br>`UPDATE inventario SET stock = stock - 1 WHERE id = 15; INSERT INTO registro_ventas (producto_id, fecha) VALUES (15, NOW());`                                                                      | <br>Apila comandos usando el delimitador (`;`). Permite escalar una vulnerabilidad de lectura hacia operaciones destructivas (`DROP`, `UPDATE`) o ejecución de procedimientos almacenados.<br><br>      |
^sql-avanzado


___

## Overview

La capacidad de estructurar consultas complejas y anidar lógicas de ejecución es vital para comprender cómo los motores de bases de datos resuelven operaciones en múltiples capas. En el contexto de la seguridad, el dominio de estas técnicas avanzadas me permite sortear limitaciones de sintaxis, extraer información de manera indirecta cuando los operadores convencionales no son viables y, en entornos configurados de forma permisiva, inyectar instrucciones administrativas completamente independientes del flujo original de la aplicación.


___