---
aliases:
  - dnsrecon
tags:
  - type/tool
  - tool/dnsrecon
  - technique/recon/passive
  - technique/recon/active
  - service/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Recon]]"
tertiary categories:
  - "[[Information Gathering]]"
type: Tool
linked:
  - "[[DNS - Herramientas]]"
  - "[[DNS (53) - Enumeración]]"
  - "[[Subdomain Bruteforcing]]"
  - "[[gobuster]]"
---
# dnsrecon

***

## Cheatsheet
^dnsrecon-enum

| Tipo | Comando |
| --- | --- |
| **Std enum** | `dnsrecon -d dom.com` |
| **Brute subs** | `dnsrecon -d dom.com -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt` |
| **AXFR zone transfer** | `dnsrecon -d dom.com -t axfr` |
| **Reverse range** | `dnsrecon -r 10.0.0.0/24 -n 10.0.0.1` |
| **Google scraping** | `dnsrecon -d dom.com -t goo` |
| **Cache snoop** | `dnsrecon -t snoop -n NS -D wordlist.txt` |
| **NS específico** | `dnsrecon -d dom.com -n 1.1.1.1` |
| **JSON output** | `dnsrecon -d dom.com -j out.json` |

***

## Concepto

Scanner DNS Python — enum comprehensive: standard records (A/AAAA/MX/NS/SOA/TXT/SRV), AXFR attempts, brute de subdomains, reverse lookups sobre rangos IP, cache snooping, y zonewalking (NSEC).

Más versátil que `dnsenum` (más lookups) pero más lento. Para subs-brute puro, [[gobuster]] `dns` es más rápido.

## 1. Tipos de scan (`-t`)

| Tipo | Acción |
| --- | --- |
| `std` | Standard — SOA, NS, A, AAAA, MX, SRV (default). |
| `rvl` | Reverse lookup de rango (requiere `-r`). |
| `brt` | Brute subdomains (requiere `-D wordlist`). |
| `srv` | SRV records común (LDAP, Kerberos, etc). |
| `axfr` | Zone transfer attempt en cada NS. |
| `bing` | Bing scraping (deprecated). |
| `goo` | Google scraping. |
| `yand` | Yandex scraping. |
| `crt` | crt.sh certificate transparency. |
| `snoop` | DNS cache snooping (requiere `-D`). |
| `tld` | Remove TLD y prueba todos los ccTLDs. |
| `zonewalk` | NSEC zonewalk (DNSSEC). |

Multi-tipo: `-t std,brt,axfr`.

## 2. Standard enumeration

```bash
dnsrecon -d target.com
# Output: SOA, NS, MX, A, AAAA, TXT, SRV
```

## 3. Brute subdomains

```bash
dnsrecon -d target.com \
  -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -t brt \
  --threads 50
```

Mejores wordlists:
- `subdomains-top1million-5000.txt` (baseline fast)
- `subdomains-top1million-20000.txt` (baseline medium)
- `bitquark-subdomains-top100000.txt` (deep)

## 4. AXFR (zone transfer)

```bash
dnsrecon -d target.com -t axfr
```

Prueba zone transfer en cada NS del dominio. Si exitoso → full zone dump. Rarely works en prod pero HTB/CTF frecuente.

## 5. Reverse range

```bash
# Todo /24
dnsrecon -r 10.10.10.0/24

# Rango arbitrario
dnsrecon -r 10.10.10.1-10.10.10.50

# Con NS específico
dnsrecon -r 10.10.10.0/24 -n 10.10.10.10
```

## 6. Certificate Transparency (crt.sh)

```bash
dnsrecon -d target.com -t crt
# Scraping de crt.sh → lista de subdomains emitidos en CTs
```

Complementa `brt` — descubre subs no adivinables por wordlist (ej `api-internal-dev-01.target.com`).

## 7. Cache snooping

```bash
# Si el NS permite recursion para clients, snoopa qué dominios resolvió recientemente
dnsrecon -t snoop -n NS.target.com -D domains.txt
# "found in cache" → alguien en la org visitó ese dominio
```

## 8. Output

```bash
# JSON
dnsrecon -d target.com -j out.json

# CSV
dnsrecon -d target.com -c out.csv

# XML
dnsrecon -d target.com -x out.xml

# Solo IPs únicas
dnsrecon -d target.com -j out.json && jq -r '.[] | .address' out.json | sort -u
```

## Tips

- `--lifetime 5` / `--threads 10` — ajustar timeout/paralelismo según latency DNS.
- `-f` — filter records no autoritativos.
- Para AD: `dnsrecon -d dom.local -n DC -t srv` → LDAP/Kerberos/Global Catalog SRVs → ubica DCs.
- Combinar flows: `dnsrecon -t std,brt,crt -d target.com -D subs.txt -j out.json`.

## Comparativa

| | dnsrecon | dnsenum | [[gobuster]] dns | fierce |
| --- | --- | --- | --- | --- |
| Subdomain brute | Sí | Sí | **Muy rápido** | Sí |
| AXFR | Sí | Sí | No | Sí |
| Reverse range | **Sí** | No | No | Sí |
| crt.sh | **Sí** | No | No | No |
| Cache snoop | **Sí** | No | No | No |
| Zonewalk NSEC | **Sí** | No | No | No |

## Recursos

- [dnsrecon GitHub](https://github.com/darkoperator/dnsrecon)

***
