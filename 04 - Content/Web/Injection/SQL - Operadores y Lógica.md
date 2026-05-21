---
aliases:
tags:
  - type/cheatsheet
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: CheatSheet
linked:
  - "[[SQL Commands]]"
---
# SQL - Operadores y Lógica

***

## Cheatsheet

|             **Concepto Clave**             |        **Sintaxis / Operadores**        |                                                     **Ejemplo Práctico**                                                     | **Propósito y Comportamiento**                                                                                                                                                                                                                                                      |
| :----------------------------------------: | :-------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         <br>**Operadores Lógicos**         |         <br>`AND`, `OR`, `NOT`          |                 <br>`SELECT * FROM usuarios WHERE activo = 1 AND (rol = 'admin' OR rol = 'editor');`<br><br>                 | <br>Combinan o niegan condiciones lógicas. Permiten aplicar múltiples criterios de filtrado simultáneamente en cláusulas como `WHERE` o `HAVING` para obtener conjuntos de datos precisos.<br><br>                                                                                  |
|     <br>**Operadores de Comparación**      | <br>=, `<>`, `!=`, `>`, `<`, `>=`, `<=` |                       <br>`SELECT nombre, precio FROM productos WHERE stock > 0 AND precio <= 15000;`                        | <br>Evalúan la relación entre dos expresiones. Son fundamentales para acotar registros al comparar valores numéricos, de fecha o de texto y determinar si se cumple una condición. _(Nota: `<>` es el estándar ANSI para "distinto de")._<br><br>                                   |
| <br>**Operadores de Búsqueda de Patrones** |  <br>`LIKE`, `ILIKE`, `IN`, `BETWEEN`   |    <br>`SELECT * FROM facturas WHERE estado IN ('Pagada', 'Pendiente') AND fecha BETWEEN '2026-01-01' AND '2026-01-31';`     | <br>Facilitan búsquedas flexibles. `LIKE` permite usar comodines (`%`, `_`) para coincidencias parciales de texto, `IN` verifica si un valor está dentro de una lista, y `BETWEEN` evalúa rangos inclusivos.<br><br>                                                                |
|      <br>**Concatenación de Cadenas**      |     <br><br>\|\| , `CONCAT()`, `+`      |                         <br>`SELECT CONCAT(nombre, ' ', apellido) AS nombre_completo FROM clientes;`                         | <br>Unen dos o más cadenas de texto o columnas en una sola salida. Útiles para formatear y presentar la información de manera legible directamente desde la consulta. _(Nota: `\|\|` es el estándar ANSI, aunque motores como SQL Server usan `+` y MySQL usa `CONCAT()`)._<br><br> |
|       <br>**Operadores Aritméticos**       |       <br>`+`, `-`, `*`, `/`, `%`       |                <br>`SELECT id_pedido, (precio_unitario * cantidad) AS subtotal FROM detalle_pedidos;`<br><br>                | <br>Ejecutan cálculos matemáticos estándar sobre datos numéricos. Permiten calcular campos derivados en tiempo de ejecución, como subtotales, descuentos o promedios en las filas obtenidas.<br><br>                                                                                |
|     <br>**Operadores a Nivel de Bits**     |   <br>`&`, \| , `^`, `~`, `<<`, `>>`    | <br>`SELECT id, nombre FROM archivos WHERE (permisos_bitmask & 4) = 4;` _(Ej. verifica si tiene permiso de lectura)_<br><br> | <br>Manipulan los valores a nivel binario. Se utilizan en bases de datos para evaluar campos que almacenan múltiples estados o permisos (flags) empaquetados en un solo número entero, optimizando el espacio.<br><br>                                                              |
^sql-logica


___

## Overview

El uso de operadores lógicos, aritméticos y de comparación conforma el núcleo analítico de cualquier base de datos relacional. En el contexto de la manipulación de consultas, estos elementos permiten condicionar el flujo de ejecución, comparar valores para inferir datos y evadir restricciones mediante transformaciones de sintaxis. Entender la precedencia y la lógica booleana subyacente es esencial para construir aserciones verdaderas o falsas en técnicas de inyección ciega, o para consolidar vectores de ataque basados en tautologías.


___
