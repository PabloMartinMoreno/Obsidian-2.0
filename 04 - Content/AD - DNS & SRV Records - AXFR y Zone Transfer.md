---
aliases:
  - DNS Zone Transfer
  - AXFR Attack
  - dig AXFR
  - dnsrecon zone
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
  - asset/dns
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - DNS & SRV Records]]'
---
# AD - DNS & SRV Records - AXFR / Zone Transfer

***

## AXFR Quick Test

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig AXFR <dom> @<DC>` | Zone completa si AXFR permitido | Test inicial. |
| `dig AXFR _msdcs.<dom> @<DC>` | _msdcs zone | DC GUIDs + topology. |
| `dig AXFR <dom> @<DC> +short` | Output sin headers | Scripting. |
| `host -l <dom> <DC>` | AXFR via host(1) | Sin dig. |
| `nmap -p53 --script dns-zone-transfer --script-args dns-zone-transfer.domain=<dom> <DC>` | AXFR via nmap | Bulk + script-friendly. |
^ad-axfr-basics

**Resultados:**
- `Refused` / `connection refused` → bien defendido (default Win/BIND).
- `Transfer failed` → server side error o ACL.
- Output completo → vulnerable, dump full zone.

```bash
DOM="corp.local"
for dc in $(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//'); do
  echo "=== $dc ==="
  dig AXFR "$DOM" "@$dc" +short | head -10
done
```

___

## AXFR Attack — todas las zonas a probar

| **Zona** | **Comando** | **Por qué** |
|:---:|:---:|:---:|
| Forward primary | `dig AXFR corp.local @<DC>` | Records principales. |
| `_msdcs` subdomain | `dig AXFR _msdcs.corp.local @<DC>` | DC GUIDs + topology. |
| `DomainDnsZones` partition | `dig AXFR DomainDnsZones.corp.local @<DC>` | Edge — pocas veces accesible. |
| `ForestDnsZones` partition | `dig AXFR ForestDnsZones.corp.local @<DC>` | Edge — forest-wide. |
| Reverse `/16` | `dig AXFR 0.10.in-addr.arpa @<DC>` | PTRs (hostname disclosure). |
| Reverse `/24` | `dig AXFR 10.0.10.in-addr.arpa @<DC>` | PTRs subnet específico. |
| Sub-domain delegada | `dig AXFR app.corp.local @<DC>` | Apps en zonas separadas. |
^ad-axfr-targets

```bash
DOM="corp.local"
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//')

# Probar todas las zonas conocidas en cada DC
for dc in $DCS; do
  for zone in "$DOM" "_msdcs.$DOM" "DomainDnsZones.$DOM" "ForestDnsZones.$DOM"; do
    R=$(timeout 5 dig AXFR "$zone" "@$dc" +short 2>&1)
    if [ -n "$R" ] && ! echo "$R" | grep -qE "failed|REFUSED|connection"; then
      echo "[+] AXFR OK: $zone @ $dc"
      echo "$R" | head -5
    fi
  done
done
```

___

## dnsrecon / dnsenum / fierce

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `dnsrecon -d <dom> -t axfr` | AXFR contra todos NS records | One-shot. |
| `dnsrecon -d <dom>` | Standard records (SOA, NS, MX, A) + AXFR + SRV | Recon completo. |
| `dnsrecon -d <dom> -t brt -D wordlist.txt` | Subdomain brute | Sin AXFR. |
| `dnsrecon -d <dom> -t std,axfr,srv,brt -D wordlist.txt -j out.json` | Pipeline completo + JSON | Automation. |
| `dnsrecon -r 10.0.0.0/24` | Reverse PTR sweep | Network mapping. |
| `dnsenum --threads 10 <dom>` | Multi-mode threaded | Alt tool. |
| `fierce --domain <dom> --subdomain-file wordlist.txt` | Brute + zone walk | Alt. |
| `gobuster dns -d <dom> -w wordlist -t 50 -r <DC>` | Brute fast con DNS server custom | Internal DNS resolver. |
^ad-axfr-tools

```bash
# Pipeline completo
dnsrecon -d corp.local -n <DC-IP> \
  -t std,axfr,srv,brt \
  -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -j dns_recon.json
```

___

## Reverse Zone Enumeration (PTR)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig AXFR 0.10.in-addr.arpa @<DC>` | PTRs `/16` completos | Si AXFR permitido en reverse. |
| `dig +short -x 10.0.0.10` | PTR de IP específica | Targeted. |
| `dnsrecon -r 10.0.0.0/24` | Bulk reverse sweep | Sin AXFR. |
| `nmap -sn 10.0.0.0/24 --resolve-all` | Reverse + ping sweep | Adjacent network scan. |
| `for i in {1..254}; do dig +short -x 10.0.0.$i @<DC>; done` | Brute reverse manual | Sin tools. |
^ad-axfr-reverse

**Reverse zones suelen ser el "hueco" en hardening** — admins olvidan permisos AXFR en zonas reverse mientras forward está cerrada.

```bash
# Probar AXFR en zonas reverse comunes
for net in $(seq 0 255); do
  R=$(timeout 3 dig AXFR "$net.10.in-addr.arpa" "@<DC>" +short 2>&1)
  [ -n "$R" ] && [[ "$R" != *"failed"* ]] && echo "[+] AXFR ok: $net.10.in-addr.arpa"
done
```

___

## Subdomain Brute (sin AXFR)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `gobuster dns -d <dom> -r <DC-IP> -w wordlist -t 50` | Brute rápido con resolver custom | Internal DNS. |
| `dnscan -d <dom> -w wordlist.txt` | Alt brute | Sin gobuster. |
| `puredns bruteforce wordlist.txt <dom> -r resolvers.txt` | Massdns wrapper modern | Performance massive. |
| `amass enum -d <dom> -passive` | OSINT + passive | External recon. |
| `findomain -t <dom>` | Rust fast | OSINT-only. |
| `subfinder -d <dom> -all -silent` | Multi-source | OSINT-heavy. |
^ad-axfr-brute

```bash
# Internal DNS-aware brute
gobuster dns -d corp.local -r <DC-IP> \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -t 50 -o subdomains.txt

# Targeted AD-specific common
for sub in dc dc01 dc02 dns mail exchange smtp ldap ldaps gc \
           pdc kdc files share fileserver print printer \
           sql mssql mysql web app api dev test prod \
           ts rdp citrix vpn portal intranet; do
  IP=$(dig +short A "$sub.corp.local" @<DC>)
  [ -n "$IP" ] && echo "$sub.corp.local -> $IP"
done
```

___

## Public DNS Leak (External Recon)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s "https://crt.sh/?q=%25.<dom>&output=json" \| jq -r '.[].name_value' \| sort -u` | Subdomains via cert transparency | Pre-engagement OSINT. |
| `subfinder -d <dom> -all -silent` | Multi-source aggregator | Pre-engagement. |
| `amass enum -passive -d <dom>` | Passive OSINT + DNS | Pre-engagement. |
| `dnsdumpster.com` (web) | Visual map externa | Quick view. |
| `securitytrails.com` | Historical DNS | DNS pivots. |
| `shodan search "ssl.cert.subject.cn:<dom>"` | Hosts con cert del dominio | Cross-correlate. |
^ad-axfr-public

```bash
# Pipeline OSINT pre-engagement
DOM="corp.local"

# Aggregate sources
subfinder -d "$DOM" -all -silent > subs.txt
amass enum -passive -d "$DOM" >> subs.txt
curl -s "https://crt.sh/?q=%25.$DOM&output=json" | jq -r '.[].name_value' >> subs.txt

# Dedupe + resolve
sort -u subs.txt | httpx -title -web-server -tech-detect
```

***
