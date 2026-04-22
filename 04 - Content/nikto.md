---
aliases:
  - Nikto
tags:
  - type/tool
  - tool/nikto
  - technique/recon/active
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Recon]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Tool
linked:
  - "[[Web Enumeration]]"
  - "[[Fingerprinting]]"
  - "[[Burp Suite]]"
  - "[[nmap]]"
---
# nikto

***

## Cheatsheet

| Uso | Comando |
| --- | --- |
| **Full scan** | `nikto -h http://target` |
| **Puerto custom** | `nikto -h target -p 8080` |
| **HTTPS** | `nikto -h https://target -ssl` |
| **Auth** | `nikto -h target -id user:pass` |
| **Via proxy** | `nikto -h target -useproxy http://127.0.0.1:8080` |
| **Output** | `nikto -h target -o out.html -Format htm` |
| **Evasion** | `nikto -h target -evasion 14678` |
| **Tuning categorías** | `nikto -h target -Tuning 4` |
| **Multi-target** | `nikto -h targets.txt` |

***

## Concepto

Scanner web legacy (Perl) que chequea ~7000 issues conocidos: files/dirs default, versions vulnerables, misconfigs comunes. Ruidoso pero rápido para baseline inicial. Complementa con [[Burp Suite]] scanner para profundidad.

## 1. Opciones core

| Flag | Uso |
| --- | --- |
| `-h` | Target (URL, IP o file con lista). |
| `-p` | Puerto (default 80/443 según `-ssl`). |
| `-ssl` | Forzar HTTPS. |
| `-nossl` | Forzar HTTP. |
| `-id user:pass` | Basic auth. |
| `-C all` | Probar todas las combinaciones CGI. |
| `-D V` | Display verbose. |
| `-Display V` | Alias verbose. |
| `-timeout 10` | Timeout request. |
| `-maxtime 5m` | Max scan duration. |
| `-root /app` | Prefix path para target. |
| `-vhost target.com` | Host header custom (vhost). |
| `-nolookup` | Skip reverse DNS. |

## 2. Tuning (categorías de checks)

```bash
nikto -h target -Tuning 4      # solo injection
nikto -h target -Tuning 1234567890abc    # todas
nikto -h target -Tuning x6     # todas excepto Remote File Retrieval (x excluye)
```

| # | Categoría |
| --- | --- |
| 0 | File Upload |
| 1 | Interesting Files / Misconfig |
| 2 | Misconfiguration / Default File |
| 3 | Information Disclosure |
| 4 | Injection (XSS/Script/HTML) |
| 5 | Remote File Retrieval — Inside Web Root |
| 6 | Denial of Service |
| 7 | Remote File Retrieval — Server Wide |
| 8 | Command Execution / Remote Shell |
| 9 | SQL Injection |
| a | Authentication Bypass |
| b | Software Identification |
| c | Remote Source Inclusion |
| x | Reverse Tuning (excluir) |

## 3. Evasion (IDS/WAF)

```bash
nikto -h target -evasion 1     # Random URI encoding
nikto -h target -evasion 14678 # combo (bitmask csv)
```

| # | Técnica |
| --- | --- |
| 1 | Random URI encoding (non-UTF8) |
| 2 | Self-reference directories (`/./`) |
| 3 | Premature URL ending |
| 4 | Prepend long random string |
| 5 | Fake parameter |
| 6 | TAB como spacer |
| 7 | Cambio random upper/lower case |
| 8 | Use Windows dir separator `\` |

## 4. Auth / sessions

```bash
# Basic auth
nikto -h target -id user:pass

# Cookie
nikto -h target -Cookies 'session=ABC; role=admin'

# Authorization header
nikto -h target -useragent "Mozilla/5.0" -H "Authorization: Bearer X"
```

## 5. Output

```bash
# HTML report
nikto -h target -o report.html -Format htm

# Otros formatos: csv, json, nbe, sql, txt, xml
nikto -h target -o report.json -Format json
nikto -h target -o report.xml -Format xml

# Append a file existente
nikto -h target -o report.txt -Format txt
```

## 6. Integración

```bash
# nmap → nikto automático
nmap -p 80,443 --script http-nikto target

# Input nmap XML
nmap -oX scan.xml -p 80,443 target && nikto -h scan.xml -Format xml
```

## 7. Tips

- **Ruidoso** — cada engagement EDR/WAF lo flaggea. Usar `-evasion` y `-timeout 30` para reducir probabilidad de block.
- Plugin-based: `-list-plugins` → lista, `-Plugins "apache_expect_xss"` → run específico.
- Database actualizable: `nikto -update`.
- No hace vuln validation profundo — los hits son prob/likely, no confirm. Validar manualmente.

## Workflow típico

```bash
# 1. Baseline rápido
nikto -h http://target -o nikto.html -Format htm

# 2. Si WAF detectado
nikto -h target -evasion 14 -timeout 30

# 3. Paralelo con ffuf/feroxbuster para dir brute
feroxbuster -u http://target -w raft-medium.txt --smart
```

## Recursos

- [nikto GitHub](https://github.com/sullo/nikto)

***
