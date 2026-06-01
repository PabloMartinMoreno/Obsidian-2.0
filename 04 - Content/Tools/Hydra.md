---
aliases:
  - hydra
  - THC-Hydra
tags:
  - tool/hydra
  - technique/credential-access
  - cred/brute-force
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Credential Access]]'
tertiary categories:
  - '[[Password Cracking]]'
linked:
  - '[[netexec]]'
  - '[[ffuf]]'
  - '[[Authentication & Authorization Bypass]]'
  - '[[SSH (22) - Enumeración]]'
  - '[[FTP (21) - Enumeración]]'
  - '[[SMB (139, 445) - Enumeración]]'
  - '[[RDP (3389) - Enumeración]]'
---
# Hydra

***

## Overview

Bruteforcer multi-protocolo. Mantenido por THC. Soporta: HTTP form/basic/digest, SSH, FTP, SMB, RDP, MSSQL, MySQL, PostgreSQL, Oracle, VNC, SNMP, SMTP, POP3, IMAP, LDAP, Redis, MongoDB, TeamSpeak, XMPP, Cisco, y más.

Install: `apt install hydra` / `brew install hydra`.

> Regla: Hydra es ruido puro — bloqueos, lockouts, flood de logs. Verificar antes la política (`nxc smb <dc> --pass-pol`). Para AD preferir [[netexec]] spray (1 password × muchos users).

***

## Sintaxis base

```bash
hydra [opciones] <target> <service> [params]
hydra -l <user> -p <pass> <target> <service>
hydra -L users.txt -P passwords.txt <target> <service>
hydra -l admin -P rockyou.txt <target> <service>
hydra -C combo.txt <target> <service>                  # user:pass per line
```

Service formats: `ssh`, `ftp`, `smb`, `rdp`, `mssql`, `mysql`, `postgres`, `http-get`, `http-post-form`, `http-head`, `https-*`, `http-get-form`, `http-post-form`, `vnc`, `snmp`, `smtp`, `smtp-enum`, `pop3`, `imap`, `ldap2`, `ldap3`, `redis`, `mongodb`, `cisco`, `cisco-enable`, `rsh`, `rlogin`, `rexec`, `telnet`, `xmpp`.

Listar soportados:

```bash
hydra -U <service>           # help de parametrización
hydra -h                     # todos los flags
```

---

## Flags esenciales

| Flag | Función |
|---|---|
| `-l USER` | Single user |
| `-L FILE` | Lista de users |
| `-p PASS` | Single password |
| `-P FILE` | Lista de passwords |
| `-C FILE` | `user:pass` combo list |
| `-e nsr` | `n`=null, `s`=user as pass, `r`=reverse user |
| `-u` | Loop por user primero (para evitar lockouts) |
| `-t N` | Threads paralelos (default 16, bajar a 4 si lockouts) |
| `-T N` | Overall parallel (default 64) |
| `-w N` | Response timeout sec (default 30) |
| `-W N` | Wait entre connects |
| `-f` | Stop al primer hit por host |
| `-F` | Stop al primer hit globalmente |
| `-s PORT` | Puerto custom |
| `-S` | SSL (para servicios que lo soportan) |
| `-V` / `-vV` | Verbose (imprime attempt) |
| `-d` | Debug |
| `-o FILE` | Output a file |
| `-b json/jsonv1/text` | Formato output |
| `-I` | Ignore restore file |
| `-R` | Reanudar desde `hydra.restore` |
| `-4` / `-6` | Force IPv4 / IPv6 |
| `-x MIN:MAX:CHARSET` | Brute force mask (en vez de `-P`) |
| `-M FILE` | Múltiples targets desde file |

### Password mask

```bash
# 4-8 chars, a-z + 0-9
hydra -l admin -x 4:8:a1 target ssh
```

Charsets: `a` = lowercase, `A` = uppercase, `1` = digits, `.` = char literal.

---

## Servicios de red

### SSH

```bash
hydra -l root -P rockyou.txt ssh://target
hydra -L u.txt -P p.txt -t 4 -f target ssh -s 2222
```

Lockout a partir de N intentos en sshd default → `-t 4` / `-W 2`.

### FTP

```bash
hydra -l admin -P p.txt ftp://target
hydra -l admin -P p.txt -s 2121 target ftp
```

### SMB

```bash
hydra -L u.txt -P p.txt target smb
```

Para AD/SMB preferir [[netexec]] (`nxc smb --continue-on-success`). Hydra SMB es slow + no respeta lockout elegantemente.

### RDP

```bash
hydra -L u.txt -P p.txt rdp://target
```

Cuidado: RDP lockouts duros en Windows server + cada intento dispara eventos 4625.

### Telnet

```bash
hydra -l admin -P p.txt telnet://target
hydra -l admin -P p.txt target telnet -s 23
```

### MSSQL / MySQL / PostgreSQL

```bash
hydra -l sa -P p.txt target mssql
hydra -l root -P p.txt target mysql
hydra -L u.txt -P p.txt -s 5432 postgres://target
```

### VNC

```bash
hydra -P p.txt vnc://target                  # sin user
```

### SMTP / POP3 / IMAP

```bash
hydra -l user@target.com -P p.txt smtp://target
hydra -l user -P p.txt -s 465 -S target smtps
hydra -l user@target.com -P p.txt pop3s://target
hydra -l user -P p.txt imap://target -s 143
```

### LDAP

```bash
hydra -l 'cn=admin,dc=target,dc=com' -P p.txt target ldap2
hydra -L u.txt -P p.txt -s 636 -S target ldap3s
```

Payload = `uid=USER,ou=people,dc=...` o `domain\user`.

### SNMP

```bash
hydra -P community-strings.txt target snmp
hydra -P /usr/share/seclists/Discovery/SNMP/snmp.txt -t 1 -s 161 target snmp
```

### Cisco

```bash
hydra -P p.txt target cisco
hydra -P p.txt target cisco-enable               # después de login, el enable pass
```

### Redis / MongoDB

```bash
hydra -P p.txt target redis
hydra -l user -P p.txt target mongodb
```

---

## HTTP

### HTTP Basic / Digest

```bash
hydra -l admin -P p.txt target http-get /admin/
hydra -l admin -P p.txt -s 8443 -S target https-get /api/
```

### HTTP Form — POST

Sintaxis: `"<path>:<body>:<failure_string>"`

```bash
hydra -l admin -P rockyou.txt target http-post-form \
  "/login.php:username=^USER^&password=^PASS^:Invalid credentials"
```

`^USER^` y `^PASS^` = placeholders. `F=...` prefix en failure para regex / string:

```bash
# Falla por cookie / texto
"/login:user=^USER^&pass=^PASS^:F=Invalid"
"/login:user=^USER^&pass=^PASS^:S=Set-Cookie: auth="     # éxito por header
```

Con CSRF token dinámico — Hydra no maneja auto. Usar Burp Intruder o wfuzz con grep-extract.

### HTTP Form — GET

```bash
hydra -l admin -P p.txt target http-get-form \
  "/login.php?user=^USER^&pass=^PASS^:Invalid"
```

### HTTPS + puerto custom

```bash
hydra -l admin -P p.txt -s 443 -S target https-post-form \
  "/login:u=^USER^&p=^PASS^:Invalid"
```

### Headers / cookies

```bash
hydra target http-post-form \
  "/api/login:user=^USER^&pass=^PASS^:H=Cookie\: PHPSESSID=abc; H=X-Forwarded-For\: 127.0.0.1:F=invalid" \
  -l admin -P p.txt
```

Separador entre mini-params dentro del form string = `:`. Escapar `:` literales como `\:` dentro de values.

---

## Opsec / lockout-safe

```bash
# 1 password contra muchos users (password spray)
hydra -L u.txt -p 'Winter2026!' -t 1 -W 10 target ssh
```

Loop por pass (`-u`):

```bash
hydra -L u.txt -P p.txt -u -t 1 -W 5 target smb
```

Thread 1 + wait entre probes → más lento pero evita lockouts masivos.

### Verificar primero

```bash
# Timing para detectar respuesta por intento
time curl -s -d 'user=x&pass=y' http://target/login -o /dev/null
# Observar baseline: status, length, tiempo → usar string correcta en :F=
```

---

## Restore / resume

Hydra guarda `hydra.restore` al detectar interrupción:

```bash
hydra -R                                       # resume último
```

---

## Output

```bash
hydra ... -o found.txt -b json
hydra ... -o found.txt                         # plain text
hydra ... -o found.txt -b jsonv1
```

---

## Comparación con alternativas

| Tool | Cuándo usar |
|---|---|
| **hydra** | Multi-protocolo amplio, default para protocolos diversos |
| **medusa** | Similar a hydra, algunos módulos más rápidos |
| **ncrack** | Especializado en network logins (SSH/RDP/FTP) |
| **patator** | Python, más flexible para auth no estándar |
| **nxc / netexec** | AD/SMB/LDAP/WinRM — lockout-safe por default |
| **ffuf / wfuzz** | Web forms + baseline filtering precisa |
| **crowbar** | RDP especializado, más estable que hydra-rdp |

---

## Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| "All finished" sin hits en web | Failure string incorrecta | Validar con curl + `-V` |
| Lockout tras N intentos | Policy threshold | `-t 1 -W 10` + pre-check policy |
| `[ERROR] child terminated` | Server drops conn | Bajar `-t`, subir `-W` |
| 403/429 respuestas | WAF / rate limit | Rotar proxies, bajar rate, UA headers |
| 100% matches falsos | Failure string en página de éxito también | Cambiar a regex exclusivo: `F=redirect_uri`, `S=Set-Cookie` |

---

## Workflows comunes

### SSH brute tras enum de users

```bash
# Validar lista de users (timing o script válido)
# Luego:
hydra -L valid_users.txt -P /usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt \
      -t 4 -W 3 -f -o ssh.log ssh://target
```

### Web login post-discovery de endpoint

```bash
# Identificar endpoint + failure con Burp repeater → Hydra:
hydra -l admin -P rockyou.txt target http-post-form \
  "/admin/login.php:user=^USER^&pass=^PASS^&csrf=STATIC:Login failed" \
  -V -t 16 -f
```

### SMTP enum (VRFY)

```bash
hydra -L users.txt target smtp-enum
```

### Snmp community

```bash
hydra -P /usr/share/seclists/Discovery/SNMP/snmp.txt target snmp -t 1 -s 161
```

---

## Referencias

- Repo: https://github.com/vanhauser-thc/thc-hydra
- Man page: `man hydra`
- Módulos: `ls /usr/lib/x86_64-linux-gnu/hydra/` o `hydra -U <service>`
