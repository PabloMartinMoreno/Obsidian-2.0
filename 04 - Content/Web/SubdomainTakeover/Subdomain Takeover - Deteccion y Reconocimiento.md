---
aliases:
  - SDT Detection
  - Subdomain Enumeration
  - Dangling DNS
tags:
  - vuln/subdomain-takeover
  - technique/discovery
  - asset/web-app
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Subdomain Takeover]]"
---
# Subdomain Takeover - Detección y Reconocimiento

---

## Subdomain Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Passive — Certificate Transparency | crt.sh, Censys, Cert Spotter | Free, comprehensive. |
| Passive — DNS aggregators | SecurityTrails, VirusTotal, dnsdumpster | API rate limits. |
| Passive — Search engines | Google dorks `site:target.com -www` | Manual but useful. |
| Passive — Wayback Machine | archive.org/web/ con `*.target.com/*` | Historical subdomains. |
| Passive — Shodan / Censys | Direct host search | Active services. |
| Passive — Subdomainfinder | Web tools | Quick. |
| `amass intel -d target.com` | Passive — Amass intel | Multi-source. |
| `subfinder -d target.com -all -recursive` | Active — Subfinder | Modern fast. |
| `amass enum -d target.com -active` | Active — Amass enum | Comprehensive. |
| `assetfinder -subs-only target.com` | Active — Assetfinder | Pipeline-friendly. |
| Active — Findomain | Modern alt | Same. |
| `dnsrecon -d target.com -t std` | Active — DNSrecon | Multi-mode. |
| `subbrute`, `gobuster dns`, `puredns` | Brute force | Wordlist-based. |
| `seclists/Discovery/DNS/`, `assetnote/wordlists` | Wordlists | Standard. |
| GitHub recon | Search public repos for subdomains | Source disclosure. |
| Reverse DNS | PTR records on cloud IP ranges | Cloud-specific. |
| `altdns`, `ripgen`, `dnsgen` | Permutation generation | Variations. |
^sdt-detect-enum

### Pipeline workflow

```bash
# 1. Passive sources
subfinder -d target.com -all -silent > subs.txt
amass enum -passive -d target.com -silent >> subs.txt
assetfinder -subs-only target.com >> subs.txt
crt.sh "%.target.com" | jq -r '.[].name_value' >> subs.txt
sort -u subs.txt -o subs.txt

# 2. Resolve only live domains
dnsx -l subs.txt -resp -silent > resolved.txt

# 3. Extract CNAME records (key for takeover)
dnsx -l subs.txt -cname -resp -silent > cnames.txt

# 4. Probe HTTP/HTTPS alive
httpx -l resolved.txt -silent > alive.txt
```

---

## DNS Records Analysis

| **Record type** | **Significance** | **Takeover indicator** |
|:---:|:---:|:---:|
| **CNAME** | Subdomain alias to another domain | **Primary takeover indicator** — if target dangling. |
| A | IP address | Direct takeover via IP / cloud IP recycle. |
| AAAA | IPv6 address | Same. |
| MX | Mail server | Email takeover (less common). |
| TXT | SPF/DKIM/DMARC + arbitrary | Spoofing potential. |
| NS | Authoritative nameservers | NS takeover (DNS-level). |
| SOA | Start of authority | Edge — full domain control. |
| SRV | Service records | Edge. |
| CAA | Cert authority allowlist | Issuance bypass. |
| PTR | Reverse DNS | Recon adjacent. |
| Multiple CNAMEs | Chain CNAMEs | Each link is a candidate. |
| Wildcard | `*.target.com` | All subs takeover-able. |
| Dangling A record | A record points a IP no owned | Cloud IP recycle. |
| Stale CNAME | CNAME a service que no existe | Direct takeover. |
^sdt-detect-records

### Probe DNS records

```bash
# Single subdomain analysis
dig subdomain.target.com  # Multiple types

# CNAME specifically
dig +short CNAME subdomain.target.com

# Bulk CNAME extraction
for sub in $(cat subs.txt); do
  CNAME=$(dig +short CNAME "$sub" | head -1)
  if [ -n "$CNAME" ]; then
    echo "$sub → $CNAME"
  fi
done > cname_map.txt

# Identify NS records (NS takeover candidates)
for sub in $(cat subs.txt); do
  dig +short NS "$sub"
done
```

---

## Identificar Dangling Pointers

| **Punto / Vector** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| CNAME a `bucketname.s3.amazonaws.com` que no existe | NXDOMAIN o "NoSuchBucket" | S3 takeover candidate. |
| CNAME a `*.cloudfront.net` con NXDOMAIN | Distribution deleted | CloudFront takeover. |
| CNAME a `*.azurewebsites.net` 404 | App service missing | Azure takeover. |
| CNAME a `*.herokuapp.com` con `no-such-app.herokuapp.com` | Heroku app missing | Heroku takeover. |
| CNAME a `*.github.io` con 404 / "no such pages site" | GitHub Pages missing | GitHub takeover. |
| CNAME a `tumblr.com` con "domain has been claimed" | Tumblr takeover | Standard. |
| CNAME a `*.fastly.net` con specific message | Fastly missing | Edge. |
| CNAME a `desk.com`, `zendesk.com` | Zendesk takeover | Standard. |
| CNAME a `*.shopify.com` con 404 | Shopify | Standard. |
| HTTP 404 con specific service message | Service-specific signature | Match patterns. |
| `NXDOMAIN` on CNAME target | Domain not resolved at all | Strong takeover candidate. |
| Recently expired CNAME target | WHOIS check + DNS delete | Time-sensitive opportunity. |
| `*.target.com` → dangling | Wildcard CNAME stale | Wide takeover surface. |
| Multiple subdomains shared CNAME | One claim → multiple subdomains | Bulk takeover. |
^sdt-detect-dangling

### Dangling indicators per service

```
S3:           "The specified bucket does not exist" / 404 NoSuchBucket
CloudFront:   "Bad request - The provided URL doesn't match" / 403 + specific
Heroku:       "no-such-app.herokuapp.com" / "There's nothing here, yet"
GitHub:       "There isn't a GitHub Pages site here." / 404
Pantheon:     "404 - The page you requested could not be found."
Tumblr:       "There's nothing here." / "Whatever you were looking for..."
Squarespace:  "No Such Account"
Surge.sh:     "project not found"
Wordpress:    "Do you want to register..."
Bitbucket:    "Repository not found"
Strikingly:   "page not found" / specific 404
Helpjuice:    "We could not find what you're looking for."
Smartling:    "Domain is not configured"
Brightcove:   error
Vend:         "Looks like you've traveled too far into cyberspace."
Worksites.net: "Hello! Sorry, but the website you're looking for doesn't exist."
Tilda:        "Please renew your subscription"
Zendesk:      "Help Center Closed"
JetBrains:    "is not a registered InCloud YouTrack."
Aha:          "There is no portal here ... sending you back to Aha!"
```

---

## Fingerprint del Tipo de Servicio

| **Service** | **CNAME pattern** | **Fingerprint method** |
|:---:|:---:|:---:|
| AWS S3 | `*.s3.amazonaws.com`, `*.s3-website-*.amazonaws.com` | Body match. |
| AWS CloudFront | `*.cloudfront.net` | Body match. |
| AWS Elastic Beanstalk | `*.elasticbeanstalk.com` | Body match. |
| Azure Web Apps | `*.azurewebsites.net` | Body match. |
| Azure Blob | `*.blob.core.windows.net` | NoSuchAccount error. |
| Google Cloud Storage | `*.storage.googleapis.com` | NoSuchBucket. |
| Heroku | `*.herokuapp.com` | "There's nothing here". |
| GitHub Pages | `*.github.io` | 404 / "There isn't a GitHub Pages site". |
| Netlify | `*.netlify.app` | 404 con Netlify branding. |
| Vercel | `*.vercel.app` | 404. |
| Tumblr | `*.tumblr.com` | "There's nothing here". |
| Shopify | `*.myshopify.com` | "Sorry, this shop is currently unavailable". |
| Zendesk | `*.zendesk.com` | "Help Center Closed". |
| Squarespace | Connected via custom domain | "No Such Account". |
| WordPress.com | `*.wordpress.com` | "Do you want to register". |
| Bitbucket | `*.bitbucket.io` | "Repository not found". |
| Pantheon | `*.pantheonsite.io` | 404. |
| Helpjuice | Custom domain | Specific 404. |
| Strikingly | `*.strikingly.com` | "page not found" specific. |
| Webflow | `*.webflowcms.com`, `*.webflow.io` | Webflow 404. |
| Surge.sh | `surge.sh` | "project not found". |
| Tilda | `*.tilda.ws` | "renew your subscription". |
| Reference: can-i-take-over-xyz | https://github.com/EdOverflow/can-i-take-over-xyz | Curated. |
^sdt-detect-fingerprint

### Auto-fingerprint con curl

```bash
# Probe subdomain CNAMEd a cloud service
SUB="vulnerable.target.com"
CNAME=$(dig +short CNAME "$SUB")
echo "[*] CNAME: $CNAME"

# Check HTTP response
RESP=$(curl -s -L "https://$SUB")
echo "$RESP" | head -c 500

# Match service signatures
if echo "$RESP" | grep -q "There isn't a GitHub Pages site here"; then
    echo "[+] GitHub Pages takeover candidate"
elif echo "$RESP" | grep -q "There's nothing here"; then
    echo "[+] Heroku / Tumblr takeover candidate"
elif echo "$RESP" | grep -q "NoSuchBucket"; then
    echo "[+] AWS S3 takeover candidate"
fi
```

---
