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
# SQL - Operadores y Lógica

***

## Cheatsheet

|             **Concepto Clave**             |        **Sintaxis / Operadores**        |                        **Ejemplo Práctico**                        | **Propósito y Comportamiento**                                                                                                                                            |
|:------------------------------------------:|:---------------------------------------:|:------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         <br>**Operadores Lógicos**         |         <br>`AND`, `OR`, `NOT`          |        <br>`admin' OR 1=1 --`<br><br>`... AND (SELECT 1)=1`        | <br>Combinan condiciones. `OR` es la base de las tautologías clásicas para bypass de autenticación; `AND` y `NOT` dictan la lógica en inyecciones ciegas (Blind).<br><br> |
|     <br>**Operadores de Comparación**      | <br>=, `<>`, `!=`, `>`, `<`, `>=`, `<=` |          <br>`... AND ASCII(SUBSTRING(user(),1,1)) > 100`          | <br>Evalúan relaciones. Claves para acotar rangos al extraer datos carácter por carácter mediante fuerza bruta en inyecciones ciegas.<br><br>                             |
| <br>**Operadores de Búsqueda de Patrones** |  <br>`LIKE`, `ILIKE`, `IN`, `BETWEEN`   |            <br><br>`... WHERE table_name LIKE '%user%'`            | <br>Filtran coincidencias parciales. Ideales para mapear datos cuando no se conoce el valor exacto o para eludir filtros estrictos de igualdad.<br><br>                   |
|      <br>**Concatenación de Cadenas**      |     <br><br>\|\| , `CONCAT()`, `+`      | <br>`UNION SELECT 1, CONCAT(username, 0x3a, password) FROM users`  | <br>Unen textos (depende del motor). Son el vector principal para empaquetar y exfiltrar el contenido de múltiples columnas en una sola salida.<br><br>                   |
|       <br>**Operadores Aritméticos**       |       <br>`+`, `-`, `*`, `/`, `%`       |     <br>`id=2-1` (Ofuscación) <br><br>`id=1/0` (Error forzado)     | <br>Ejecutan cálculos. Útiles para ofuscar _payloads_ (evitando firmas estáticas) o para forzar errores que revelen información (ej. división por cero).<br><br>          |
|     <br>**Operadores a Nivel de Bits**     |   <br>`&`, \| , `^`, `~`, `<<`, `>>`    | <br>`id=1^1` (Evalúa a falso)<br><br>`id=1^0` (Evalúa a verdadero) | <br>Manipulan binarios. Herramienta avanzada para la evasión de WAFs, permitiendo armar lógicas complejas sin usar los caracteres filtrados habituales.<br><br>           |
^sql-logica


___

## Overview

El uso de operadores lógicos, aritméticos y de comparación conforma el núcleo analítico de cualquier base de datos relacional. En el contexto de la manipulación de consultas, estos elementos permiten condicionar el flujo de ejecución, comparar valores para inferir datos y evadir restricciones mediante transformaciones de sintaxis. Entender la precedencia y la lógica booleana subyacente es esencial para construir aserciones verdaderas o falsas en técnicas de inyección ciega, o para consolidar vectores de ataque basados en tautologías.


___
