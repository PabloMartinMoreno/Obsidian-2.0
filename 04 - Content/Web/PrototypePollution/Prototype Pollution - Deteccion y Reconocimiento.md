---
aliases:
  - PP Detection
  - Prototype Pollution Recon
tags:
  - type/technique
  - vuln/prototype-pollution
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Prototype Pollution]]"
---
# Prototype Pollution - Detección y Reconocimiento

***

## Identificar Sinks Vulnerables

| **Sink** | **Lib / función** | **Pattern vulnerable** |
|:---:|:---:|:---:|
| Recursive merge | `lodash.merge`, `_.merge`, `_.mergeWith` | `_.merge({}, userInput)` |
| Deep set | `lodash.set`, `_.set` | `_.set(obj, userKey, userVal)` |
| Defaults deep | `lodash.defaultsDeep` | Deep recursive defaults. |
| jQuery extend | `$.extend(true, target, src)` | `true` flag = recursive (vulnerable). |
| jQuery deep clone | `$.extend(true, {}, src)` | Mismo. |
| Object.assign loop | Custom loops que iteran keys recursivos | Re-implementación insegura. |
| Setval / DotProp | `dot-prop`, `set-value`, `unset-value`, `merge-deep` | Múltiples libs npm afectadas. |
| Mongoose | `Schema.findOneAndUpdate` con user-controlled `$set` | NoSQL operator injection + PP combo. |
| qs library | Express default — `qs.parse('?__proto__[admin]=1')` | Query string parser. |
| body-parser | Si `extended:true` con qs | Express. |
| express-fileupload | Versions <1.1.10 con `parseNested:true` | CVE-2020-7699. |
| Hoek (Hapi) | `Hoek.applyToDefaults` viejo | CVE-2018-3728. |
| immer (Redux) | `produce()` con draft mutation | Versions specific. |
| Async / async-each | Iteradores que mergean | Edge case. |
| Vue 2.x reactivity | `Vue.set` mal usado | Client-side. |
| Webpack DefinePlugin | `__proto__` en config | Build-time. |
^pp-detect-sinks

### grep patterns para detectar uso

```bash
# Server-side Node
grep -rE "_.merge\(|_\.set\(|_\.defaultsDeep\(" .
grep -rE "\\$\\.extend\\(\\s*true" .
grep -rE "Object\\.assign\\(.*req\\." .

# Client-side
grep -rE "JSON\\.parse\\(location" .
grep -rE "\\.search\\.|\\.hash\\." .

# Express con qs vulnerable
grep -rE "extended:\\s*true" .
grep -rE "express-fileupload" package.json

# Buscar versiones vulnerables conocidas
npm audit
yarn audit
```

___

## Probes en Endpoints

| **Endpoint type** | **Payload probe** | **Indicador** |
|:---:|:---:|:---:|
| JSON POST body | `{"__proto__":{"polluted":"true"}}` + GET subsecuente | Si nuevos requests muestran `polluted:true` en respuestas, pollution global. |
| JSON nested | `{"a":{"__proto__":{"polluted":"yes"}}}` | Para sinks que descienden niveles. |
| URL query string | `?__proto__[polluted]=true` o `?__proto__.polluted=true` | qs library en Express. |
| URL bracket notation | `?obj[__proto__][polluted]=true` | Rails-style parser. |
| URL constructor pattern | `?constructor[prototype][polluted]=true` | Bypass __proto__ filter. |
| Multipart form-data | `polluted` field con `__proto__[admin]=true` | File upload PP. |
| Verify pollution | Endpoint POST → GET / (different path) → buscar `polluted` reflejado | Confirma global. |
| Status code probe | Pollute `__proto__.toString` → response cambia | Indirect indicator. |
| Method probe | Pollute `__proto__.test` → next call a `.test()` lo refleja | Method-name pollution. |
| Cookie probe | Cookie `__proto__=...` parsed by lib vulnerable | Edge case. |
| GraphQL variables | Variables JSON con `__proto__` keys | GraphQL servers. |
| WebSocket message | JSON message con `__proto__` | WS handlers. |
^pp-detect-probes

### Probes server-side

```bash
# Probe basic
curl -X POST https://target/api/profile \
  -H "Content-Type: application/json" \
  -d '{"__proto__":{"polluted":"yes"}}'

# Verificar pollution global
curl https://target/api/health
# Si response incluye "polluted":"yes" o behavior cambia → vulnerable

# Probe via query string
curl "https://target/api/?__proto__[polluted]=yes"

# Probe constructor
curl -X POST https://target/api/profile \
  -H "Content-Type: application/json" \
  -d '{"constructor":{"prototype":{"polluted":"yes"}}}'
```

___

## Análisis Estático de Código JS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Source code review | Buscar `merge`, `extend`, `set` con user input | Manual code review. |
| AST analysis | ESLint plugin `eslint-plugin-security` | Detecta patterns automáticamente. |
| `semgrep` rules | Reglas predefinidas para PP | https://semgrep.dev/p/javascript |
| `snyk` | Scanner comercial | Detection nivel CVE. |
| `npm audit` | Built-in npm | Reporta libs con CVE de PP. |
| `socket.dev` | Supply chain analysis | Identifica libs riesgosas. |
| Source map analysis | Cuando solo tenés bundled JS | Revertir minified source. |
| Webpack-bundle-analyzer | Inspeccionar bundle final | Lista libs cargadas. |
| `js-callgraph` | Construye callgraph del JS | Trace de input a sink. |
| Burp passive scanner | Detecta JS files con libs vulnerables | Pasivo. |
| Burp DOM Invader | Auto-detecta sinks DOM-based | Activo Burp Pro. |
| Visual inspection en Sources | DevTools → Sources → buscar `__proto__` literal | Manual debug. |
| Breakpoint en sinks | Set breakpoint en `Object.assign`, `_.merge` etc | Runtime inspection. |
^pp-detect-static

### Workflow de detección

```
1. Identificar app stack (Node Express / Vue / React / Angular).
2. Buscar libs en package.json con CVE conocidos:
   - lodash <4.17.21
   - dot-prop <5.1.1
   - set-value <2.0.1
   - merge <2.1.1
   - express-fileupload <1.1.10
3. grep en source para sinks (merge/set/extend con user input).
4. Probe activo con __proto__/constructor patterns.
5. Verificar pollution global con request a endpoint distinto.
6. Si pollution confirmed → buscar gadget para escalar.
```

***
