---
aliases:
  - AD DNS Enumeration
  - SRV Records AD
  - AD-Integrated DNS
  - DNS Records Recon
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: CheatSheet
linked:
  - "[[AD - DNS & SRV Records - SRV Records Estandar]]"
  - "[[AD - DNS & SRV Records - AD-Integrated Zones]]"
  - "[[AD - DNS & SRV Records - AXFR y Zone Transfer]]"
  - "[[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated]]"
  - "[[AD - DNS & SRV Records - DNS Spoofing y Records Injection]]"
  - "[[AD - DNS & SRV Records - Tooling]]"
  - "[[AD - Hosts Enumeration]]"
  - "[[NTLM Relay]]"
  - "[[mitm6 - IPv6 DHCP Spoofing]]"
---
# AD - DNS & SRV Records

***

## Cheatsheet

### 🔍 SRV Records Estándar AD

````tabs
tab: **SRV Records Globales**
![[AD - DNS & SRV Records - SRV Records Estandar#^ad-srv-global]]

tab: **SRV Records por Site**
![[AD - DNS & SRV Records - SRV Records Estandar#^ad-srv-sites]]

tab: **msDCS Subdomains**
![[AD - DNS & SRV Records - SRV Records Estandar#^ad-srv-msdcs]]

tab: **SRV Selection (Priority/Weight)**
![[AD - DNS & SRV Records - SRV Records Estandar#^ad-srv-selection]]

tab: **SRV Errors / Misconfigs**
![[AD - DNS & SRV Records - SRV Records Estandar#^ad-srv-errors]]
````

### 🌐 AD-Integrated DNS Zones

````tabs
tab: **DNS Storage Architecture**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-architecture]]

tab: **Zone Enumeration via LDAP**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-ldap-enum]]

tab: **Records Discovery (dnsNode)**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-records]]

tab: **Replication Scope**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-replication]]

tab: **DNS-related Privileged Groups**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-groups]]

tab: **DNS-Specific Misconfigs**
![[AD - DNS & SRV Records - AD-Integrated Zones#^ad-zones-misconfig]]
````

### 📡 AXFR / Zone Transfer

````tabs
tab: **AXFR Basics**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-basics]]

tab: **AXFR Attack Targets**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-targets]]

tab: **dnsrecon / dnsenum / fierce**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-tools]]

tab: **Reverse Zone Enumeration**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-reverse]]

tab: **Subdomain Brute (No AXFR)**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-brute]]

tab: **Public DNS Leak**
![[AD - DNS & SRV Records - AXFR y Zone Transfer#^ad-axfr-public]]
````

### 🔓 Adidnsdump y DNS Authenticated

````tabs
tab: **Why DNS via LDAP**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-why]]

tab: **adidnsdump Tool**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-tool]]

tab: **ANY Records / Default Visibility**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-any]]

tab: **DNS Permissions Audit**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-acl]]

tab: **Records Manipulation Tools**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-tools]]

tab: **DNS-Based Persistence**
![[AD - DNS & SRV Records - Adidnsdump y DNS Authenticated#^ad-adidns-persistence]]
````

### 💉 DNS Spoofing & Records Injection

````tabs
tab: **Insecure Dynamic Update**
![[AD - DNS & SRV Records - DNS Spoofing y Records Injection#^ad-spoof-ddns]]

tab: **WPAD Attack**
![[AD - DNS & SRV Records - DNS Spoofing y Records Injection#^ad-spoof-wpad]]

tab: **mitm6 (IPv6 DHCP Spoofing)**
![[AD - DNS & SRV Records - DNS Spoofing y Records Injection#^ad-spoof-mitm6]]

tab: **Records Injection / Spoofing**
![[AD - DNS & SRV Records - DNS Spoofing y Records Injection#^ad-spoof-records]]

tab: **Cleanup y Detection**
![[AD - DNS & SRV Records - DNS Spoofing y Records Injection#^ad-spoof-cleanup]]
````

### 🛠️ Tooling

````tabs
tab: **dig (BIND Lookup)**
![[AD - DNS & SRV Records - Tooling#^ad-tool-dig]]

tab: **dnsrecon / dnsenum / fierce**
![[AD - DNS & SRV Records - Tooling#^ad-tool-dnsrecon]]

tab: **adidnsdump (LDAP-based)**
![[AD - DNS & SRV Records - Tooling#^ad-tool-adidns]]

tab: **dnstool.py (Manipulation)**
![[AD - DNS & SRV Records - Tooling#^ad-tool-dnstool]]

tab: **Cloud / Modern DNS Tools**
![[AD - DNS & SRV Records - Tooling#^ad-tool-cloud]]

tab: **Wordlists & Recursos**
![[AD - DNS & SRV Records - Tooling#^ad-tool-wordlists]]
````

___

## Overview

**AD DNS & SRV Records** = capa fundacional para todo ataque AD. AD usa DNS extensivamente: SRV records para descubrir DCs, KDCs, GCs; AD-integrated zones almacenadas en partitions LDAP; DDNS para auto-registro de hosts. Sin DNS funcional, AD no opera.

Como atacante: DNS expone topología (DCs, sites, FSMO holders), permite enumeración via LDAP (`adidnsdump`), y habilita ataques activos (DNS spoofing, WPAD injection, mitm6 IPv6 DHCP takeover, AXFR misconfig).

### Cuándo es alto impacto

| DNS recon solo (info) | DNS abuse en chains |
|---|---|
| DC location via SRV | NTLM Relay target list |
| AXFR success → full zone leak | Internal infra mapped (CVSS Medium) |
| Subdomain brute → app discovery | OAuth redirect_uri target via subdomain TKO |
| ANY records visible LDAP | DNS spoofing via record injection (CVSS High) |
| WPAD record write capability | WPAD attack → proxy MitM (CVSS High) |
| Insecure DDNS allowed | Persistent attacker records (CVSS High) |
| mitm6 DHCPv6 viable | NTLM Relay over IPv6 → DA (CVSS Critical) |

### Diferencia con Hosts Enum

| | **DNS & SRV Records** | **Hosts Enumeration** |
|---|---|---|
| Foco | DNS protocol + zones + records | Computer objects + topology + signing |
| Output | SRV/A/AAAA/PTR records | Hostname/OS/UAC list |
| Auth | Anonymous DNS / authenticated LDAP | Authenticated typical |
| Tooling | dig, dnsrecon, adidnsdump | netexec, ldapsearch, PowerView |
| Active vector | DNS spoofing, WPAD, mitm6 | NTLM Relay, lateral |
| Combine con | Coercion, Relay, mitm6 | BloodHound ingest, lateral planning |

### Por qué DNS es crítico en AD

- **DC discovery** — clients use SRV to find DCs at boot. No SRV = no AD.
- **Site-aware auth** — closest-DC discovery via site SRV records.
- **Kerberos KDC location** — `_kerberos._tcp` SRV is path to TGT.
- **AD-integrated zones** — DNS replicates via AD partitions, not file zones.
- **Default Authenticated Users CreateChild** — anyone in domain can add records.
- **WPAD + mitm6** — combine for non-targeted mass MitM via DNS spoofing.

___

## Workflow de explotación

```
1. External recon (no foothold):
   - Public DNS: cert transparency, OSINT (subfinder, amass)
   - Subdomain brute via public resolvers
   - Identify target domain via WHOIS/MX

2. Internal DNS recon (initial foothold):
   - dig SRV records (DC location, KDC, GC)
   - nbtscan + responder passive listen
   - DNS to identify segment topology

3. AXFR test (often misconfigured):
   - dig AXFR <zone> @<DC>
   - Try forward + reverse + _msdcs zones
   - dnsrecon -t axfr automation

4. Authenticated LDAP enum (post-cred):
   - adidnsdump → all zones + records
   - --include-hidden → ANY records
   - Identify wpad/isatap/wildcard records

5. DNS DACL audit:
   - GenericAll / Create child on zones
   - Per-record write permissions
   - Identify spoofing-capable principals

6. Active attacks:
   a. DNS spoofing via record injection (dnstool.py)
   b. WPAD attack: create wpad A record → Responder
   c. mitm6 IPv6 DHCPv6 spoof + DNS poisoning + relay
   d. Insecure DDNS exploitation

7. Persistence:
   - Static A records (TimeStamp=0, no scavenging)
   - Hidden ANY records (LDAP visible, DNS hidden)
   - Conditional forwarder modification

8. Cleanup:
   - Remove malicious records (dnstool -a remove)
   - Restore originals from backup
```

___

## Detección rápida

### Probes mínimos

```bash
DOM="dom.local"

# 1. SRV discovery
for record in \
  "_ldap._tcp.dc._msdcs.$DOM" \
  "_kerberos._tcp.dc._msdcs.$DOM" \
  "_gc._tcp.$DOM"; do
  echo "=== $record ==="
  dig +short SRV "$record"
done

# 2. AXFR test (often misconfig)
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//')
for dc in $DCS; do
  for zone in "$DOM" "_msdcs.$DOM"; do
    RESULT=$(timeout 5 dig AXFR "$zone" "@$dc" +short 2>&1)
    if [ -n "$RESULT" ] && [[ "$RESULT" != *"failed"* ]]; then
      echo "[+] AXFR ok: $zone @ $dc"
    fi
  done
done

# 3. Subdomain brute
gobuster dns -d "$DOM" -r DC -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# 4. Authenticated zone enum (post-cred)
adidnsdump -u 'dom\user' --password 'pass' DC

# 5. Insecure DDNS test
nsupdate <<EOF
server DC
zone $DOM.
update add testxxx.$DOM. 60 A 1.2.3.4
send
EOF
dig +short A "testxxx.$DOM" @DC
```

___

## Impacto

- **Topology disclosure** — DC/GC/PDC location via SRV → attack surface mapped.
- **AXFR misconfig** — full zone dump = internal infrastructure exposed.
- **DNS spoofing** — modify A records → MitM auth, lateral pivots.
- **WPAD attack** — browsers auto-config to attacker proxy → mass MitM.
- **mitm6 IPv6 takeover** — DHCPv6 + DNS spoof → NTLM Relay → DA.
- **Insecure DDNS** — atacante creates persistent records.
- **DnsAdmins legacy RCE** — DLL plugin loaded as SYSTEM en DC.
- **Subdomain takeover candidates** — stale CNAMEs to abandoned cloud services.
- **Internal info via public DNS** — internal hostnames leaked to public resolvers.
- **DNS-based persistence** — ANY records + static records hard to detect.
- **Conditional forwarder hijack** — redirect entire zone queries.

___

## Mitigación (defender)

- **Disable AXFR to non-authorized servers** — `Set-DnsServerZoneTransferPolicy` (block external).
- **Secure DDNS only** — `Set-DnsServerPrimaryZone -DynamicUpdate Secure` per zone.
- **Restrict zone CreateChild permissions** — remove default Authenticated Users:
  ```powershell
  $zone = "AD:DC=dom.local,CN=MicrosoftDNS,CN=System,DC=dom,DC=local"
  # Remove Authenticated Users CreateChild
  ```
- **Audit DnsAdmins membership** — should be empty or single admin. Patch CVE-2017-7299 if not patched.
- **DNS scavenging enabled** — auto-purge stale records:
  ```powershell
  Set-DnsServerScavenging -ScavengingState $true -ScavengingInterval 7.00:00:00
  ```
- **Block WPAD + ISATAP + 6to4** at name resolution (Windows GPO).
- **Disable IPv6 if not needed** — defeats mitm6 attack:
  ```powershell
  # Per-host
  Disable-NetAdapterBinding -InterfaceAlias "*" -ComponentID ms_tcpip6
  ```
- **DHCPv6 RA Guard / DHCP Snooping** — switch-level to block rogue DHCPv6.
- **DNS audit logging** — enable DNS Server Log + AD audit:
  ```
  Event ID 257 (DNS Server modify)
  Event ID 5137 (AD object create)
  ```
- **Defender for Identity** — anomalous DNS spoofing detection.
- **Monitor critical records** — alert on `wpad`, `isatap`, `dc01`, `_kerberos` modification.
- **DNS query logging** — sysmon Event ID 22 per-host.
- **Disable LLMNR + NBT-NS** — defeat fallback name resolution:
  ```
  GPO: Computer Configuration > Administrative Templates > Network > 
       DNS Client > Turn off multicast name resolution = Enabled
  ```
- **DNSSEC** — sign zones to prevent on-path spoofing (heavy operationally).
- **Internal DNS not public** — split-horizon DNS, don't expose internal records.

___

## Para entender AD DNS

**Por qué AD necesita DNS:**

Kerberos depends on DNS — TGT request requires KDC name resolution. LDAP requires DC name resolution. SMB depends on hostname resolution. Sin DNS = sin AD operations. Diseñado pre-cloud cuando network = single broadcast domain. Migration to multi-site requires SRV records con site awareness.

**Por qué DCs auto-register tantos records:**

Cada DC al boot registra:
- A record (own hostname)
- SRV records (LDAP, Kerberos, GC if applicable)
- Per-site SRV records
- Per-FSMO role records
- _msdcs entries

DDNS auto-registration = "secure" (Kerberos auth required) por default. Pero "secure DDNS" can be disabled per zone — common legacy gap.

**Por qué AD-integrated zones storage matters:**

Two storage models:
1. File-based (legacy) — zone file on each DNS server, manual replication
2. AD-integrated — zone stored as AD object, replicates via AD replication

AD-integrated:
- Multi-master writes (any DC can write)
- Replication scope selectable (Domain / Forest / Custom)
- Per-record DACL (granular permissions)
- LDAP-accessible (atacante can enum via LDAP not just DNS)

**Por qué default Authenticated Users CreateChild matters:**

By default, `Authenticated Users` group has `CreateChild` on most AD-integrated zones. This means any domain user can:
- Create A records for new hostnames
- Create CNAMEs
- Create wildcard records (in some configs)
- Create WPAD record (most common abuse)

Defenders often unaware of this default. Hardening = remove `Authenticated Users` from zone DACL.

**Por qué AXFR misconfig persists:**

Zone transfers needed for traditional master/slave replication. AD-integrated bypasses AXFR for AD repl. But many BIND/Microsoft DNS configs leave AXFR allowed for compatibility. Especially reverse zones often forgotten. AXFR test = no auth needed = trivial recon.

**Por qué WPAD + DNS combo es devastating:**

WPAD = Web Proxy Auto-Discovery. Browser queries `wpad.<dom>` for proxy auto-config (PAC) file. If atacante creates `wpad` A record pointing to attacker:
- Browser fetches `wpad.dat` from attacker
- PAC file says: use ATTACKER:8080 as proxy
- All HTTP/HTTPS traffic flows through attacker
- Combine with NTLM Relay = mass auth capture + relay

Default `Authenticated Users CreateChild` enables this attack para cualquier domain user. Critical default-on vulnerability.

**Por qué mitm6 funciona en redes IPv4-only:**

Windows Vista+ enables IPv6 by default. Even on IPv4-only networks, hosts attempt DHCPv6 broadcasts. mitm6 responds:
- "I'm DHCPv6 server, here's your IPv6 prefix"
- "I'm also your DNS server (IPv6)"
- All DNS queries flow to attacker
- Combine with Responder/ntlmrelayx → relay everything

Attack is mass — affects all IPv6-enabled hosts on segment. Defense: disable IPv6 (aggressive) or RA Guard (network-level).

___

## Recursos

- [HackTricks - AD DNS](https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns) — pentest reference.
- [adidnsdump repo](https://github.com/dirkjanm/adidnsdump) — main tool.
- [krbrelayx repo](https://github.com/dirkjanm/krbrelayx) — dnstool.py + relay.
- [mitm6 repo](https://github.com/dirkjanm/mitm6) — IPv6 spoofing.
- [DirkJan blog - Combining DNS attacks](https://dirkjanm.io/) — research.
- [SpecterOps - DNS Attacks](https://posts.specterops.io/) — adversary research.
- [Microsoft DNS Architecture](https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-overview) — vendor docs.
- [RFC 1035 - DNS Implementation](https://datatracker.ietf.org/doc/html/rfc1035) — spec.
- [RFC 2782 - SRV Records](https://datatracker.ietf.org/doc/html/rfc2782) — SRV format.
- [RFC 5936 - DNS Zone Transfer](https://datatracker.ietf.org/doc/html/rfc5936) — AXFR spec.
- [The Hacker Recipes - DNS](https://www.thehacker.recipes/ad/recon/dns) — reference.
- [PingCastle DNS audit](https://www.pingcastle.com/) — defender side.
- [Sean Metcalf - DNS Security](https://adsecurity.org/?p=4124) — ADSecurity.
- [DnsAdmins privesc CVE-2017-7299](https://adsecurity.org/?p=4064) — historical.
- [BloodHound custom DNS edges](https://github.com/SpecterOps/BloodHound/issues) — community.

***
