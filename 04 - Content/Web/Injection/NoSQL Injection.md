---
aliases:
  - NoSQLi
  - NoSQL Injection
  - MongoDB Injection
tags:
  - type/vulnerability
  - vuln/nosqli
  - technique/initial-access
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación|Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: CheatSheet
linked:
  - '[[NoSQLi - Operadores (Auth Bypass)]]'
  - '[[NoSQLi - Inyección Sintáctica]]'
  - '[[NoSQLi - JavaScript ($where, mapReduce)]]'
  - '[[NoSQLi - Extracción Blind]]'
  - '[[Burp Suite]]'
---
# NoSQL Injection

***

## Cheatsheet

### 1. In-Band (respuesta directa)

````tabs
tab: **Operadores ($ne, $gt, $regex) — Auth Bypass**
![[NoSQLi - Operadores (Auth Bypass)#^nosqli-operators]]

tab: **Inyección Sintáctica (string concat, JSON escape)**
![[NoSQLi - Inyección Sintáctica#^nosqli-syntax]]
````

### 2. Server-side Code Execution

````tabs
tab: **JavaScript ($where, mapReduce, $function)**
![[NoSQLi - JavaScript ($where, mapReduce)#^nosqli-js]]
````

### 3. Blind / Inferential

````tabs
tab: **Extracción char-by-char ($regex, time-based)**
![[NoSQLi - Extracción Blind#^nosqli-blind]]
````

___

## Overview

**NoSQL Injection** = explotar bases de datos NoSQL (MongoDB, CouchDB, ElasticSearch, Cassandra, Redis) mediante manipulación de queries construidas con user input sin sanitizar. MongoDB es el target más común (>60% de las NoSQL vulns reportadas).

Diferencia vs SQLi clásico: NoSQL usa **objetos JSON** y **operadores** (`$ne`, `$gt`, `$where`) en lugar de SQL string. Eso cambia los vectores pero el principio es el mismo — input no sanitizado termina en query trusted.

### Motores NoSQL y sus vectores

| Motor | Lenguaje query | Vector principal |
|---|---|---|
| **MongoDB** | BSON/JSON + operators ($) | Operator injection, $where JS |
| **CouchDB** | HTTP + JS views/map-reduce | View queries, map functions |
| **ElasticSearch** | REST + query DSL | query_string injection |
| **Cassandra** | CQL (SQL-like) | SQLi-style en CQL |
| **Redis** | Commands via TCP | Command injection via gopher SSRF |

### Identificación

1. **App usa MongoDB?** → Check:
   - Endpoint `/api/login` acepta JSON body.
   - Stack Node.js / Express / Mongoose / NestJS / FastAPI + motor.
   - MongoDB default ports `27017` expuestos + fingerprint via `nmap -sV`.

2. **Probes mínimos:**
   - JSON: `{"user":{"$ne":null}}` → si cambia response = NoSQLi.
   - URL-encoded: `user[$ne]=x` → Express con extended parser.
   - Comillas: `admin'` → error/crash = string concatenation.

3. **Fingerprint:**
   - Error messages con `MongoError`, `Mongoose`, `E11000`, `CastError`.
   - Response con ObjectId (`507f1f77bcf86cd799439011`).

### Vectores de inyección por función

| Función app | Vector NoSQLi típico |
|---|---|
| **Login / auth** | [[NoSQLi - Operadores (Auth Bypass)]] — `$ne` / `$regex` |
| **Search / filter** | [[NoSQLi - JavaScript ($where, mapReduce)]] — `$where` JS |
| **User lookup by ID** | Inyección en `_id` field → `{"_id":{"$oid":"..."}}`. |
| **Password reset / OTP** | [[NoSQLi - Extracción Blind]] — char-by-char del token. |
| **API que acepta query DSL** | [[NoSQLi - Inyección Sintáctica]] — raw query construction. |

___

## Workflow de explotación

```
1. Detectar motor NoSQL (Stack fingerprint, error msgs, ports).
2. Probar operator injection simple:
   {"user":{"$ne":null}, "pass":{"$ne":null}}
3. Si auth bypass OK → confirmar acceso, enum permisos.
4. Si blind (no diff en response) → time-based con $where loop.
5. Si acceso DB directo (ej: MongoDB expuesto 27017) → enum collections.
6. Si versión ≤4.0 → probar db.eval / mapReduce para JS arbitrario.
7. Exfil por chars con $regex^ boolean oracle.
```

___

## Detección rápida con herramientas

```bash
# NoSQLMap (SQLMap-style para NoSQL)
python NoSQLMap.py
# Opción 1: Set options → URL http://target/login
# Opción 2: Scan sites → inyecciones auto

# Ffuf con wordlist de operadores
ffuf -w /usr/share/seclists/Fuzzing/NoSQL-Payloads.txt \
     -u "http://target/login" \
     -X POST \
     -d "user=admin&pass=FUZZ" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -fc 401

# Burp Suite → Intruder con payloads NoSQLi
# Lista PayloadsAllTheThings/NoSQL Injection/Intruder/
```

___

## Impacto

- **Auth bypass** — login como cualquier user sin creds.
- **Data extraction** — dump de colecciones via boolean/time oracle.
- **RCE** (raro, legacy) — `db.eval` method / mapReduce en MongoDB ≤4.2.
- **DoS** — loops infinitos en `$where` / `$function`.
- **Horizontal privesc** — IDOR-style accediendo a docs de otros users.

___

## Mitigación (defender)

- **Parametrized queries**: Mongoose schemas con tipos estrictos (`String`, no `Mixed`).
- **Input validation**: reject JSON body con keys empezando en `$`.
- **Libs de sanitización**:
  - Express: `express-mongo-sanitize` (strip keys con `$` y `.`).
  - MongoDB driver: `--noscripting` flag para disable `$where`.
- **Type coercion**: `String(req.body.username)` antes de pasar a query.
- **WAF**: reglas para operadores NoSQL en request body.

___

## Para entender NoSQL Injection

**Diferencia con SQLi clásico:**
- SQL = string query, concatenación = bug.
- NoSQL = objeto JSON, operators embebidos = bug.
- Ambos = user input llega al query builder sin tipo/validación.

**MongoDB y Mongoose:**
- MongoDB driver acepta queries `{campo: valor}` o `{campo: {$op: valor}}`.
- Mongoose normalmente enforce schemas, PERO:
  - `{strict: false}` en schema → cualquier field pasa.
  - `findOne({...req.body})` → todos los ops del user pasan.
  - Middleware body-parser con `extended: true` → URL query parse como objeto.

**Por qué $where es especial:**
- Ejecuta JS en el contexto del MongoDB server (process separado del backend).
- Sandbox V8 pero sin Node APIs → no filesystem, no network directo.
- Aún así permite: loops (DoS), acceso a TODOS los fields de TODOS los docs, boolean oracle.

___

## Recursos

- [PortSwigger - NoSQL Injection](https://portswigger.net/web-security/nosql-injection)
- [PayloadsAllTheThings - NoSQL](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/NoSQL%20Injection)
- [HackTricks - NoSQL Injection](https://book.hacktricks.xyz/pentesting-web/nosql-injection)
- [NoSQLMap](https://github.com/codingo/NoSQLMap) — tool automática.
- [OWASP Testing Guide - NoSQL](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection)

***
