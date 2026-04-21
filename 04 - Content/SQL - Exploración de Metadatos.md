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
type: CheatSheet
linked:
  - "[[SQL Commands]]"
---
# SQL - Exploración de Metadatos

***

## Cheatsheet

| **Concepto Clave**                                         | **Sintaxis Básica / Ejemplos (Multimotor)**                                                                                     | **Ejemplo Práctico**                                                                                              | **Propósito y Comportamiento (Uso General en SQL)**                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <br>**Information Schema (Diccionario de Datos Estándar)** | <br><br>`INFORMATION_SCHEMA.TABLES`, `INFORMATION_SCHEMA.COLUMNS`                                                               | <br><br>`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'public';`                         | <br>Es el **estándar ANSI** para consultar metadatos. Provee vistas de solo lectura sobre la estructura de la base de datos (tablas, columnas, tipos de datos, restricciones). Lo soportan PostgreSQL, MySQL, SQL Server y otros. _(Nota: Oracle usa sus propias vistas como `ALL_TABLES`)._<br><br>         |
| <br><br>**Catálogos del Sistema (Usuarios y Privilegios)** | <br><br>Varía por motor: `pg_roles` *(Postgres)*, `sys.server_principals` *(SQL Server)*, `mysql.user` *(MySQL)*                | <br><br>`SELECT name, type_desc FROM sys.server_principals;` _(Ej. SQL Server)_                                   | <br>Esquemas físicos y propietarios de cada motor que almacenan cuentas, roles, hashes de contraseñas y la matriz de permisos. **No hay un estándar ANSI estricto** para la administración física de usuarios, por lo que la tabla exacta a consultar depende del motor relacional que estés usando.<br><br> |
| <br><br>**Configuración y Vistas de Rendimiento**          | <br><br>Varía por motor: `sys.configurations` *(SQL Server)*, `SHOW / current_setting` *(Postgres)*, `V$PARAMETER` *(Oracle)*   | <br><br>`SELECT name, value_in_use FROM sys.configurations WHERE name = 'max worker threads';` _(Ej. SQL Server)_ | <br>Mecanismos para consultar la configuración activa del motor (límites de memoria, timeouts, conexiones máximas). Los sistemas modernos proveen vistas dinámicas (como las DMVs en SQL Server o el esquema `sys` en MySQL) para monitorear el rendimiento y analizar cuellos de botella.<br><br>           |
| <br>**Monitoreo y Gestión de Sesiones (Procesos)**         | <br>Varía por motor: `pg_stat_activity` / `pg_terminate_backend()` *(Postgres)*, `sys.dm_exec_requests` / `KILL` *(SQL Server)* | <br>`SELECT pid, query FROM pg_stat_activity WHERE state = 'active';` _(Ej. PostgreSQL)_                          | <br>Permite a los administradores ver qué consultas exactas se están ejecutando en tiempo real, qué usuario las lanzó y su estado. Fundamental para diagnosticar lentitud, auditar el servidor o forzar el cierre (matar) transacciones bloqueadas o _deadlocks_.<br><br>                                    |
^sql-metadatos


___

## Overview

Comprender cómo el motor de base de datos almacena información sobre su propia estructura es el paso que transforma una inyección a ciegas en una extracción dirigida. Los metadatos actúan como el mapa interno del sistema; consultarlos permite descubrir el nombre de otras bases de datos, las tablas que contienen y las columnas específicas donde reside la información sensible o las credenciales objetivo.
