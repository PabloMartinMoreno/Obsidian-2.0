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

|         **Concepto Clave**          |                **Sintaxis Básica / Ejemplos**                 | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                                |
|:-----------------------------------:|:-------------------------------------------------------------:| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     <br>**Information Schema**      | <br>`information_schema.tables`, `information_schema.columns` | <br>Estándar ANSI SQL que proporciona vistas de solo lectura con metadatos de todos los objetos del sistema. Es el objetivo universal para la enumeración de esquemas en motores modernos como MySQL, PostgreSQL y MSSQL. Extraer datos de `table_name` y `column_name` es fundamental para el mapeo.<br><br> |
| <br>**Tablas Maestras del Sistema** |        <br>`sqlite_master`, `all_tables`, `sysobjects`        | <br>Tablas y catálogos específicos de cada motor de base de datos. Conocer estas estructuras es indispensable cuando el estándar `information_schema` no está implementado (como en SQLite o versiones antiguas de Oracle) o cuando los permisos restringen su lectura.<br><br>                               |
| <br>**Bases de Datos por Defecto**  |             <br><br>`mysql`, `postgres`, `master`             | <br>Esquemas predeterminados que almacenan configuraciones críticas, usuarios del motor y hashes de contraseñas. Acceder a estas bases de datos puede permitir una escalada de privilegios directa sobre el servidor de base de datos.<br><br>                                                                |
^sql-metadatos


___

## Overview

Comprender cómo el motor de base de datos almacena información sobre su propia estructura es el paso que transforma una inyección a ciegas en una extracción dirigida. Los metadatos actúan como el mapa interno del sistema; consultarlos permite descubrir el nombre de otras bases de datos, las tablas que contienen y las columnas específicas donde reside la información sensible o las credenciales objetivo.
