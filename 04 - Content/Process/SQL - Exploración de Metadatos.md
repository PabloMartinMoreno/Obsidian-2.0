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
# SQL - Exploración de Metadatos

***

## Cheatsheet

|                     **Concepto Clave**                      |                                  **Sintaxis Básica / Ejemplos**                                  |                                           **Ejemplo Práctico**                                           | **Propósito y Comportamiento (Uso Legítimo en MySQL)**                                                                                                                                                                                    |
| :---------------------------------------------------------: | :----------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    <br><br>**Information Schema (Diccionario de Datos)**    | <br><br>`information_schema.tables`, `information_schema.columns`, `information_schema.routines` | <br><br>`SELECT TABLE_NAME, ENGINE FROM information_schema.tables WHERE table_schema = 'mi_base_datos';` | <br>Es la base de datos virtual estándar que provee metadatos. Se usa para consultar dinámicamente qué tablas, columnas, tipos de datos o procedimientos almacenados existen, y qué motor de almacenamiento (ej. InnoDB) usan.<br><br>    |
|       <br><br>**Base de Datos Principal del Sistema**       |                      <br><br>`mysql.user`, `mysql.db`, `mysql.tables_priv`                       |                <br><br>`SELECT user, host, plugin FROM mysql.user WHERE user = 'admin';`                 | <br>Es el esquema central del sistema (físico, no virtual). Almacena las cuentas de usuario, las contraseñas, los roles y la matriz de privilegios globales y por base de datos. Acceso exclusivo para administradores.<br><br>           |
|        <br><br>**Variables de Sistema y Monitoreo**         |                    <br><br><br>`SHOW VARIABLES`, `SHOW STATUS`, esquema `sys`                    |        <br><br>`SHOW VARIABLES LIKE 'max_connections';`<br><br>`SELECT * FROM sys.host_summary;`         | <br>`SHOW VARIABLES` permite ver la configuración activa del motor (límites, _timeouts_). El esquema `sys` (introducido en MySQL 5.7) ofrece vistas amigables sobre el rendimiento y los cuellos de botella del servidor.<br><br>         |
| <br><br>**Gestión de Procesos en Tiempo Real** _(Agregado)_ |               <br><br><br>`SHOW PROCESSLIST`, `SHOW FULL PROCESSLIST`, `KILL [id]`               |                          <br><br>`SHOW FULL PROCESSLIST;`<br><br>`KILL 10254;`                           | <br>Permite ver qué consultas exactas se están ejecutando en el motor en ese instante, qué usuario las lanzó y cuánto tiempo llevan. Fundamental para diagnosticar lentitud o "matar" transacciones bloqueadas (deadlocks).<br><br>       |
^sql-metadatos


___

## Overview

Comprender cómo el motor de base de datos almacena información sobre su propia estructura es el paso que transforma una inyección a ciegas en una extracción dirigida. Los metadatos actúan como el mapa interno del sistema; consultarlos permite descubrir el nombre de otras bases de datos, las tablas que contienen y las columnas específicas donde reside la información sensible o las credenciales objetivo.
