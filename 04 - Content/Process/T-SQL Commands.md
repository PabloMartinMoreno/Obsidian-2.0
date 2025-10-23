---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# T-SQL Commands

***

## Cheatsheet

| **Acción**                                                                          | **Descripción**                                            |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `SELECT name FROM sys.databases;`                                                   | Muestra todas las bases de datos.                          |
| `USE <database>;`                                                                   | Selecciona una base de datos específica.                   |
| `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE';` | Muestra todas las tablas en la base de datos seleccionada. |
| **Alternativa:** `SELECT table_name FROM <database>.INFORMATION_SCHEMA.TABLES`      | Muestra todas las tablas en la base de datos seleccionada. |
| `SELECT column_name FROM information_schema.columns WHERE table_name = '<table>';`  | Muestra todas las columnas en la tabla especificada.       |
| `SELECT * FROM <table>;`                                                            | Muestra todos los registros de la tabla especificada.      |
| **Alternativa:** `SELECT * FROM [<database>].[dbo].<table>`                         | Muestra todos los registros de la tabla especificada.      |
| `SELECT * FROM <table> WHERE <column> = '<string>';                                 | Busca una cadena en una columna específica de la tabla.    |