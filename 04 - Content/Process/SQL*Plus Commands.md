---
aliases:
tags:
  - type/cheatsheet
  - service/oracle
  - meta/commands
  - tool/sqlplus
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# SQL*Plus Commands

***

## Cheatsheet

| **Acción**                                                 | **Descripción**                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `select * from user_role_privs;` (SQL)                     | Lista los privilegios del usuario de la sesión.                                                       |
| `select username from user_users;` (SQL)                   | Lista los esquemas accesibles por el usuario conectado.                                               |
| `alter session set current_schema=<schema_name>;` (SQL)    | Cambia a un esquema específico.                                                                       |
| `select table_name from all_tables;` (SQL)                 | Muestra todas las tablas disponibles en el esquema actual.                                            |
| `desc <table>;` (SQL)                                      | Describe la estructura de la tabla especificada.                                                      |
| `select * from <table>;` (SQL)                             | Muestra todos los registros de la tabla especificada.                                                 |
| `select * from <table> where <column> = '<string>';` (SQL) | Busca la cadena necesaria en la tabla especificada.                                                   |
| `select name, password from sys.user$;` (SQL)              | Recupera el nombre y el hash de la contraseña desde la base de datos (requiere privilegios elevados). |