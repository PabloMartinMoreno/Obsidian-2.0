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

|             **Concepto Clave**             |        **Sintaxis / Operadores**        |                                                     **Ejemplo Práctico**                                                     | **Propósito y Comportamiento**                                                                                                                                            |
| :----------------------------------------: | :-------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|         <br>**Operadores Lógicos**         |         <br>`AND`, `OR`, `NOT`          |                 <br>`SELECT * FROM usuarios WHERE activo = 1 AND (rol = 'admin' OR rol = 'editor');`<br><br>                 | <br>Combinan condiciones. `OR` es la base de las tautologías clásicas para bypass de autenticación; `AND` y `NOT` dictan la lógica en inyecciones ciegas (Blind).<br><br> |
|     <br>**Operadores de Comparación**      | <br>=, `<>`, `!=`, `>`, `<`, `>=`, `<=` |                       <br>`SELECT nombre, precio FROM productos WHERE stock > 0 AND precio <= 15000;`                        | <br>Evalúan relaciones. Claves para acotar rangos al extraer datos carácter por carácter mediante fuerza bruta en inyecciones ciegas.<br><br>                             |
| <br>**Operadores de Búsqueda de Patrones** |  <br>`LIKE`, `ILIKE`, `IN`, `BETWEEN`   |    <br>`SELECT * FROM facturas WHERE estado IN ('Pagada', 'Pendiente') AND fecha BETWEEN '2026-01-01' AND '2026-01-31';`     | <br>Filtran coincidencias parciales. Ideales para mapear datos cuando no se conoce el valor exacto o para eludir filtros estrictos de igualdad.<br><br>                   |
|      <br>**Concatenación de Cadenas**      |     <br><br>\|\| , `CONCAT()`, `+`      |                         <br>`SELECT CONCAT(nombre, ' ', apellido) AS nombre_completo FROM clientes;`                         | <br>Unen textos (depende del motor). Son el vector principal para empaquetar y exfiltrar el contenido de múltiples columnas en una sola salida.<br><br>                   |
|       <br>**Operadores Aritméticos**       |       <br>`+`, `-`, `*`, `/`, `%`       |                <br>`SELECT id_pedido, (precio_unitario * cantidad) AS subtotal FROM detalle_pedidos;`<br><br>                | <br>Ejecutan cálculos. Útiles para ofuscar _payloads_ (evitando firmas estáticas) o para forzar errores que revelen información (ej. división por cero).<br><br>          |
|     <br>**Operadores a Nivel de Bits**     |   <br>`&`, \| , `^`, `~`, `<<`, `>>`    | <br>`SELECT id, nombre FROM archivos WHERE (permisos_bitmask & 4) = 4;` _(Ej. verifica si tiene permiso de lectura)_<br><br> | <br>Manipulan binarios. Herramienta avanzada para la evasión de WAFs, permitiendo armar lógicas complejas sin usar los caracteres filtrados habituales.<br><br>           |
^sql-logica


___

## Overview

El uso de operadores lógicos, aritméticos y de comparación conforma el núcleo analítico de cualquier base de datos relacional. En el contexto de la manipulación de consultas, estos elementos permiten condicionar el flujo de ejecución, comparar valores para inferir datos y evadir restricciones mediante transformaciones de sintaxis. Entender la precedencia y la lógica booleana subyacente es esencial para construir aserciones verdaderas o falsas en técnicas de inyección ciega, o para consolidar vectores de ataque basados en tautologías.


___
