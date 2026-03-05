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

| **Concepto Clave**                           | **Sintaxis / Ejemplos**                              | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>**Funciones de Información del Sistema** | <br>`VERSION()`, `@@version`, `USER()`, `DATABASE()` | <br>Recopilan datos críticos sobre el entorno actual. Identificar la versión exacta, el dialecto SQL y el usuario en ejecución (fingerprinting) es el paso táctico inicial indispensable para adaptar y construir vectores de inyección específicos y precisos.<br><br>                                                                                             |
| <br>**Casteo y Conversión de Tipos**         | <br>`CAST(col AS varchar)`, `CONVERT()`, `::text`    | <br>Transforman dinámicamente un tipo de dato en otro. Su dominio es esencial para forzar errores estructurados que revelen información dentro de los mensajes de excepción, y para asegurar que los payloads inyectados a través de `UNION` coincidan estrictamente con la firma de tipos de la consulta original.<br><br>                                         |
| <br>**Funciones Condicionales**              | <br>`IF()`, `CASE WHEN ... THEN ... ELSE ... END`    | <br>Permiten ramificar la lógica de ejecución basándose en la evaluación de una condición booleana. Constituyen la base estructural para la extracción de datos en inyecciones basadas en booleanos, alterando el resultado visible de la aplicación según la veracidad de la condición inyectada.<br><br>                                                          |
| <br>**Funciones de Longitud y Subcadenas**   | <br>`LENGTH()`, `SUBSTRING()`, `SUBSTR()`, `MID()`   | <br>Calculan el tamaño de un dato o lo fragmentan en porciones más pequeñas. Son mecánicas obligatorias para aislar, iterar y extraer registros largos carácter por carácter en cualquier escenario donde la exfiltración directa no sea posible.<br><br>                                                                                                           |
| <br>**Funciones de Tiempo y Retraso**        | <br>`SLEEP()`, `pg_sleep()`, `WAITFOR DELAY`         | <br>Fuerzan la suspensión temporal de la ejecución de la consulta. Al combinarse con funciones condicionales, permiten inferir el contenido de la base de datos basándose exclusivamente en el tiempo que tarda el servidor en devolver la respuesta HTTP (Time-based Blind), técnica vital cuando no existe ningún otro tipo de retroalimentación visible.<br><br> |
^sql-expresiones


___

## Overview

Conocer las funciones integradas de los diferentes motores de bases de datos me proporciona un arsenal de herramientas para extraer el contexto del entorno, manipular los tipos de datos devueltos y, fundamentalmente, crear canales laterales de exfiltración. El uso estratégico de expresiones condicionales, funciones de manipulación de cadenas y retrasos temporales es el núcleo operativo de las inyecciones ciegas (Blind SQLi). Estas funciones me permiten formular aserciones binarias al servidor y medir su respuesta a través de cambios sutiles en el comportamiento de la página o en el tiempo de ejecución de la solicitud.


___