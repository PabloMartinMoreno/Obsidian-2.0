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

|           **Concepto Clave**           |        **Sintaxis / Operadores**        |                                                                                                            **Propósito y Comportamiento**                                                                                                             |
| :------------------------------------: | :-------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|         <br>Operadores Lógicos         |         <br>`AND`, `OR`, `NOT`          |          <br>Combinan múltiples condiciones booleanas. La manipulación del operador `OR` es la base de las tautologías clásicas, mientras que `AND` y `NOT` son fundamentales para inyecciones inferenciales y filtros progresivos.<br><br>           |
|     <br>Operadores de Comparación      | <br>=, `<>`, `!=`, `>`, `<`, `>=`, `<=` |                       <br>Evalúan la relación entre dos expresiones. Son indispensables para forzar coincidencias exactas o para acotar rangos de valores al extraer datos carácter por carácter en escenarios ciegos.<br><br>                        |
| <br>Operadores de Búsqueda de Patrones |  <br>`LIKE`, `ILIKE`, `IN`, `BETWEEN`   |                   <br>Permiten el filtrado avanzado y la coincidencia parcial. `LIKE` y el uso de comodines (`%`, `_`) resultan útiles cuando no se conoce el valor exacto del objetivo o para eludir filtros restrictivos.<br><br>                   |
|      <br>Concatenación de Cadenas      |      <br><br>\|\|, `CONCAT()`, `+`      | <br>Unen múltiples secuencias de texto en una sola salida. La sintaxis varía drásticamente según el motor (ej. PostgreSQL vs SQL Server) y constituye la técnica principal para empaquetar múltiples columnas en un único punto de inyección.<br><br> |
|       <br>Operadores Aritméticos       |       <br>`+`, `-`, `*`, `/`, `%`       |        <br>Realizan cálculos matemáticos básicos. Frecuentemente utilizados para la ofuscación de cargas útiles y para evaluar el comportamiento del motor mediante la provocación de errores controlados, como la división por cero.<br><br>         |
|     <br>Operadores a Nivel de Bits     |   <br>`&`, `\|`, `^`, `~`, `<<`, `>>`   |   <br>Manipulan la representación binaria de los valores. Se emplean como herramientas avanzadas para la evasión de Web Application Firewalls (WAF), permitiendo codificar lógicas complejas sin utilizar caracteres filtrados habituales.<br><br>    |


___

## Overview

El uso de operadores lógicos, aritméticos y de comparación conforma el núcleo analítico de cualquier base de datos relacional. En el contexto de la manipulación de consultas, estos elementos permiten condicionar el flujo de ejecución, comparar valores para inferir datos y evadir restricciones mediante transformaciones de sintaxis. Entender la precedencia y la lógica booleana subyacente es esencial para construir aserciones verdaderas o falsas en técnicas de inyección ciega, o para consolidar vectores de ataque basados en tautologías.


___
