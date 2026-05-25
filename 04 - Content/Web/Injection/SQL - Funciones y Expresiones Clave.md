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
# SQL - Funciones y Expresiones Clave

***

## Cheatsheet

| **Función** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `@@version` (MSSQL/MySQL) | Versión del SGBD | Fingerprinting inicial. |
| `version()` (PostgreSQL/MySQL) | Versión via función | Mismo. |
| `current_user` (ANSI) o `user()` (MySQL) o `USER` (Oracle) | Usuario actual de la conexión | Post-fingerprint. |
| `database()` (MySQL) o `current_database()` (PostgreSQL) o `DB_NAME()` (MSSQL) | Database actual | Enum DBs. |
| `current_timestamp` (ANSI) | Fecha y hora actual | Audit/logs. |
| `CAST(x AS INTEGER)` | Conversión de tipo | Error-based via type mismatch ([[SQLi - Error based]]). |
| `CONVERT(int, x)` (MSSQL) | Equivalente MSSQL | Mismo. |
| `x::INTEGER` (PostgreSQL) | Cast shorthand | Mismo. |
| `CASE WHEN cond THEN a ELSE b END` (ANSI) | Conditional logic en select | Boolean blind / time-based. |
| `IF(cond, a, b)` (MySQL) | Conditional MySQL | Inline conditional. |
| `IIF(cond, a, b)` (MSSQL 2012+) | Conditional MSSQL | Equivalente. |
| `SUBSTRING(s, pos, len)` (MySQL/MSSQL) | Substring | Char-by-char extraction (blind). |
| `SUBSTR(s, pos, len)` (Oracle/SQLite) | Equivalente | Mismo. |
| `LENGTH(s)` o `LEN(s)` (MSSQL) | Largo de string | Pre-extraction — saber cuántos chars. |
| `ASCII(c)` | Char a número ASCII | Binary search optimization en blind. |
| `CHAR(83)` (MSSQL) o `CHR(83)` (Oracle) | Número a char | Construir keywords sin literales. |
| `SLEEP(5)` (MySQL) | Pausa 5 segundos | [[SQLi - Time based]] MySQL. |
| `pg_sleep(5)` (PostgreSQL) | Pausa PostgreSQL | Mismo. |
| `WAITFOR DELAY '0:0:5'` (MSSQL) | Pausa MSSQL (en stacked query) | Mismo. |
| `BENCHMARK(5000000, MD5('a'))` (MySQL) | CPU-heavy delay alt | `SLEEP` filtrado. |
| `0x68656c6c6f` (hex literal) | String `hello` sin comillas | Bypass quote filter — MySQL/MSSQL. |
^sql-expresiones

### Equivalencias críticas multimotor

| Concepto | MySQL | MSSQL | PostgreSQL | Oracle |
|:---:|:---:|:---:|:---:|:---:|
| Version | `@@version` o `version()` | `@@version` | `version()` | `SELECT banner FROM v$version` |
| User | `user()` | `SYSTEM_USER` | `current_user` | `USER` |
| DB | `database()` | `DB_NAME()` | `current_database()` | `(SELECT instance_name FROM v$instance)` |
| Sleep | `SLEEP(n)` | `WAITFOR DELAY '0:0:n'` | `pg_sleep(n)` | `DBMS_PIPE.RECEIVE_MESSAGE('a',n)` |
| Substring | `SUBSTRING(s,p,l)` | `SUBSTRING(s,p,l)` | `SUBSTRING(s,p,l)` | `SUBSTR(s,p,l)` |
| Concat | `CONCAT(...)` | `+` | `\|\|` | `\|\|` |
| Comment | `-- ` `#` `/**/` | `--` `/**/` | `--` `/**/` | `--` `/**/` |

___

## Overview

Funciones built-in son herramientas core de SQLi. Tres categorías clave:

1. **Info functions** (`@@version`, `user()`, `database()`) — fingerprinting + enum.
2. **String functions** (`SUBSTRING`, `ASCII`, `LENGTH`) — char-by-char extraction en blind.
3. **Conditional + delay** (`CASE WHEN`, `SLEEP`) — boolean y time-based.

Sintaxis varía por motor — fingerprinting primero, función después. Hex literals (`0x...`) son escape válido cuando quotes filtradas en MySQL/MSSQL.

***
