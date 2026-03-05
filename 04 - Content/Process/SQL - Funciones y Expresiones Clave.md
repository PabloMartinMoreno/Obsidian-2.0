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

| **Concepto Clave**                           | **Sintaxis / Ejemplos**                              |                                  **Ejemplo Práctico**                                  | **Propósito y Comportamiento**                                                                                                                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------- |:--------------------------------------------------------------------------------------:| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>**Funciones de Información del Sistema** | <br>`VERSION()`, `@@version`, `USER()`, `DATABASE()` |                      <br>`SELECT DATABASE(), USER(), VERSION();`                       | <br>Recopilan datos críticos sobre el entorno y la sesión actual. Vitales para scripts dinámicos, registros de auditoría (saber qué usuario ejecutó un _trigger_) y validación de compatibilidad.<br><br>                                                             |
| <br>**Casteo y Conversión de Tipos**         | <br>`CAST(col AS varchar)`, `CONVERT()`, `::text`    |            <br>`SELECT CAST(precio_texto AS DECIMAL(10,2)) FROM productos;`            | <br>Transforman dinámicamente un tipo de dato en otro. Esencial para asegurar que las comparaciones sean correctas, formatear fechas o permitir operaciones matemáticas sobre texto. _(Nota: MySQL usa tipos como CHAR, SIGNED, DATETIME)._<br><br>                   |
| <br>**Funciones Condicionales**              | <br>`IF()`, `CASE WHEN ... THEN ... ELSE ... END`    | <br>`SELECT nombre, IF(stock > 0, 'Disponible', 'Agotado') AS estado FROM inventario;` | <br>Calculan el tamaño de un texto, lo fragmentan o lo modifican. Son mecánicas obligatorias para limpiar datos sucios, extraer porciones específicas (ej. el dominio de un email) o validar formatos.<br><br>                                                        |
| <br>**Funciones de Longitud y Subcadenas**   | <br>`LENGTH()`, `SUBSTRING()`, `SUBSTR()`, `MID()`   |     <br>`SELECT SUBSTRING(email, 1, 5) FROM usuarios WHERE LENGTH(password) < 8;`      | <br>Calculan el tamaño de un dato o lo fragmentan en porciones más pequeñas. Son mecánicas obligatorias para aislar, iterar y extraer registros largos carácter por carácter en cualquier escenario donde la exfiltración directa no sea posible.<br><br>             |
| <br>**Funciones de Tiempo y Retraso**        | <br>`SLEEP()`, `pg_sleep()`, `WAITFOR DELAY`         |                      <br>`SELECT SLEEP(2);`<br><br>`DO SLEEP(5);`                      | <br>Fuerza la suspensión temporal de la ejecución de la consulta por la cantidad de segundos indicada. En uso legítimo, sirve para simular latencia en entornos de prueba o para espaciar actualizaciones masivas en _scripts_ y evitar el bloqueo de tablas.<br><br> |
^sql-expresiones


___

## Overview

Conocer las funciones integradas de los diferentes motores de bases de datos me proporciona un arsenal de herramientas para extraer el contexto del entorno, manipular los tipos de datos devueltos y, fundamentalmente, crear canales laterales de exfiltración. El uso estratégico de expresiones condicionales, funciones de manipulación de cadenas y retrasos temporales es el núcleo operativo de las inyecciones ciegas (Blind SQLi). Estas funciones me permiten formular aserciones binarias al servidor y medir su respuesta a través de cambios sutiles en el comportamiento de la página o en el tiempo de ejecución de la solicitud.


___