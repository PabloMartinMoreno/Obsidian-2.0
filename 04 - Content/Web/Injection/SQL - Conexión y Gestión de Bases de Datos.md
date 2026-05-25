---
aliases: null
tags:
  - type/cheatsheet
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: CheatSheet
linked:
  - '[[SQL Commands]]'
---
# SQL - Conexión y Gestión de Bases de Datos

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mysql -u root -h target -P 3306 -p` | Conexión MySQL/MariaDB interactiva | Acceso directo post-creds. |
| `mysql -u root -h target -p -e 'SHOW DATABASES;'` | Query one-shot sin shell interactivo | Scripting. |
| `mariadb -u user -h target -p` | Cliente MariaDB explícito | Alt MySQL. |
| `psql -U postgres -h target -p 5432 -d postgres` | Cliente PostgreSQL | PG conexión. |
| `PGPASSWORD=pwd psql -U postgres -h target -d postgres -c 'SELECT version()'` | One-shot PG sin prompt | Scripting PG. |
| `sqlcmd -S target -U sa -P 'Password123' -Q 'SELECT @@version'` | One-shot MSSQL | MSSQL queries. |
| `sqlcmd -S target -U sa -P pwd` | Cliente MSSQL interactivo | MSSQL acceso. |
| `sqlplus user/pass@target:1521/SID` | Cliente Oracle (sqlplus) | Oracle conexión. |
| `sqlplus user/pass@//target:1521/SERVICE` | Conexión Oracle 12c+ con service name | Modern Oracle. |
| `mysqldump -u root -h target -p --all-databases > dump.sql` | Backup completo MySQL | Exfil post-creds. |
| `pg_dump -U postgres -h target -d dbname > dump.sql` | Backup PG | Mismo PG. |
| `SHOW DATABASES;` (MySQL/MariaDB) | Lista DBs | Enum desde sesión. |
| `\l` (psql) | Lista DBs PostgreSQL | Equivalente PG. |
| `SELECT name FROM sys.databases` (MSSQL) | Lista DBs MSSQL | Enum MSSQL. |
| `SELECT name FROM v$database` (Oracle) | DB Oracle | Enum Oracle. |
| `USE dbname;` (MySQL/MSSQL) | Cambiar contexto a DB | Pre-query. |
| `\c dbname` (psql) | Conectar a DB PG | Mismo PG. |
| `SHOW TABLES;` (MySQL) | Lista tablas en DB actual | Enum tablas. |
| `\dt` (psql) | Lista tablas PG | Mismo PG. |
| `DESCRIBE tabla;` o `DESC tabla;` (MySQL) | Schema de tabla | Pre-extracción. |
| `\d tabla` (psql) | Schema PG | Mismo PG. |
| `EXEC sp_columns 'tabla'` (MSSQL) | Schema MSSQL | Mismo MSSQL. |
| `exit` / `quit` / `\q` (psql) | Salir del cliente | Standard. |
^sql-conexion

### Default ports

| SGBD | Puerto |
|:---:|:---:|
| MySQL/MariaDB | 3306 |
| PostgreSQL | 5432 |
| MSSQL | 1433 (TCP), 1434 (UDP browser) |
| Oracle | 1521 (listener) |
| MongoDB | 27017 |
| Redis | 6379 |
| CouchDB | 5984 |
| Elasticsearch | 9200 |

### Default creds (lab/legacy)

| SGBD | User | Pwd |
|:---:|:---:|:---:|
| MySQL | `root` | empty / `root` / `mysql` |
| PostgreSQL | `postgres` | `postgres` |
| MSSQL | `sa` | empty / `sa` / `password` |
| Oracle | `system` | `manager` |
| Oracle | `sys` | `change_on_install` |
| MongoDB | (no auth default) | n/a |

___

## Overview

Comandos cliente cuando ya tenés credenciales (post-SQLi recovery, exposed services, default creds). Diferentes para cada motor — sintaxis cliente y syntax de enum.

**Workflow típico post-credential:**
1. `nmap -sV -p 1433,3306,5432,1521 target` — confirmar servicio.
2. Conectar con cliente apropiado.
3. Enum DBs → tablas → columnas → extraer.
4. Si privs altos → RCE via [[SQL - Interacción Especial y Archivos]].

Diferencias cliente importantes: `\` commands en psql (`\l`/`\dt`/`\c`) vs `SHOW`/`USE` en MySQL vs `EXEC sp_*` en MSSQL.

***
