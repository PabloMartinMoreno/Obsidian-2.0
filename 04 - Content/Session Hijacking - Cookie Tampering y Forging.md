---
aliases:
  - Cookie Forging
  - Cookie Tossing
  - HttpOnly Bypass
  - Predictable Session ID
tags:
  - type/cheatsheet
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Session Hijacking]]'
  - '[[JWT Attacks]]'
---
# Session Hijacking - Cookie Tampering y Forging

***

## Predictable Session IDs

| **Pattern** | **Vulnerability** | **Notas** |
|:---:|:---:|:---:|
| Sequential IDs | `session=1001`, `session=1002` | Direct prediction. |
| Counter-based | Atomic increment | Same. |
| Timestamp-based | `session=1700000000_xxx` | Pre/post-time. |
| UUIDv1 timestamp | Includes MAC + time | Predictable per second. |
| MD5(username + timestamp) | Weak hash + known input | Crack. |
| Base64(user.timestamp) | Reversible encoding | Direct decode. |
| Math.random()-derived | JS PRNG en cliente | Predictable seed. |
| time()-seeded PRNG | C-style rand() | Same time → same seed. |
| LCG / weak PRNG | Linear congruential | Predict from sample. |
| Username embedded | `session=username_<hash>` | Hash collision possible. |
| Short tokens (<8 bytes) | Bruteforceable | Direct attack. |
| Multiple tokens analysis | 10 tokens → identify pattern | Statistical analysis. |
| Token entropy < 64 bits | Crackable in feasible time | Cryptographic weakness. |
| Hardcoded "secret" en client | Reverse engineering | OSINT. |
| Combine con UUIDv1 vulnerability | Predict per millisecond | Edge but real. |
^sh-tamper-predictable

### Workflow predictable session ID

```bash
# Capture multiple sessions
for i in {1..10}; do
  curl -sI -X POST -d "user=test$i&pass=test" https://target/login \
    | grep -oE 'session=[^;]+' >> sessions.txt
done

# Statistical analysis
echo "=== Token entropy ==="
sort -u sessions.txt | wc -l  # Unique count
hexdump -C sessions.txt | head  # Visual pattern

# Try predict next via libtotem / custom analysis
```

___

## Weak HMAC / Signed Cookies

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Server signs cookie con HMAC. Si secret weak → atacante crack secret + forge cookies | Crypto bypass. |
| Hashcat HS256 | `hashcat -m 16500 cookie.txt rockyou.txt` | Like JWT. |
| Common dev secrets | `secret`, `password`, `key`, `change-me`, app-name | Default. |
| Python Flask `app.secret_key` | Often weak en dev | CVE history. |
| Express cookie-session | `keys: ['secret']` | Weak. |
| Django `SECRET_KEY` | Cracking possible if weak | Standard. |
| Rails `secret_key_base` | Same | Same. |
| Combine con source disclosure | LFI / git leak → read secret | Combo. |
| Length extension attack (legacy MD5/SHA1) | If using MD5(secret + data) sin HMAC | Old vector. |
| Padding oracle (CBC) | Encrypted cookies con padding flaw | Edge. |
| Hashcat custom modes | Custom hash format | Per-app. |
| Brute force online | If short → online brute | Slow. |
^sh-tamper-weak-hmac

___

## JWT Manipulation

| **Vector** | **Reference** | **Notas** |
|:---:|:---:|:---:|
| `alg=none` | See `JWT Attacks` | Standard. |
| Algorithm confusion | RS256 → HS256 | Same. |
| Weak secret | hashcat -m 16500 | Bruteforce. |
| `kid` SQLi | DB-backed | Edge. |
| `kid` path traversal | File-backed | Edge. |
| `jku` injection | Atacante hosts JWKS | Standard. |
| `jwk` embedded | Pubkey en header | Same. |
| Claim manipulation | role, sub, exp | Combine con weak validation. |
| See `JWT Attacks` for full list | Comprehensive | Cross-ref. |
^sh-tamper-jwt

___

## Cookie Tossing (Sub Overrides Parent)

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Subdomain con XSS / takeover sets cookie con `Domain=.target.com` y `Path=/` → overrides parent's session cookie | Cross-subdomain attack. |
| Subdomain XSS sets cookie | `document.cookie = 'session=ATTACKER_SET; Domain=.target.com'` | Direct. |
| Subdomain takeover combo | Sub takeover + cookie set | Standard. |
| `Path=/admin` specific | Only affects admin path | Targeted. |
| Cookie name conflict | Same name as parent → browser may use either | Behavior varies. |
| `__Host-` prefix immune | Cannot Domain attribute | Defense. |
| Force session fixation | Atacante sets known SID | Pre-auth fixation. |
| Force re-auth con own session | Login as atacante's session | UX trick. |
| Combine con CSRF | Set cookie + force action | Compound. |
| Combine con CSP bypass | Subdomain CSP whitelist | Multi-vector. |
| Cookie tossing with HttpOnly limit | Atacante can SET but not READ HttpOnly | Asymmetric. |
| Real-world examples | Cross-subdomain CSRF token override | Common. |
^sh-tamper-tossing

___

## HttpOnly Bypass Tricks

| **Trick** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| `XMLHttpRequest` getResponseHeader | Get `Set-Cookie` from response | Bypass via response header read. |
| `XmlHttpRequest.setRequestHeader('Cookie', ...)` | Set cookie en request — pero browser overrides | Mostly blocked. |
| Service Worker | SW reads response cookies en `Set-Cookie` event | Edge. |
| `ServiceWorker fetch event` | Read response.headers `Set-Cookie` | Modern bypass. |
| Wireshark / network sniff | Direct network read | Out-of-band. |
| Browser DevTools | Reading Set-Cookie response header | Manual. |
| `document.cookie` setter | Doesn't read HttpOnly | Limitation. |
| Frame-based cross-origin read | If iframe origin matches | SOP-bound. |
| HTTP TRACE method (deprecated) | Reflects request including Cookie header | Old attack (XST). |
| Header reflection in error | If app reflects Cookie header en error | Edge. |
| Force redirect con cookie | Browser sends Cookie en redirect | Indirect read. |
| `<img>` load with credentials | Image fetch incluye cookies but no read | One-way. |
| Combine con XSS y fetch | XSS reads response not cookie | Standard. |
| Cross-origin fetch with credentials | If CORS allows credentials read | CORS combo. |
^sh-tamper-httponly-bypass

### Cross-Site Tracing (XST) example

```html
<!-- Old attack (mostly mitigated en modern browsers) -->
<script>
  var xhr = new XMLHttpRequest();
  xhr.open('TRACE', 'https://target.com/', false);
  xhr.send();
  // Response body includes original request:
  // TRACE / HTTP/1.1
  // Cookie: session=HTTPONLY_VALUE  ← reflected!
  console.log(xhr.responseText);
</script>
```

Modern browsers block TRACE method en XHR. Server may also disable TRACE. Edge case ahora.

***
