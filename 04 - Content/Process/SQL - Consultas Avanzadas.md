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

|          **Concepto Clave**          |                        **Sintaxis Básica**                        | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                                                                                                                                                             |
|:------------------------------------:|:-----------------------------------------------------------------:| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|         <br>**Subconsultas**         |             <br>`SELECT ... WHERE col = (SELECT ...)`             | <br>Consultas anidadas dentro de una instrucción principal. El motor resuelve primero la subconsulta y utiliza su resultado para la evaluación externa. Son el mecanismo estándar para extraer datos de tablas secundarias e inyectar vectores de exfiltración dentro de cláusulas como `WHERE` o `SELECT`.<br><br>                                                                                                                        |
| <br>**Subconsultas Correlacionadas** | <br>`SELECT ... WHERE (SELECT ... WHERE interna.id = externa.id)` | <br>Una subconsulta que hace referencia a una o más columnas de la consulta externa, obligando al motor a evaluarla repetidamente por cada fila procesada. Se emplean para inferencias complejas y evasión de ciertas lógicas de aplicación.<br><br>                                                                                                                                                                                       |
|   <br>**Common Table Expressions**   |        <br>`WITH cte AS (SELECT ...) SELECT ... FROM cte`         | <br>Estructuras que definen conjuntos de resultados temporales y con nombre, válidos únicamente durante la ejecución de la consulta. Su comprensión es útil para analizar lógicas de vistas complejas y encontrar vectores de inyección en reportes o sistemas de análisis de datos.<br><br>                                                                                                                                               |
|     <br><br>**Stacked Queries**      |           <br><br>`consulta_original; NUEVA_SENTENCIA;`           | <br>Técnica que aprovecha el delimitador de finalización (generalmente `;`) para apilar y ejecutar múltiples sentencias SQL secuenciales en una misma solicitud HTTP. Su éxito depende estrictamente del motor de base de datos y de la API de conexión subyacente (ej. PHP PDO), permitiendo escalar desde la extracción de datos hacia operaciones destructivas como `DROP`, `UPDATE` o ejecución de procedimientos almacenados.<br><br> |
^sql-avanzado


___

## Overview

La capacidad de estructurar consultas complejas y anidar lógicas de ejecución es vital para comprender cómo los motores de bases de datos resuelven operaciones en múltiples capas. En el contexto de la seguridad, el dominio de estas técnicas avanzadas me permite sortear limitaciones de sintaxis, extraer información de manera indirecta cuando los operadores convencionales no son viables y, en entornos configurados de forma permisiva, inyectar instrucciones administrativas completamente independientes del flujo original de la aplicación.


___