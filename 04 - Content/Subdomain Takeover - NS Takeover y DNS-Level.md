---
aliases:
  - NS Takeover
  - Nameserver Takeover
  - DNS-Level Takeover
  - Expired Domain
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/initial-access
  - asset/dns
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
---
# Subdomain Takeover - NS Takeover y DNS-Level

***

## Nameserver Takeover (NS Records)

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | NS record delegates subdomain DNS to external provider. If provider's name servers can be claimed → atacante controls all subdomain DNS. | High impact. |
| AWS Route53 | `*.awsdns-N.org/com/net/co.uk` | Original AWS NS. |
| AWS Route53 takeover | Create hosted zone con same name; AWS may assign same NS prefix randomly | Probability-based. |
| Azure DNS | `*.azure-dns.com/net/org/info` | Same idea. |
| Google Cloud DNS | `ns-cloud-N.googledomains.com` | Less takeover-friendly. |
| Bitbucket DNS | Some Bitbucket DNS deprecated | Edge. |
| DNSimple takeover | If account/zone deleted | Per-config. |
| DigitalOcean DNS | `ns1/2/3.digitalocean.com` | Standard. |
| Cloudflare NS | Cloudflare NS rotated | Less takeover-friendly. |
| GoDaddy / Namecheap | Personal DNS | Edge cases. |
| Per-zone delegation | Subdomain delegates to atacante's NS | Direct control. |
| Multi-NS chain | NS chain — each NS could be takeover-able | Cascade. |
| WHOIS expired domain | If NS itself is on expired domain | Domain takeover. |
| TLD takeover (very rare) | Country TLDs occasionally | Edge. |
^sdt-ns-takeover

### NS takeover workflow

```bash
# 1. Identify NS records of subdomain
SUB="dev.target.com"
dig +short NS "$SUB"
# Output: ns1.cloud-provider.com, ns2.cloud-provider.com

# 2. Verify NS providers reachable
for ns in $(dig +short NS "$SUB"); do
  dig +short A "$ns"
done

# 3. If NS provider permits creating zones → atacante creates
#    hosted zone con same name → claims delegation
# Per-provider:
# AWS Route53: aws route53 create-hosted-zone --name dev.target.com ...
# DigitalOcean: doctl compute domain create dev.target.com ...

# 4. Atacante's hosted zone → DNS responses controlled
# Set A records, MX, etc → full subdomain control
```

___

## Expired Domain Reclaim

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Subdomain CNAMEd a third-party domain that has **expired**. Atacante registers expired domain → takes control. | Domain hijacking. |
| Auction sites | NameJet, GoDaddy auctions | Buy expired domains. |
| Drop catching | Tools que buy domains second they drop | Race-based. |
| Pending delete window | TLD-specific (5 days for .com) | Time window. |
| WHOIS lookup | `whois target-cname.com` | Status check. |
| Domain expiration monitoring | Alerts when domains expire | Bug bounty automation. |
| Auto-renewal failures | Customer credit card expired | Common. |
| Registrar abandonments | Customer leaves provider | Edge. |
| Combine con CNAME chains | Multi-level CNAME a expired | Hidden vector. |
| Bug bounty significance | High payouts for expired domain takeovers | Reportable. |
| Domain age verification | `whois <domain>` for creation date | Validation. |
| Combine con MX records | Email + domain takeover combo | Email spoofing. |
^sdt-ns-expired

### Workflow expired domain detection

```bash
# Identify CNAMEs pointing a non-target domains
for sub in $(cat subs.txt); do
  CNAME=$(dig +short CNAME "$sub")
  if [ -n "$CNAME" ] && [[ ! "$CNAME" == *"target.com"* ]]; then
    # Check if CNAME target resolves
    if ! dig +short A "$CNAME" | grep -q '[0-9]'; then
      echo "[!] Possible takeover: $sub → $CNAME (dangling)"
      
      # Check WHOIS
      DOMAIN=$(echo "$CNAME" | awk -F. '{print $(NF-1)"."$NF}')
      whois "$DOMAIN" | grep -iE 'expir|status'
    fi
  fi
done
```

___

## SOA / NS Misconfig

| **Misconfig** | **Indicator** | **Vector** |
|:---:|:---:|:---:|
| SOA missing | `dig SOA subdomain` returns empty | Edge. |
| SOA mismatch | SOA points a obsolete NS | Recon hint. |
| NS records inconsistent | Authoritative vs glue records differ | Confusion. |
| Lame delegation | NS doesn't respond authoritatively | Stale. |
| Glue record stale | Glue points a dead IP | Edge. |
| Multiple NS dangling | Only some NS dangling | Partial control. |
| Combine con NS takeover | Multi-NS confusion | Edge. |
| Zone transfer (AXFR) | If allowed → full zone enumeration | Recon. |
| `dig AXFR @ns.target.com target.com` | Standard probe | Sometimes works. |
| Reverse zone misconfig | Reverse DNS issues | Recon. |
| DNSSEC misconfig | DNSSEC chain broken → can replace records | Edge attack. |
^sdt-ns-misconfig

___

## DNS Provider Account Orphan

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Account en DNS provider (Cloudflare, Route53, etc) abandoned. Atacante takes over via various means → controls DNS. | Account takeover impact. |
| Cloudflare zone abandoned | If email account abandonado, atacante reset password | Reset hijack. |
| Route53 inactive AWS account | Not really takeover-able if AWS account active | Edge. |
| Hosted zone deleted but NS still in WHOIS | Atacante creates new zone → may match | Probability. |
| AWS Account ID reuse | Old account ID con resources cached | Edge. |
| Cloudflare account dangling | If account email goes to expired domain → password reset | Multi-step. |
| Account de empleado ex | Ex-employee email retained | OSINT. |
| Combine con email takeover | If email of admin can be taken → DNS account too | Stack chain. |
| Cloud account hijack | Cloud account compromise → DNS control | Adjacent. |
| Multi-cloud cross-account | Different cloud accounts hijack independently | Edge. |
| Bug bounty considerations | Often out of scope unless specifically allowed | Reporting. |
^sdt-ns-account-orphan

### Workflow detection

```
1. Recon admin emails:
   - WHOIS contact info
   - LinkedIn / DNS team OSINT
   - Public talks / conferences referencing accounts

2. Check if any admin emails point to dangling domains:
   admin@dead-company.com → company.com WHOIS expired?

3. If yes:
   - Register dead-company.com
   - Receive password reset emails
   - Take over DNS account
   - Modify zone records → subdomain takeover at scale

4. Bug bounty: typically consider account takeover separately,
   but DNS-level impact is high.
```

***
