---
aliases:
  - PP
  - JavaScript Prototype Pollution
  - Object Prototype Pollution
tags:
  - type/vulnerability
  - vuln/prototype-pollution
  - technique/initial-access
  - technique/execution
  - technique/privilege-escalation
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: Hub
linked:
  - "[[Prototype Pollution - Vectores Server-Side]]"
  - "[[Prototype Pollution - Vectores Client-Side]]"
  - "[[Prototype Pollution - Gadgets y Explotacion]]"
  - "[[Prototype Pollution - Tooling]]"
  - "[[Prototype Pollution - Bypasses y Filter Evasion]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Insecure Deserialization]]"
  - "[[Burp Suite]]"
---
# Prototype Pollution

***

## Cheatsheet

### 🌐 Vectores Server-Side

````tabs
tab: **Lodash (`_.merge` / `_.set`)**
![[Prototype Pollution - Vectores Server-Side#^pp-server-lodash]]

tab: **jQuery `$.extend` deep**
![[Prototype Pollution - Vectores Server-Side#^pp-server-jquery]]

tab: **Express body-parser y `qs`**
![[Prototype Pollution - Vectores Server-Side#^pp-server-express]]

tab: **Mongoose Schema Bypass**
![[Prototype Pollution - Vectores Server-Side#^pp-server-mongoose]]

tab: **`Object.assign` con Input**
![[Prototype Pollution - Vectores Server-Side#^pp-server-objectassign]]
````

### 💻 Vectores Client-Side

````tabs
tab: **URL Hash / Search Injection**
![[Prototype Pollution - Vectores Client-Side#^pp-client-url]]

tab: **JSON.parse + Merge**
![[Prototype Pollution - Vectores Client-Side#^pp-client-json]]

tab: **DOM-based Pollution**
![[Prototype Pollution - Vectores Client-Side#^pp-client-dom]]

tab: **postMessage Abuse**
![[Prototype Pollution - Vectores Client-Side#^pp-client-postmessage]]
````

### 💀 Gadgets y Explotación

````tabs
tab: **RCE via child_process**
![[Prototype Pollution - Gadgets y Explotacion#^pp-gadget-rce]]

tab: **Auth Bypass**
![[Prototype Pollution - Gadgets y Explotacion#^pp-gadget-auth]]

tab: **XSS via Sanitizer Gadget**
![[Prototype Pollution - Gadgets y Explotacion#^pp-gadget-xss]]

tab: **DoS / Property Override**
![[Prototype Pollution - Gadgets y Explotacion#^pp-gadget-dos]]

tab: **Property Injection / Logic**
![[Prototype Pollution - Gadgets y Explotacion#^pp-gadget-logic]]
````

### 🛠️ Tooling

````tabs
tab: **Burp DOM Invader**
![[Prototype Pollution - Tooling#^pp-tool-burp-dom]]

tab: **ppmap**
![[Prototype Pollution - Tooling#^pp-tool-ppmap]]

tab: **PPScan / ppfuzz**
![[Prototype Pollution - Tooling#^pp-tool-scanners]]

tab: **Custom Payloads y Wordlists**
![[Prototype Pollution - Tooling#^pp-tool-payloads]]
````

### 🛡️ Bypasses y Filter Evasion

````tabs
tab: **`__proto__` Blocked → `constructor.prototype`**
![[Prototype Pollution - Bypasses y Filter Evasion#^pp-bypass-constructor]]

tab: **Notación Bracket vs Dot**
![[Prototype Pollution - Bypasses y Filter Evasion#^pp-bypass-notation]]

tab: **JSON Encoding Tricks**
![[Prototype Pollution - Bypasses y Filter Evasion#^pp-bypass-encoding]]

tab: **Array vs Object Polyglot**
![[Prototype Pollution - Bypasses y Filter Evasion#^pp-bypass-array]]

tab: **Header / Cookie Smuggling**
![[Prototype Pollution - Bypasses y Filter Evasion#^pp-bypass-header]]
````

___

## Overview

**Prototype Pollution (PP)** = vulnerabilidad específica de JavaScript donde el atacante modifica `Object.prototype` (o el prototipo de otra clase built-in), inyectando propiedades que **todos los objetos del runtime heredan**. Un cambio aparentemente local (`obj.x = "y"`) se propaga globalmente porque JS resuelve atributos no encontrados subiendo por la prototype chain.

Vector clase A en Node.js / browser JS — descubierto formalmente por Olivier Arteau (2018, NorthSec) aunque variantes existían antes. Múltiples CVEs en lodash, jQuery, mongoose, express-fileupload, etc.

### Cómo funciona

```javascript
// JS normal: leer atributo recorre prototype chain
const obj = {};
console.log(obj.foo);  // undefined — no foo en obj ni en Object.prototype

// Pollution
Object.prototype.foo = "polluted";

// Ahora TODOS los objetos heredan foo
console.log(obj.foo);            // "polluted"
console.log({}.foo);             // "polluted"
console.log({a:1}.foo);          // "polluted"
console.log(new Date().foo);     // "polluted"
```

Atacante NO necesita acceso directo a Object.prototype — basta con inyectar la key `__proto__` o `constructor.prototype` en JSON merge / set / extend operations.

### Diferencia con otras vulnerabilidades JS

| | **Prototype Pollution** | **DOM XSS** | **NoSQL Injection** |
|---|---|---|---|
| Vector | `__proto__` en input | `innerHTML` con input | Query operators |
| Impacto | Pollute global state | Script execution | Auth bypass |
| Defense | No iterar `__proto__` keys | Output encoding | Type validation |
| Lenguaje | Solo JS | Any (via JS) | Any con NoSQL |

___

## Workflow de explotación

```
1. Identificar app stack JavaScript:
   - Server: Node + Express + Lodash + Mongoose
   - Client: jQuery / Vue / React / Angular

2. Detectar sinks PP (merge / set / extend / custom recursive):
   - npm audit
   - grep en source
   - Burp DOM Invader (client-side)

3. Probe activo:
   - JSON body: {"__proto__":{"polluted":"yes"}}
   - URL: ?__proto__[polluted]=yes
   - postMessage: cross-origin con payload

4. Verificar pollution global:
   - Endpoint distinto refleja `polluted:yes`
   - Comportamiento app cambia

5. Identificar gadget para escalar:
   - RCE: pollute child_process.spawn options (NODE_OPTIONS)
   - Auth bypass: pollute isAdmin / role / permissions
   - XSS: pollute sanitizer config (DOMPurify ALLOWED_TAGS)
   - DoS: pollute toString / valueOf

6. Combinar bypass de filtros si necesario:
   - __proto__ blocked → constructor.prototype
   - top-level filter → nested {"a":{"__proto__":...}}
   - dot notation → bracket / array notation
```

___

## Detección rápida

### Indicadores en código backend

```javascript
// Node.js — VULN
const _ = require('lodash');
app.post('/api', (req, res) => {
    _.merge(config, req.body);  // VULN si req.body tiene __proto__
});

// Node.js — VULN custom
function deepMerge(target, source) {
    for (const key in source) {  // recorre __proto__ también si en source
        if (typeof source[key] === 'object') {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}

// Node.js — SAFE
function safeMerge(target, source) {
    for (const key of Object.keys(source)) {  // Object.keys no incluye __proto__
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        // ...recurse...
    }
}
```

### Probes mínimos

```bash
# 1. Server-side JSON
curl -X POST https://target/api/x \
  -H "Content-Type: application/json" \
  -d '{"__proto__":{"polluted":"yes"}}'

# 2. Verificar pollution con request a OTRO endpoint
curl https://target/api/health
# Si response contiene "polluted":"yes" → vulnerable global

# 3. Server-side query string (Express)
curl "https://target/?__proto__[polluted]=yes"

# 4. Client-side (browser console)
# Visit https://target/?#__proto__.polluted=yes
# Then in console: ({}).polluted  → "yes" si vulnerable
```

___

## Impacto

- **RCE en server (Node.js)** — pollute `NODE_OPTIONS` / `shell` / `execArgv` → arbitrary code execution.
- **Auth bypass** — pollute `isAdmin` / `role` / `permissions` → privilege escalation.
- **XSS via sanitizer gadget** — pollute DOMPurify config → bypass HTML sanitization.
- **DoS** — pollute `toString` / `valueOf` / `length` → app crashes.
- **Logic corruption** — feature flags / defaults / timeouts cambiados → behavior anómalo.
- **Data leak** — pollute para forzar logging / debug mode → secrets exposed.
- **CSRF token bypass** — si validation lee de objeto con prototype polluted.

___

## Mitigación (defender)

- **Usar Map/Set en lugar de Object para data dinámico** — Map no tiene prototype chain.
- **`Object.create(null)`** — crea objetos sin prototype.
- **Filter `__proto__`, `constructor`, `prototype` keys** en cualquier merge/set:
  ```javascript
  if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
  ```
- **`Object.freeze(Object.prototype)`** al iniciar app — prevente cualquier mutation:
  ```javascript
  // Inicio de app
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);
  Object.freeze(String.prototype);
  ```
- **Use libraries safe**:
  - `lodash` 4.17.21+
  - `mongoose` con `strict: true`
  - `express` con `extended: false` (qs simple) o `qs` <6.10.3 patched
- **Validate JSON schema** — usar Joi, Zod, Ajv para rejectar keys inesperadas.
- **No iterar `for...in` en data untrusted** — usar `Object.keys()` o `Object.hasOwn()`.
- **Static analysis** — semgrep, eslint-plugin-security, snyk en CI.
- **`--disable-proto=delete`** flag de Node.js (Node 12.6+) — elimina `__proto__` del runtime.
- **Type validation** — TypeScript strict mode + runtime checks.
- **Audit deps** — `npm audit` / `yarn audit` regular + Dependabot.

___

## Para entender Prototype Pollution

**Por qué JS tiene prototypes:**

JavaScript es **prototype-based** (no class-based como Java/Python). Cada objeto tiene un link interno a su "prototype" — otro objeto del cual hereda atributos. Si pedís `obj.foo` y obj no tiene foo propio, JS sube por la prototype chain.

```
obj → Object.prototype → null
```

Cuando inyectás `Object.prototype.foo = "x"`, **todos** los objetos del programa heredan `foo`.

**Por qué `__proto__` es tan peligroso:**

`__proto__` es un getter/setter en `Object.prototype` que apunta al prototype interno del objeto. Setear `obj.__proto__.x = 'y'` modifica el prototype, no el objeto. Si una librería hace `merge(obj, userInput)` recursivamente y userInput tiene clave `__proto__`, el merge sigue la chain y modifica el prototype global.

**Por qué `constructor.prototype` también:**

Cada función tiene `.prototype` que se usa para `new`. `Object.constructor` apunta a la función `Object`. `Object.constructor.prototype === Object.prototype`. Setear `obj.constructor.prototype.x` modifica el prototype también — bypass de filtros que solo bloquean `__proto__`.

**Diferencia client vs server:**

- **Client-side**: pollution afecta solo la pestaña del usuario. Útil para XSS chains, bypass de validations cliente, hijack de SPAs.
- **Server-side**: pollution afecta a TODOS los requests subsecuentes en el mismo proceso Node. Persistencia + impacto en otros usuarios.

___

## Recursos

- [PortSwigger - Prototype Pollution](https://portswigger.net/web-security/prototype-pollution) — labs y conceptos.
- [PortSwigger Research - Server-side PP](https://portswigger.net/research/server-side-prototype-pollution) — paper Gareth Heyes (2022).
- [Olivier Arteau - JavaScript Prototype Pollution Attack in NodeJS (NorthSec 2018)](https://github.com/HoLyVieR/prototype-pollution-nsec18) — paper original.
- [PayloadsAllTheThings - PP](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Prototype%20Pollution) — payloads.
- [HackTricks - Prototype Pollution](https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution) — referencia.
- [BlackFan - Client-side PP](https://github.com/BlackFan/client-side-prototype-pollution) — collection de gadgets client-side.
- [GitHub Snyk Vulnerability DB - PP CVEs](https://security.snyk.io/vuln?type=npm&search=prototype%20pollution) — CVE list.
- [Burp DOM Invader docs](https://portswigger.net/burp/documentation/desktop/tools/dom-invader/prototype-pollution) — tool oficial.

***
