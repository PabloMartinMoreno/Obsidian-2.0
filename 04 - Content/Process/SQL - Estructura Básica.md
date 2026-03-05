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
# SQL - Estructura Básica

***

## Cheatsheet

|           **Concepto Clave**           |  **Sintaxis Básica / Símbolo**  | **Ejemplo Práctico**                                                                                                 | **Propósito y Comportamiento**                                                                                                                                                                 |
| :------------------------------------: | :-----------------------------: | -------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       <br>**Declaración SELECT**       | <br>`SELECT columna1, columna2` | <br>`SELECT id, username, password_hash FROM credenciales`                                                           | <br>Define qué datos extraer de la base de datos. Constituye la directiva principal para cualquier operación de lectura y exfiltración de información.<br><br>                                 |
|         <br>**Cláusula FROM**          |     <br>`FROM nombre_tabla`     | <br>`SELECT * FROM usuarios`                                                                                         | <br>Especifica la tabla, vista o esquema de origen de donde se extraerán los datos indicados en la proyección.<br><br>                                                                         |
|         <br>**Cláusula WHERE**         |  <br>`WHERE condicion_logica`   | <br>`SELECT email FROM clientes WHERE id = 5 OR 1=1`                                                                 | <br>Filtra los registros obtenidos basándose en condiciones booleanas. Es el principal punto de manipulación lógica en inyecciones basadas en errores o booleanas.<br><br>                     |
| <br>**Sintaxis de Comentarios en SQL** |   <br>`--` , `#`, `/* ... */`   | <br>`SELECT * FROM users WHERE username = 'admin' -- AND password = 'xxx'`<br><br>`SELECT /*!50000 version() */`<br> | <br>Anula la ejecución del texto subsiguiente o de un bloque específico. Su sintaxis varía según el motor (ej. MySQL, PostgreSQL, MSSQL) y es vital para truncar consultas originales.<br><br> |
|    <br>**Terminación de Consultas**    |             <br>`;`             | <br>`SELECT * FROM productos; DROP TABLE logs;`                                                                      | <br>Indica al analizador léxico del motor el final absoluto de la instrucción SQL actual. Esencial para apilar consultas en entornos que lo soporten.<br><br>                                  |
^sql-base

___

## Overview

El dominio de los comandos fundamentales de SQL es el cimiento indispensable para interactuar con bases de datos relacionales. Esta nota consolida la anatomía de una consulta estándar, detallando las instrucciones centrales que permiten recuperar y filtrar información, así como los mecanismos sintácticos para comentar o terminar sentencias. Comprender la correcta sintaxis de estas operaciones me permite analizar el comportamiento legítimo del motor de base de datos, paso previo necesario para subvertir su lógica mediante SQL Injection.


___
