---
aliases:
  - "Git Hooks"
  - "Gitea"
  - "Github Project Enumeration"
  - Shodan & Censys Recon
  - Pastebin & Code Leaks
  - Wayback Machine & Archive Recon
  - Cloud Buckets & Blobs Discovery
  - Email Harvesting
  - Breach Data Search
  - Performing Whois Lookup
  - Honeytokens & Tracking Pixels
tags:
  - technique/recon/passive
kind: CheatSheet
linked:
  - "[[GitHub Dorking]]"
  - "[[Google Dorking]]"
  - "[[Certificate Transparency Logs]]"
---
# OSINT Methods

> [!info]
> Cheatsheet de fuentes pasivas para recopilar información sin tocar target. Cubre dorking en motores especializados, breach DBs, archive sites, social, métodos honeypot.

***

## Search engines / dorking

| Engine | Foco | URL |
|---|---|---|
| Google | Web general — operadores avanzados | `site:`, `inurl:`, `filetype:`, `intitle:` |
| GitHub | Code repos — secrets, configs | [[GitHub Dorking]] |
| Shodan | IoT/devices indexados con banners | `shodan.io` |
| Censys | Cert + service scan global | `censys.io` |
| FOFA | Alternativa Shodan china | `fofa.info` |
| ZoomEye | Idem | `zoomeye.org` |
| Hunter.how | Asset discovery | `hunter.how` |
| Netlas.io | Modern + UI rich | `netlas.io` |

***

## Shodan / Censys recon

```bash
# Shodan CLI
shodan init <API_KEY>
shodan search 'http.title:"Login" country:AR'
shodan host 1.2.3.4
shodan count 'apache'

# Búsquedas útiles
'org:"Target Inc"'
'hostname:.target.com'
'ssl:"target.com"'              # certs matching domain
'http.html_hash:<hash>'         # otros sites con misma página
'product:Jenkins'

# Censys CLI
censys search '"target.com"' --index-type=hosts
censys view 1.2.3.4
```

***

## Pastebin & code leaks

| Site | Foco |
|---|---|
| **pastebin.com** | Manual + Google `site:pastebin.com "target.com"` |
| **ghostbin** | Alternativa Pastebin |
| **0bin.net** | Encrypted pastes (less searchable) |
| **PSBDMP.ws** | Pastebin dump search engine |
| **PasteHunter** | Tool para monitor pastes en tiempo real |

```bash
# Google dork
site:pastebin.com OR site:ghostbin.com OR site:rentry.co "target.com"

# Automated monitor
git clone https://github.com/kevthehermit/PasteHunter
# Configurar regex rules + Slack/Elasticsearch sink
```

***

## Wayback Machine & Archive Recon

```bash
# Listar URLs históricas
curl -s "http://web.archive.org/cdx/search/cdx?url=target.com&output=json&limit=1000" | jq

# Tool moderno
waybackurls target.com > urls.txt

# Mass extract de URLs históricas (incluye JS/PDF/etc)
gau target.com   # getallurls

# Buscar archivos sensibles en URLs históricas
cat urls.txt | grep -iE '\.(bak|sql|env|log|config|xml|json|key|pem)'

# Wayback content snapshot
curl -s 'http://archive.org/wayback/available?url=target.com&timestamp=20180101' | jq
```

Otros archive sites:
- `archive.today` / `archive.ph` — single-page captures
- `cache.google.com` — Google cache (limitado moderno)

***

## Cloud Buckets & Blobs Discovery (passive)

```bash
# Permutar nombres comunes
for prefix in '' 'dev-' 'prod-' 'staging-' 'backup-' 'logs-'; do
  for suffix in '' '-backup' '-dev' '-logs' '-static' '-data'; do
    name="${prefix}target${suffix}"
    curl -s -o /dev/null -w "%{http_code} $name\n" \
      "https://${name}.s3.amazonaws.com/"
  done
done

# Tools dedicated
S3Scanner scan -f wordlist.txt
GCPBucketBrute -k target
cloudenum --keyword target
```

Ver [[AWS Enumeration]], [[Azure Enumeration]], [[GCP Enumeration]].

***

## Email Harvesting

```bash
# theHarvester — clásico
theHarvester -d target.com -b google,bing,duckduckgo,linkedin,hunter -l 500

# Hunter.io (API)
curl "https://api.hunter.io/v2/domain-search?domain=target.com&api_key=<KEY>"

# Snov.io
# RocketReach
# Phonebook.cz

# Inferir formato
# Si Hunter retorna jdoe@target.com → formato 'first_initial+last'
# Generar lista
cat empleados.txt | awk '{print tolower(substr($1,1,1))$2 "@target.com"}'

# LinkedIn → LinkedIn2Username
linkedin2username -c "Target Inc" -d target.com
```

***

## Breach Data Search

| Source | Tipo |
|---|---|
| **HaveIBeenPwned** (`haveibeenpwned.com`) | Free check + API |
| **DeHashed** (`dehashed.com`) | Paid, breach + plaintext passwords |
| **IntelX** (`intelx.io`) | Paid, broader scope |
| **LeakCheck** | Idem |
| **Snusbase** | Idem |
| **BreachDirectory** | Aggregator |
| Manual: **ComboLists / dumps** | Underground, raw breach DBs |

```bash
# HIBP API (free para domain check, paid para data)
curl 'https://haveibeenpwned.com/api/v3/breachedaccount/test@target.com' \
  -H 'hibp-api-key: <KEY>'

# Pwned Passwords (free, k-anonymity)
SHA1=$(echo -n "password" | sha1sum | awk '{print toupper($1)}')
PREFIX="${SHA1:0:5}"
SUFFIX="${SHA1:5}"
curl -s "https://api.pwnedpasswords.com/range/$PREFIX" | grep -i "$SUFFIX"
```

***

## Performing Whois Lookup

```bash
# Básico
whois target.com

# IP whois (RIR data)
whois 1.2.3.4

# Historic whois (paid, útil para owner changes)
# - whoisxmlapi.com
# - domaintools.com

# Reverse whois (otros dominios del mismo registrant)
# - viewdns.info/reversewhois
# - whoxy.com

# ASN lookup
whois -h whois.cymru.com " -v 1.2.3.4"
```

***

## Honeytokens & Tracking Pixels

Detectar si te están monitoring durante engagement, o monitor tus propios assets:

```bash
# CanaryTokens (gratis, Thinkst)
# canarytokens.org
# Genera token via web → embed en docs/email/URL
# Al ser triggered → notificación al creador

# Token types:
# - DNS lookup
# - HTTP URL
# - PDF document
# - DOCX document  
# - AWS keys (fake)
# - Cloned site
# - Slow redirect (latency-based)
# - Custom image (1x1 pixel)
```

Defensa:
- Monitor: DNS queries a `*.canarytokens.com`, HTTP requests a `*.canarytokens.com`.
- Strip metadata de archivos antes de enviar (exiftool).
- Use VPN/Tor para abrir docs sospechosos.

***

## Notas Relacionadas

- [[GitHub Dorking]]
- [[Google Dorking]]
- [[Certificate Transparency Logs]]
- [[Subdomains Passive Enumeration]]
- [[Cloud Credential Hunting]]
- [[Passive Infrastructure Identification]]
- [[Social Engineering Intelligence]]
- [[CanaryTokens]]
