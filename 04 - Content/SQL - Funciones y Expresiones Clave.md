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
# SQL - Funciones y Expresiones Clave

***

## Cheatsheet

| **Concepto Clave**                           | **Sintaxis / Ejemplos (Multimotor)**                                                                        | **Ejemplo Práctico**                                                                                     | **Propósito y Comportamiento**                                                                                                                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>**Funciones de Información del Sistema** | <br>`CURRENT_USER`, `CURRENT_DATE` *(ANSI)*<br>`VERSION()` *(MySQL/PG)*, `@@version` *(SQL Server)*<br><br> | <br><br>`SELECT CURRENT_USER, CURRENT_TIMESTAMP;`                                                        | <br>Devuelven datos del contexto actual de la sesión, el usuario o el servidor. Son vitales para generar registros de auditoría (saber quién y cuándo insertó un dato), aplicar lógica basada en fechas o validar el entorno.<br><br>                                   |
| <br>**Casteo y Conversión de Tipos**         | <br>`CAST(col AS tipo)` *(ANSI)*<br>`CONVERT()` *(SQL Server/MySQL)*, `::tipo` *(Postgres)*<br><br>         | <br>`SELECT CAST(precio_texto AS DECIMAL(10,2)) FROM productos;`                                         | <br>Transforman explícitamente un tipo de dato en otro. Esencial para asegurar que las operaciones matemáticas no fallen, para formatear fechas correctamente de cara al usuario, o para concatenar números con texto.<br><br>                                          |
| <br><br>**Funciones Condicionales**          | <br>`CASE WHEN ... THEN ... ELSE ... END` *(ANSI)*<br>`IF()` *(MySQL)*, `IIF()` *(SQL Server)*<br><br>      | <br>`SELECT nombre, CASE WHEN stock > 0 THEN 'Disponible' ELSE 'Agotado' END AS estado FROM inventario;` | <br>Permiten aplicar lógica de ramificación (if-then-else) directamente dentro de la consulta. Evalúan condiciones lógicas fila por fila y devuelven un valor específico según el resultado, ideal para categorizar datos sobre la marcha.<br><br>                      |
| <br>**Funciones de Longitud y Subcadenas**   | <br>`SUBSTRING()` / `SUBSTR()`, `LENGTH()` / `LEN()`                                                        | <br>`SELECT SUBSTRING(email, 1, 5) FROM usuarios WHERE LENGTH(password) < 8;`                            | <br>Manipulan y analizan cadenas de texto. Son herramientas obligatorias para limpiar datos sucios (como espacios extra), extraer porciones específicas (ej. el dominio de un email) o validar que los campos cumplan con cierta longitud.<br><br>                      |
| <br>**Funciones de Tiempo y Retraso**        | <br>`SLEEP()` *(MySQL)*, `pg_sleep()` *(Postgres)*, `WAITFOR DELAY` *(SQL Server)*                          | <br><br>`SELECT SLEEP(2);`                                                                               | <br>Suspenden temporalmente la ejecución de la consulta por la cantidad de segundos indicada. Se utilizan en scripts de mantenimiento para simular latencia, o para espaciar actualizaciones masivas en lotes y evitar bloquear las tablas para otros usuarios.<br><br> |
^sql-expresiones


___

## Overview

Conocer las funciones integradas de los diferentes motores de bases de datos me proporciona un arsenal de herramientas para extraer el contexto del entorno, manipular los tipos de datos devueltos y, fundamentalmente, crear canales laterales de exfiltración. El uso estratégico de expresiones condicionales, funciones de manipulación de cadenas y retrasos temporales es el núcleo operativo de las inyecciones ciegas (Blind SQLi). Estas funciones me permiten formular aserciones binarias al servidor y medir su respuesta a través de cambios sutiles en el comportamiento de la página o en el tiempo de ejecución de la solicitud.


___