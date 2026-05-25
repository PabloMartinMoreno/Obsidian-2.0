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
# SQL - Estructura Básica

***

## Cheatsheet

| **Sintaxis** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT col1, col2 FROM tabla` | Filas con esas columnas | Lectura básica. |
| `SELECT * FROM esquema.tabla` | Todas las columnas de tabla con esquema explícito | Cuando hay múltiples DBs con misma tabla. |
| `WHERE columna = 'valor'` | Filtra filas que matchean | Punto de inyección típico — `WHERE id = $input`. |
| `WHERE 1=1` | Tautología — siempre true | Bypass de auth. |
| `-- comentario` o `# comentario` (MySQL) o `/* ... */` | Anula resto de query | Truncar query original post-inyección. `--` requiere espacio después en MySQL. |
| `--+` o `-- -` | Comentario con marker — espacio garantizado | Workaround para MySQL `--` strict. |
| `;` | Termina sentencia, permite stacked queries | MSSQL/PostgreSQL aceptan stacked. MySQL/PHP típicamente NO. |
| `SELECT ... ; INSERT INTO logs VALUES ('x')` | Stacked queries — segunda sentencia ejecuta | MSSQL, PostgreSQL con drivers que soporten. |
^sql-base

### Sintaxis de comentarios por motor

| Motor | Comentarios soportados |
|:---:|:---:|
| MySQL/MariaDB | `-- ` (con espacio), `#`, `/* ... */`, `/*! version */` (executable comment) |
| PostgreSQL | `-- `, `/* ... */` |
| MSSQL | `--`, `/* ... */` |
| Oracle | `--`, `/* ... */` |
| SQLite | `--`, `/* ... */` |

### Stacked queries support

| Driver | Stacked OK |
|:---:|:---:|
| PHP `mysqli_query()` | ❌ (`mysqli_multi_query` sí) |
| PHP PDO MySQL | ❌ (default) / ✅ con `PDO::ATTR_EMULATE_PREPARES=true` |
| PHP `mssql_query` | ✅ |
| Java JDBC | ✅ |
| .NET SqlCommand | ✅ |

___

## Overview

Bloques básicos de SQL — keywords mínimos para construir inyecciones. Stacked queries (varias sentencias separadas por `;`) son letales pero raros en MySQL/PHP por restricciones del driver. MSSQL + Java/.NET típicamente permiten.

Comentarios truncan la query original — necesario después de inyectar payload para evitar errores de sintaxis del resto de la query del backend.

***
