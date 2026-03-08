---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLi - Second order

***

## Cheatsheet

|      **Fase de Ataque**      |                                                           **Acción del Sistema**                                                            |                    **Payload Estructural (Ejemplo)**                    |                                                                          **Lógica de Ejecución y Persistencia**                                                                           |
|:----------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|  <br><br>Inserción (Input)   |    <br>La aplicación recibe mi payload y lo procesa mediante una consulta segura (ej. consultas parametrizadas o sanitización inicial).     |       <br>`admin'--` (Registrado como un nuevo nombre de usuario)       |            <br>El payload evade las defensas perimetrales (WAF) y las validaciones de entrada, ya que sintácticamente es un string válido para la primera transacción.<br><br>            |
| <br>Almacenamiento (Storage) |                     <br>El motor de la base de datos guarda la cadena literal exacta en una tabla y columna específica.                     |  <br>Registro almacenado en la columna `username` de la tabla `users`.  |                                    <br>El ataque entra en un estado latente. En esta etapa no se produce ninguna alteración de la lógica SQL.<br><br>                                     |
| <br>Recuperación (Retrieval) | <br>Una funcionalidad secundaria del backend (ej. restablecimiento de contraseña, generación de reportes) consulta y lee el dato infectado. |  <br>El backend extrae `admin'--` asignándolo a una variable interna.   |    <br>La vulnerabilidad radica en la confianza absoluta; la aplicación asume erróneamente que cualquier dato proveniente de su propia base de datos es inherentemente seguro.<br><br>    |
|  <br>Detonación (Execution)  |                  <br>La aplicación concatena el dato recuperado directamente en una nueva sentencia SQL sin parametrizar.                   | <br>`UPDATE users SET password='New' WHERE username='admin'--' AND ...` | <br>El payload se interpreta como código. El operador de comentario anula las condiciones de seguridad originales, afectando en este caso a la cuenta legítima del administrador.<br><br> |
^sqli-second

___

## Overview

El [[Second-order SQLi]] (o inyección almacenada diferida) es un vector de ataque asíncrono. En lugar de forzar una alteración inmediata en el punto de entrada del flujo de la aplicación, inyecto un payload diseñado para permanecer en reposo dentro de la base de datos.

La explotación exitosa de este vector requiere identificar asimetrías en las políticas de sanitización del código fuente: la aplicación protege rigurosamente los datos que ingresan desde el exterior (el primer orden), pero concatena de manera insegura los datos cuando los extrae de su propio esquema para construir consultas posteriores (el segundo orden). Por lo tanto, el foco de mi análisis pasa de la inyección directa al mapeo exhaustivo de cómo fluyen y se reutilizan las variables almacenadas a lo largo de toda la lógica de negocio del aplicativo.


***
